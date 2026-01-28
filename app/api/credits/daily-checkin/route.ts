import { NextRequest, NextResponse } from 'next/server';
import { CreditService } from '@/lib/credit-service';
import { CREDIT_CONFIG } from '@/lib/credits';

// POST /api/credits/daily-checkin - Claim daily check-in reward
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, streakDay } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Ignore temporary users
    if (userId.toString().startsWith('user_') || userId.toString().startsWith('temp_')) {
      return NextResponse.json(
        { error: 'Connexion requise pour réclamer des crédits' },
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

    // Calculate reward based on streak day (max at day 6)
    const rewards = CREDIT_CONFIG.dailyCheckinRewards;
    const rewardDay = Math.min(streakDay || 1, 6) as keyof typeof rewards;
    const creditsToAdd = rewards[rewardDay] || rewards[1];

    // Add credits to user account
    const result = await CreditService.addCredits(
      userIdNum,
      creditsToAdd,
      CREDIT_CONFIG.transactionTypes.DAILY_CHECKIN,
      `Bonus check-in jour ${streakDay}: +${creditsToAdd} crédits`
    );

    return NextResponse.json({
      success: true,
      creditsAdded: creditsToAdd,
      newBalance: result.newBalance,
      streakDay: streakDay,
    });
  } catch (error: unknown) {
    console.error('Erreur daily check-in:', error);
    return NextResponse.json(
      { error: 'Erreur lors du check-in quotidien' },
      { status: 500 }
    );
  }
}
