import { NextRequest, NextResponse } from 'next/server';
import { CreditService } from '@/lib/credit-service';

// GET /api/credits?userId=123 - Obtenir les infos crédits d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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
        balance: 0,
        totalEarned: 0,
        totalUsed: 0,
        plan: 'free',
        planName: 'Gratuit',
        monthlyCredits: 5,
        isGuest: true,
      });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'UserId invalide' },
        { status: 400 }
      );
    }

    const creditInfo = await CreditService.getCreditInfo(userIdNum);

    return NextResponse.json({
      success: true,
      ...creditInfo,
    });
  } catch (error: unknown) {
    console.error('Erreur récupération crédits:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des crédits' },
      { status: 500 }
    );
  }
}
