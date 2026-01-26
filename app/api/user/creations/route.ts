import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { avatarVisioAssets, aiDoubles } from '@/lib/schema';
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

    // Récupérer les personnages (avatar visio)
    const characters = await db.select()
      .from(avatarVisioAssets)
      .where(eq(avatarVisioAssets.userId, userIdNum))
      .orderBy(desc(avatarVisioAssets.createdAt));

    // Récupérer les voix (ai doubles avec voiceId)
    const voices = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, userIdNum))
      .orderBy(desc(aiDoubles.createdAt));

    // Formater les personnages
    const formattedCharacters = characters.map(char => ({
      id: char.id,
      name: char.personalityPrompt ? char.personalityPrompt.substring(0, 50) + '...' : 'Personnage sans nom',
      photoUrl: char.photoUrl,
      voiceId: char.voiceId,
      createdAt: char.createdAt ? new Date(char.createdAt).toISOString() : new Date().toISOString(),
    }));

    // Formater les voix
    const formattedVoices = voices
      .filter(voice => voice.voiceId) // Seulement celles avec une voix
      .map(voice => ({
        id: voice.id,
        voiceId: voice.voiceId,
        personality: voice.personality,
        createdAt: voice.createdAt ? new Date(voice.createdAt).toISOString() : new Date().toISOString(),
      }));

    // Pour les jeux de rôles, on utilise les personnages comme base
    // (on pourrait créer une table dédiée plus tard)
    const roleplays = formattedCharacters.map(char => ({
      id: char.id,
      name: char.name,
      characterId: char.id,
      createdAt: char.createdAt,
    }));

    return NextResponse.json({
      characters: formattedCharacters,
      voices: formattedVoices,
      roleplays: roleplays,
    });

  } catch (error) {
    console.error('Erreur lors du chargement des créations:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des créations' },
      { status: 500 }
    );
  }
}
