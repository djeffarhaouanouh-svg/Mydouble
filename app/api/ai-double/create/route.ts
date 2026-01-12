import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiDoubles } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, personality, styleRules, voiceId } = body;

    if (!userId || !personality) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // Sauvegarder le double IA dans la base de données Neon
    const result = await db.insert(aiDoubles).values({
      userId: parseInt(userId),
      personality: personality,
      styleRules: styleRules || null,
      voiceId: voiceId || null,
      messagesCount: 0,
      improvementLevel: 0,
    }).returning();

    return NextResponse.json({
      success: true,
      aiDouble: result[0],
      message: 'Double IA créé avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la création:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du double IA' },
      { status: 500 }
    );
  }
}
