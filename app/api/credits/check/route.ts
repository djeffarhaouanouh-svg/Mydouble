import { NextRequest, NextResponse } from 'next/server';
import { CreditService } from '@/lib/credit-service';

// POST /api/credits/check - Vérifier si l'utilisateur a assez de crédits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount } = body;

    if (!userId || amount === undefined) {
      return NextResponse.json(
        { error: 'userId et amount requis' },
        { status: 400 }
      );
    }

    // Ignorer les utilisateurs temporaires
    if (typeof userId === 'string' && (userId.startsWith('user_') || userId.startsWith('temp_'))) {
      return NextResponse.json({
        success: true,
        hasEnoughCredits: false,
        currentBalance: 0,
        required: amount,
        missing: amount,
        isGuest: true,
        message: 'Connectez-vous pour utiliser vos crédits',
      });
    }

    const userIdNum = parseInt(userId, 10);
    const amountNum = parseInt(amount, 10);

    if (isNaN(userIdNum) || isNaN(amountNum)) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      );
    }

    const hasEnough = await CreditService.hasEnoughCredits(userIdNum, amountNum);
    const balance = await CreditService.getBalance(userIdNum);

    return NextResponse.json({
      success: true,
      hasEnoughCredits: hasEnough,
      currentBalance: balance,
      required: amountNum,
      missing: hasEnough ? 0 : amountNum - balance,
    });
  } catch (error: unknown) {
    console.error('Erreur vérification crédits:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
