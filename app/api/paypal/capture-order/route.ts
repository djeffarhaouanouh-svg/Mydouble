import { NextRequest, NextResponse } from 'next/server';
import { getPayPalAccessToken, getPayPalBaseUrl } from '@/lib/paypal';
import { CreditService } from '@/lib/credit-service';
import { PlanType, CREDIT_CONFIG } from '@/lib/credits';
import { db } from '@/lib/db';
import { affiliates, referralSales } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId, plan, affiliateRef } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Valider le plan
    const validPlans: PlanType[] = ['free', 'premium', 'pro'];
    const selectedPlan: PlanType = validPlans.includes(plan) ? plan : 'premium';

    const accessToken = await getPayPalAccessToken();

    // Capturer le paiement
    const response = await fetch(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal capture error:', errorData);
      return NextResponse.json(
        { error: 'Failed to capture PayPal order', details: errorData },
        { status: 500 }
      );
    }

    const captureData = await response.json();

    // Vérifier que le paiement est complété
    if (captureData.status === 'COMPLETED') {
      // Mettre à jour l'abonnement et ajouter les crédits
      const userIdNum = parseInt(userId, 10);
      if (!isNaN(userIdNum)) {
        try {
          await CreditService.updateSubscription(
            userIdNum,
            selectedPlan,
            captureData.id, // PayPal transaction ID
            captureData.payer?.payer_id
          );
          console.log(`✅ Abonnement ${selectedPlan} activé pour l'utilisateur ${userIdNum}`);
        } catch (creditError) {
          console.error('Erreur mise à jour crédits:', creditError);
          // On ne bloque pas le paiement si la mise à jour des crédits échoue
        }

        // --- Système d'affiliation ---
        if (affiliateRef) {
          try {
            await recordAffiliateSale(
              affiliateRef,
              userIdNum,
              selectedPlan,
              captureData.id
            );
          } catch (affiliateError) {
            console.error('Erreur enregistrement vente affiliée (non bloquante):', affiliateError);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Paiement effectué avec succès!',
        hasPremiumAccess: true,
        transactionId: captureData.id,
        plan: selectedPlan,
      });
    }

    return NextResponse.json(
      { error: 'Payment not completed', status: captureData.status },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture payment', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Enregistre une vente affiliée après un paiement réussi
 */
async function recordAffiliateSale(
  refCode: string,
  buyerUserId: number,
  plan: PlanType,
  paypalOrderId: string
) {
  // Chercher l'affilié par code
  const affiliate = await db
    .select()
    .from(affiliates)
    .where(
      and(
        eq(affiliates.code, refCode.toUpperCase()),
        eq(affiliates.isActive, true)
      )
    )
    .limit(1);

  if (affiliate.length === 0) {
    console.log(`Code affilié "${refCode}" introuvable ou inactif`);
    return;
  }

  const aff = affiliate[0];

  // Anti-auto-parrainage : vérifier que l'acheteur n'est pas l'affilié
  if (aff.userId && aff.userId === buyerUserId) {
    console.log(`Auto-parrainage bloqué : utilisateur ${buyerUserId} avec code ${refCode}`);
    return;
  }

  // Calculer le montant en centimes
  const planConfig = CREDIT_CONFIG.plans[plan];
  const amountCents = Math.round(planConfig.priceMonthly * 100);

  if (amountCents <= 0) {
    return; // Pas de commission sur un plan gratuit
  }

  // Calculer la commission
  const commissionCents = Math.round((amountCents * aff.commissionRate) / 100);

  // Enregistrer la vente
  await db.insert(referralSales).values({
    affiliateId: aff.id,
    userId: buyerUserId,
    paypalOrderId,
    amount: amountCents,
    commissionAmount: commissionCents,
    plan,
  });

  // Mettre à jour le total gagné de l'affilié
  await db
    .update(affiliates)
    .set({
      totalEarned: sql`${affiliates.totalEarned} + ${commissionCents}`,
    })
    .where(eq(affiliates.id, aff.id));

  console.log(
    `✅ Vente affiliée enregistrée : ${refCode} → ${commissionCents}c de commission sur ${amountCents}c (plan ${plan})`
  );
}
