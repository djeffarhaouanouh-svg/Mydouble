import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stories, users, characters } from '@/lib/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const isPublicParam = searchParams.get('isPublic');

    // Récupérer les scénarios (stories)
    const query = db
      .select()
      .from(stories)
      .orderBy(desc(stories.createdAt))
      .$dynamic();

    // Appliquer limit et offset
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query.limit(limitNum);
      }
    }

    if (offset) {
      const offsetNum = parseInt(offset, 10);
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        query.offset(offsetNum);
      }
    }

    const storiesList = await query;

    // Récupérer les informations des créateurs et des personnages
    const userIds = [...new Set(storiesList.map(s => s.userId))];
    const characterIds = [...new Set(storiesList.map(s => s.characterId).filter(id => id !== null))];
    
    const creatorsMap = new Map();
    const charactersMap = new Map();

    if (userIds.length > 0) {
      const creatorsList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      creatorsList.forEach(creator => {
        creatorsMap.set(creator.id, creator);
      });
    }

    if (characterIds.length > 0) {
      const charactersList = await db
        .select({
          id: characters.id,
          name: characters.name,
          photoUrl: characters.photoUrl,
        })
        .from(characters)
        .where(inArray(characters.id, characterIds as number[]));

      charactersList.forEach(character => {
        charactersMap.set(character.id, character);
      });
    }

    // Formater les résultats
    const formattedStories = storiesList.map((story) => {
      const creator = creatorsMap.get(story.userId);
      const character = story.characterId ? charactersMap.get(story.characterId) : null;
      
      return {
        id: story.id,
        title: story.title,
        description: story.description || null,
        characterId: story.characterId || null,
        character: character ? {
          id: character.id,
          name: character.name,
          photoUrl: character.photoUrl,
        } : null,
        creator: {
          id: story.userId,
          name: creator?.name || null,
          email: creator?.email || null,
          displayName: creator?.name 
            ? `@${creator.name.toLowerCase().replace(/\s+/g, '')}` 
            : creator?.email 
              ? `@${creator.email.split('@')[0]}` 
              : 'Utilisateur inconnu',
        },
        createdAt: story.createdAt ? new Date(story.createdAt).toISOString() : null,
      };
    });

    return NextResponse.json({
      success: true,
      stories: formattedStories,
      count: formattedStories.length,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des scénarios:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des scénarios' },
      { status: 500 }
    );
  }
}
