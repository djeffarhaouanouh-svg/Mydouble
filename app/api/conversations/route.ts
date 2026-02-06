import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, characters } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getStaticCharacterById } from '@/lib/static-characters';

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

    // Récupérer les conversations distinctes groupées par characterId/storyId
    // avec le dernier message et la date
    const conversationsRaw = await db
      .select({
        characterId: messages.characterId,
        storyId: messages.storyId,
        lastMessage: sql<string>`(
          SELECT content FROM messages m2
          WHERE m2.user_id = ${userIdNum}
            AND (m2.character_id IS NOT DISTINCT FROM ${messages.characterId})
            AND (m2.story_id IS NOT DISTINCT FROM ${messages.storyId})
          ORDER BY m2.created_at DESC
          LIMIT 1
        )`,
        lastMessageAt: sql<string>`MAX(${messages.createdAt})`,
        messageCount: sql<number>`COUNT(*)`,
      })
      .from(messages)
      .where(eq(messages.userId, userIdNum))
      .groupBy(messages.characterId, messages.storyId)
      .orderBy(desc(sql`MAX(${messages.createdAt})`));

    // Enrichir avec les infos des personnages
    const conversationsWithDetails = await Promise.all(
      conversationsRaw.map(async (conv) => {
        let name = 'Avatar';
        let photoUrl = '/avatar-1.png';
        let isCreatedCharacter = false;

        if (conv.characterId) {
          // D'abord chercher dans les personnages statiques
          const staticChar = getStaticCharacterById(conv.characterId);
          if (staticChar) {
            name = staticChar.name;
            photoUrl = staticChar.photoUrl;
          } else {
            // Sinon chercher dans la DB (personnage créé)
            try {
              const [dbChar] = await db
                .select({ name: characters.name, photoUrl: characters.photoUrl })
                .from(characters)
                .where(eq(characters.id, conv.characterId))
                .limit(1);
              if (dbChar) {
                name = dbChar.name;
                photoUrl = dbChar.photoUrl || '/avatar-1.png';
                isCreatedCharacter = true;
              }
            } catch {
              // Ignorer les erreurs de lookup
            }
          }
        }

        const conversationId = conv.storyId
          ? `story-${conv.storyId}`
          : conv.characterId
            ? `character-${conv.characterId}`
            : `chat-unknown`;

        return {
          id: conversationId,
          characterId: conv.characterId ? String(conv.characterId) : null,
          storyId: conv.storyId ? String(conv.storyId) : null,
          name,
          photoUrl,
          lastMessage: conv.lastMessage || '',
          timestamp: conv.lastMessageAt,
          messageCount: conv.messageCount,
          isCreatedCharacter,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: conversationsWithDetails,
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des conversations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des conversations', details: error?.message },
      { status: 500 }
    );
  }
}
