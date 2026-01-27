import { db } from '@/lib/db';
import { credits, creditTransactions, subscriptions } from '@/lib/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { CREDIT_CONFIG, PlanType, TransactionType } from '@/lib/credits';

export class CreditService {
  /**
   * Obtenir le solde de crédits d'un utilisateur
   */
  static async getBalance(userId: number): Promise<number> {
    const result = await db.select()
      .from(credits)
      .where(eq(credits.userId, userId))
      .limit(1);

    return result[0]?.balance ?? 0;
  }

  /**
   * Obtenir les informations complètes des crédits
   */
  static async getCreditInfo(userId: number) {
    const creditResult = await db.select()
      .from(credits)
      .where(eq(credits.userId, userId))
      .limit(1);

    const subResult = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    const plan = (subResult[0]?.plan as PlanType) || 'free';
    const planConfig = CREDIT_CONFIG.plans[plan];

    return {
      balance: creditResult[0]?.balance ?? 0,
      totalEarned: creditResult[0]?.totalEarned ?? 0,
      totalUsed: creditResult[0]?.totalUsed ?? 0,
      lastRefillAt: creditResult[0]?.lastRefillAt,
      plan,
      planName: planConfig.name,
      monthlyCredits: planConfig.monthlyCredits,
      nextRefillAt: subResult[0]?.currentPeriodEnd,
    };
  }

  /**
   * Vérifier si l'utilisateur a assez de crédits
   */
  static async hasEnoughCredits(userId: number, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Initialiser les crédits pour un nouvel utilisateur
   */
  static async initializeCredits(userId: number): Promise<void> {
    const signupBonus = CREDIT_CONFIG.plans.free.signupBonus;

    // Vérifier si l'utilisateur a déjà des crédits
    const existing = await db.select()
      .from(credits)
      .where(eq(credits.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return; // Déjà initialisé
    }

    // Créer l'enregistrement de crédits
    await db.insert(credits).values({
      userId,
      balance: signupBonus,
      totalEarned: signupBonus,
      totalUsed: 0,
    });

    // Créer la transaction de bonus
    if (signupBonus > 0) {
      await db.insert(creditTransactions).values({
        userId,
        amount: signupBonus,
        type: CREDIT_CONFIG.transactionTypes.SIGNUP_BONUS,
        description: `Bonus d'inscription: ${signupBonus} crédits`,
        balanceBefore: 0,
        balanceAfter: signupBonus,
      });
    }

    // Créer l'abonnement gratuit par défaut
    const existingSub = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existingSub.length === 0) {
      await db.insert(subscriptions).values({
        userId,
        plan: 'free',
        status: 'active',
        monthlyCredits: CREDIT_CONFIG.plans.free.monthlyCredits,
      });
    }
  }

  /**
   * Déduire des crédits (pour génération vidéo)
   */
  static async deductCredits(
    userId: number,
    amount: number,
    videoMessageId?: number,
    description?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const currentBalance = await this.getBalance(userId);

    if (currentBalance < amount) {
      return {
        success: false,
        newBalance: currentBalance,
        error: 'Crédits insuffisants',
      };
    }

    const newBalance = currentBalance - amount;

    // Mettre à jour le solde
    await db.update(credits)
      .set({
        balance: newBalance,
        totalUsed: sql`${credits.totalUsed} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(credits.userId, userId));

    // Enregistrer la transaction
    await db.insert(creditTransactions).values({
      userId,
      amount: -amount,
      type: CREDIT_CONFIG.transactionTypes.VIDEO_GENERATION,
      description: description || `Génération vidéo: -${amount} crédit(s)`,
      relatedVideoMessageId: videoMessageId || null,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
    });

    return { success: true, newBalance };
  }

  /**
   * Ajouter des crédits (recharge abonnement ou achat)
   */
  static async addCredits(
    userId: number,
    amount: number,
    type: TransactionType,
    description?: string
  ): Promise<{ success: boolean; newBalance: number }> {
    // Vérifier si l'utilisateur a un enregistrement de crédits
    const existing = await db.select()
      .from(credits)
      .where(eq(credits.userId, userId))
      .limit(1);

    let currentBalance = 0;

    if (existing.length === 0) {
      // Créer l'enregistrement
      await db.insert(credits).values({
        userId,
        balance: amount,
        totalEarned: amount,
        totalUsed: 0,
        lastRefillAt: type === CREDIT_CONFIG.transactionTypes.SUBSCRIPTION_REFILL ? new Date() : null,
      });
    } else {
      currentBalance = existing[0].balance;
      const newBalance = currentBalance + amount;

      // Mettre à jour le solde
      await db.update(credits)
        .set({
          balance: newBalance,
          totalEarned: sql`${credits.totalEarned} + ${amount}`,
          lastRefillAt: type === CREDIT_CONFIG.transactionTypes.SUBSCRIPTION_REFILL ? new Date() : credits.lastRefillAt,
          updatedAt: new Date(),
        })
        .where(eq(credits.userId, userId));
    }

    const newBalance = currentBalance + amount;

    // Enregistrer la transaction
    await db.insert(creditTransactions).values({
      userId,
      amount,
      type,
      description: description || `Ajout de ${amount} crédit(s)`,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
    });

    return { success: true, newBalance };
  }

  /**
   * Recharger les crédits mensuels (pour un utilisateur)
   */
  static async refillMonthlyCredits(userId: number): Promise<{ success: boolean; creditsAdded: number }> {
    const subResult = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subResult[0] || subResult[0].status !== 'active') {
      return { success: false, creditsAdded: 0 };
    }

    const plan = subResult[0].plan as PlanType;
    const monthlyCredits = CREDIT_CONFIG.plans[plan]?.monthlyCredits || 0;

    if (monthlyCredits > 0) {
      await this.addCredits(
        userId,
        monthlyCredits,
        CREDIT_CONFIG.transactionTypes.SUBSCRIPTION_REFILL,
        `Recharge mensuelle ${CREDIT_CONFIG.plans[plan].name}: +${monthlyCredits} crédits`
      );
    }

    return { success: true, creditsAdded: monthlyCredits };
  }

  /**
   * Obtenir l'historique des transactions
   */
  static async getTransactionHistory(userId: number, limit: number = 20) {
    return db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit);
  }

  /**
   * Mettre à jour le plan d'abonnement
   */
  static async updateSubscription(
    userId: number,
    plan: PlanType,
    paypalSubscriptionId?: string,
    paypalPayerId?: string
  ): Promise<void> {
    const planConfig = CREDIT_CONFIG.plans[plan];
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Vérifier si l'abonnement existe
    const existingSub = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existingSub.length === 0) {
      // Créer l'abonnement
      await db.insert(subscriptions).values({
        userId,
        plan,
        status: 'active',
        paypalSubscriptionId: paypalSubscriptionId || null,
        paypalPayerId: paypalPayerId || null,
        monthlyCredits: planConfig.monthlyCredits,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    } else {
      // Mettre à jour l'abonnement
      await db.update(subscriptions)
        .set({
          plan,
          status: 'active',
          paypalSubscriptionId: paypalSubscriptionId || existingSub[0].paypalSubscriptionId,
          paypalPayerId: paypalPayerId || existingSub[0].paypalPayerId,
          monthlyCredits: planConfig.monthlyCredits,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.userId, userId));
    }

    // Ajouter les crédits du plan
    await this.addCredits(
      userId,
      planConfig.monthlyCredits,
      CREDIT_CONFIG.transactionTypes.SUBSCRIPTION_REFILL,
      `Activation ${planConfig.name}: +${planConfig.monthlyCredits} crédits`
    );
  }
}
