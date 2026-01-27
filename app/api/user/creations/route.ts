import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters, voices, stories } from '@/lib/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';

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

    // Récupérer les personnages
    const charactersList = await db
      .select()
      .from(characters)
      .where(eq(characters.userId, userIdNum))
      .orderBy(desc(characters.createdAt));

    // Récupérer les voix
    const voicesList = await db
      .select()
      .from(voices)
      .where(eq(voices.userId, userIdNum))
      .orderBy(desc(voices.createdAt));

    // Récupérer les personnages associés à chaque voix
    const voiceIds = voicesList.map(v => v.id);
    const charactersWithVoices = voiceIds.length > 0
      ? await db
          .select({
            characterId: characters.id,
            characterName: characters.name,
            voiceId: characters.voiceId,
          })
          .from(characters)
          .where(
            and(
              eq(characters.userId, userIdNum),
              inArray(characters.voiceId, voiceIds)
            )
          )
      : [];

    // Créer un map pour associer voiceId -> characterName
    const voiceToCharacterMap = new Map<number, string>();
    charactersWithVoices.forEach(char => {
      if (char.voiceId) {
        voiceToCharacterMap.set(char.voiceId, char.characterName);
      }
    });

    // Récupérer les histoires
    const storiesList = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, userIdNum))
      .orderBy(desc(stories.createdAt));

    return NextResponse.json({
      success: true,
      characters: charactersList.map(char => ({
        id: char.id,
        name: char.name,
        photoUrl: char.photoUrl,
        description: char.description,
        voiceId: char.voiceId,
        createdAt: char.createdAt ? new Date(char.createdAt).toISOString() : new Date().toISOString(),
      })),
      voices: voicesList.map(voice => {
        const characterName = voiceToCharacterMap.get(voice.id);
        // Extraire le prénom (premier mot du nom)
        const firstName = characterName ? characterName.split(' ')[0] : null;
        
        return {
          id: voice.id,
          name: voice.name,
          voiceId: voice.elevenlabsVoiceId,
          status: voice.status,
          sampleUrl: voice.sampleUrl,
          characterName: firstName || null, // Prénom du personnage associé
          createdAt: voice.createdAt ? new Date(voice.createdAt).toISOString() : new Date().toISOString(),
        };
      }),
      roleplays: storiesList.map(story => ({
        id: story.id,
        name: story.title,
        description: story.description,
        characterId: story.characterId,
        createdAt: story.createdAt ? new Date(story.createdAt).toISOString() : new Date().toISOString(),
      })),
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des créations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des créations' },
      { status: 500 }
    );
  }
}
