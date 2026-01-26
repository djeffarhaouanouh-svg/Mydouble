import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters, users } from '@/lib/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const isPublicParam = searchParams.get('isPublic');

    // Récupérer les avatars publics (par défaut)
    let query = db
      .select()
      .from(characters)
      .where(eq(characters.isPublic, true))
      .orderBy(desc(characters.messagesCount));

    // Si isPublic est explicitement false, récupérer tous
    if (isPublicParam === 'false') {
      query = db
        .select()
        .from(characters)
        .orderBy(desc(characters.messagesCount));
    }

    // Appliquer limit et offset
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    if (offset) {
      const offsetNum = parseInt(offset, 10);
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        query = query.offset(offsetNum);
      }
    }

    const charactersList = await query;

    // Récupérer les informations des créateurs
    const userIds = [...new Set(charactersList.map(c => c.userId))];
    const creatorsMap = new Map();

    if (userIds.length > 0) {
      // Récupérer les créateurs en une seule requête avec filtre
      const creatorsList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      // Mapper les créateurs
      creatorsList.forEach(creator => {
        creatorsMap.set(creator.id, creator);
      });
    }

    // Formater les résultats
    const avatars = charactersList.map((character) => {
      const creator = creatorsMap.get(character.userId);
      
      return {
        id: character.id,
        name: character.name,
        photoUrl: character.photoUrl,
        messagesCount: character.messagesCount || 0,
        creator: {
          id: character.userId,
          name: creator?.name || null,
          email: creator?.email || null,
          // Format pour l'affichage: @username ou email
          displayName: creator?.name 
            ? `@${creator.name.toLowerCase().replace(/\s+/g, '')}` 
            : creator?.email 
              ? `@${creator.email.split('@')[0]}` 
              : 'Utilisateur inconnu',
        },
        createdAt: character.createdAt ? new Date(character.createdAt).toISOString() : null,
      };
    });

    return NextResponse.json({
      success: true,
      avatars,
      count: avatars.length,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des avatars:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avatars' },
      { status: 500 }
    );
  }
}
