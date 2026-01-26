import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { voices } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

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

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'UserId invalide' },
        { status: 400 }
      );
    }

    // Récupérer les voix de l'utilisateur, triées par date de création (plus récentes en premier)
    const userVoices = await db
      .select()
      .from(voices)
      .where(eq(voices.userId, userIdNum))
      .orderBy(desc(voices.createdAt));

    // Formater les résultats
    const formattedVoices = userVoices.map((voice) => ({
      id: voice.id,
      name: voice.name,
      elevenlabsVoiceId: voice.elevenlabsVoiceId || null,
      sampleUrl: voice.sampleUrl || null,
      status: voice.status || 'pending',
      errorMessage: voice.errorMessage || null,
      createdAt: voice.createdAt ? new Date(voice.createdAt).toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      voices: formattedVoices,
      count: formattedVoices.length,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des voix:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des voix' },
      { status: 500 }
    );
  }
}
