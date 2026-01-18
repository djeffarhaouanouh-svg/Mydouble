import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { avatarVisioAssets } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateUsage } from '@/lib/visio/usage';

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

    const userIdNum = parseInt(userId);

    // Récupérer l'usage
    const usage = await getOrCreateUsage(userIdNum);

    // Vérifier si l'utilisateur a un avatar
    const assets = await db
      .select()
      .from(avatarVisioAssets)
      .where(eq(avatarVisioAssets.userId, userIdNum))
      .limit(1);

    const hasAvatar = assets.length > 0;
    const avatarStatus = hasAvatar ? (assets[0].heygenAvatarStatus || 'none') : 'none';

    return NextResponse.json({
      success: true,
      usage: {
        usedSeconds: usage.usedSeconds,
        quotaSeconds: usage.quotaSeconds,
        remainingSeconds: usage.remainingSeconds,
        percentUsed: Math.round(usage.percentUsed * 10) / 10,
        monthYear: usage.monthYear,
        usedMinutes: Math.floor(usage.usedSeconds / 60),
        remainingMinutes: Math.floor(usage.remainingSeconds / 60),
        quotaMinutes: Math.floor(usage.quotaSeconds / 60),
      },
      hasAvatar,
      avatarStatus,
    });

  } catch (error) {
    console.error('Erreur récupération usage:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'usage' },
      { status: 500 }
    );
  }
}
