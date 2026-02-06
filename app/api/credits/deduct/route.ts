import { NextRequest, NextResponse } from 'next/server';
import { CreditService } from '@/lib/credit-service';

// POST /api/credits/deduct - Déduire des crédits pour un utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkUserId, amount, description } = body;

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Ignorer les utilisateurs temporaires
    if (clerkUserId.startsWith('user_') || clerkUserId.startsWith('temp_')) {
      return NextResponse.json({
        success: false,
        error: 'Compte invité - veuillez vous connecter',
        currentBalance: 0,
      }, { status: 402 });
    }

    const userIdNum = parseInt(clerkUserId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, error: 'UserId invalide' },
        { status: 400 }
      );
    }

    const amountNum = parseInt(amount, 10) || 10;

    // Vérifier le solde actuel
    const currentBalance = await CreditService.getBalance(userIdNum);

    if (currentBalance < amountNum) {
      return NextResponse.json({
        success: false,
        error: 'Crédits insuffisants',
        currentBalance,
        required: amountNum,
      }, { status: 402 });
    }

    // Déduire les crédits
    const result = await CreditService.deductCredits(
      userIdNum,
      amountNum,
      undefined,
      description || `Déblocage contenu: -${amountNum} crédit(s)`
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur lors de la déduction',
        currentBalance: result.newBalance,
      }, { status: 402 });
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      deducted: amountNum,
    });
  } catch (error: unknown) {
    console.error('Erreur déduction crédits:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déduction des crédits' },
      { status: 500 }
    );
  }
}
