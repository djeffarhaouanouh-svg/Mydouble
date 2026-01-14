import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiDoubles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// POST - Mettre à jour le MBTI directement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mbtiType } = body;

    if (!userId || !mbtiType) {
      return NextResponse.json(
        { error: 'userId et mbtiType requis' },
        { status: 400 }
      );
    }

    // Valider le type MBTI
    const validTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
    const upperMbti = mbtiType.toUpperCase();

    if (!validTypes.includes(upperMbti)) {
      return NextResponse.json(
        { error: 'Type MBTI invalide' },
        { status: 400 }
      );
    }

    // Mettre à jour le MBTI
    await db.update(aiDoubles)
      .set({ mbtiType: upperMbti })
      .where(eq(aiDoubles.userId, parseInt(userId)));

    return NextResponse.json({
      success: true,
      message: `MBTI mis à jour: ${upperMbti}`,
      mbtiType: upperMbti
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du MBTI:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du MBTI' },
      { status: 500 }
    );
  }
}
