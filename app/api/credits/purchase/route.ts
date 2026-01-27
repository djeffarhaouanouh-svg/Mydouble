import { NextRequest, NextResponse } from 'next/server';
import { CreditService } from '@/lib/credit-service';
import { CREDIT_CONFIG } from '@/lib/credits';

// POST /api/credits/purchase - Acheter des crédits à l'unité
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, orderId, credits, amount } = body;

    if (!userId || !orderId || !credits || !amount) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Ignorer les utilisateurs temporaires
    if (userId.startsWith('user_') || userId.startsWith('temp_')) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'UserId invalide' },
        { status: 400 }
      );
    }

    // Valider le nombre de crédits (packs valides)
    const validPacks = [10, 30, 60, 150];
    if (!validPacks.includes(credits)) {
      return NextResponse.json(
        { error: 'Pack de crédits invalide' },
        { status: 400 }
      );
    }

    // Ajouter les crédits au compte
    const result = await CreditService.addCredits(
      userIdNum,
      credits,
      CREDIT_CONFIG.transactionTypes.PURCHASE,
      `Achat de ${credits} crédits (PayPal: ${orderId})`
    );

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      creditsAdded: credits,
    });
  } catch (error: unknown) {
    console.error('Erreur achat crédits:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'achat des crédits' },
      { status: 500 }
    );
  }
}
