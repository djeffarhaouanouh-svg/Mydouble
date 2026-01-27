import { NextRequest, NextResponse } from 'next/server';
import { CreditService } from '@/lib/credit-service';

// GET /api/credits/history?userId=123&limit=20 - Obtenir l'historique des transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') || '20';

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Ignorer les utilisateurs temporaires
    if (userId.startsWith('user_') || userId.startsWith('temp_')) {
      return NextResponse.json({
        success: true,
        transactions: [],
        isGuest: true,
      });
    }

    const userIdNum = parseInt(userId, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'UserId invalide' },
        { status: 400 }
      );
    }

    const transactions = await CreditService.getTransactionHistory(
      userIdNum,
      isNaN(limitNum) ? 20 : limitNum
    );

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error: unknown) {
    console.error('Erreur historique crédits:', error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}
