import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters, users } from '@/lib/schema';
import { eq, desc, inArray, or } from 'drizzle-orm';
import { uploadToBlob } from '@/lib/blob';

// En-têtes pour autoriser l'accès sans restriction (navigation privée, CORS)
const publicHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=60',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: publicHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const isPublicParam = searchParams.get('isPublic');
    const userId = searchParams.get('userId');

    // Construire la requête selon les conditions
    const limitNum = limit ? parseInt(limit, 10) : null;
    const offsetNum = offset ? parseInt(offset, 10) : null;
    
    let charactersList;
    
    if (isPublicParam === 'false') {
      // Pas de condition where - récupérer tous (usage interne / utilisateur connecté)
      const baseQuery = db
        .select()
        .from(characters)
        .orderBy(desc(characters.messagesCount));
      
      if (limitNum && !isNaN(limitNum) && limitNum > 0 && offsetNum !== null && !isNaN(offsetNum) && offsetNum >= 0) {
        charactersList = await baseQuery.limit(limitNum).offset(offsetNum);
      } else if (limitNum && !isNaN(limitNum) && limitNum > 0) {
        charactersList = await baseQuery.limit(limitNum);
      } else if (offsetNum !== null && !isNaN(offsetNum) && offsetNum >= 0) {
        charactersList = await baseQuery.offset(offsetNum);
      } else {
        charactersList = await baseQuery;
      }
    } else {
      // isPublic === 'true' ou non fourni : toujours retourner les avatars publics (sans connexion requise)
      // Si un userId valide est fourni, inclure aussi les personnages de cet utilisateur
      const userIdNum = userId ? parseInt(userId, 10) : NaN;
      const includeUserCharacters = !isNaN(userIdNum);
      
      const baseQuery = db
        .select()
        .from(characters)
        .where(
          includeUserCharacters
            ? or(eq(characters.isPublic, true), eq(characters.userId, userIdNum))
            : eq(characters.isPublic, true)
        )
        .orderBy(desc(characters.messagesCount));
      
      if (limitNum && !isNaN(limitNum) && limitNum > 0 && offsetNum !== null && !isNaN(offsetNum) && offsetNum >= 0) {
        charactersList = await baseQuery.limit(limitNum).offset(offsetNum);
      } else if (limitNum && !isNaN(limitNum) && limitNum > 0) {
        charactersList = await baseQuery.limit(limitNum);
      } else if (offsetNum !== null && !isNaN(offsetNum) && offsetNum >= 0) {
        charactersList = await baseQuery.offset(offsetNum);
      } else {
        charactersList = await baseQuery;
      }
    }

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

    const res = NextResponse.json({
      success: true,
      avatars,
      count: avatars.length,
    });
    Object.entries(publicHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;

  } catch (error) {
    console.error('Erreur lors de la récupération des avatars:', error);
    const res = NextResponse.json(
      { error: 'Erreur lors de la récupération des avatars' },
      { status: 500 }
    );
    Object.entries(publicHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const userId = formData.get('userId') as string;
    const photoFile = formData.get('photo') as File | null;
    const photoUrl = formData.get('photoUrl') as string | null;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom du personnage est requis' },
        { status: 400 }
      );
    }

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

    // Vérifier que l'utilisateur existe (sélectionner uniquement les colonnes nécessaires)
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    let finalPhotoUrl: string;

    // Si un fichier photo est fourni, l'uploader
    if (photoFile) {
      if (!photoFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Le fichier doit être une image' },
          { status: 400 }
        );
      }

      finalPhotoUrl = await uploadToBlob(
        photoFile,
        `characters/${userIdNum}/${Date.now()}-${photoFile.name}`
      );
    } else if (photoUrl) {
      // Si une URL est fournie (image déjà uploadée)
      finalPhotoUrl = photoUrl;
    } else {
      // Image par défaut si aucune photo n'est fournie
      finalPhotoUrl = '/avatar-1.png';
    }

    // Créer le personnage dans la base de données
    const [newCharacter] = await db.insert(characters).values({
      userId: userIdNum,
      name: name.trim(),
      photoUrl: finalPhotoUrl,
      description: description?.trim() || null,
      isPublic: false, // Par défaut, privé
      messagesCount: 0,
    }).returning();

    return NextResponse.json({
      success: true,
      character: {
        id: newCharacter.id,
        name: newCharacter.name,
        photoUrl: newCharacter.photoUrl,
        description: newCharacter.description,
        createdAt: newCharacter.createdAt ? new Date(newCharacter.createdAt).toISOString() : null,
      },
    });

  } catch (error) {
    console.error('Erreur lors de la création du personnage:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du personnage' },
      { status: 500 }
    );
  }
}
