import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, characters } from '@/lib/schema';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { getStaticCharacterById } from '@/lib/static-characters';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'UserId requis' }, { status: 400 });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json({ error: 'UserId invalide' }, { status: 400 });
    }

    // Récupérer les conversations groupées
    const groups = await db
      .select({
        characterId: messages.characterId,
        storyId: messages.storyId,
        lastMessageAt: sql<string>`MAX(${messages.createdAt})`,
        messageCount: sql<number>`COUNT(*)`,
      })
      .from(messages)
      .where(eq(messages.userId, userIdNum))
      .groupBy(messages.characterId, messages.storyId)
      .orderBy(desc(sql`MAX(${messages.createdAt})`));

    // Pour chaque groupe, récupérer le vrai dernier message
    const conversationsWithDetails = await Promise.all(
      groups.map(async (group) => {
        // Construire les conditions pour retrouver le dernier message
        const conditions = [eq(messages.userId, userIdNum)];
        if (group.characterId !== null) {
          conditions.push(eq(messages.characterId, group.characterId));
        } else {
          conditions.push(isNull(messages.characterId));
        }
        if (group.storyId !== null) {
          conditions.push(eq(messages.storyId, group.storyId));
        } else {
          conditions.push(isNull(messages.storyId));
        }

        // Récupérer le dernier message de cette conversation
        const [lastMsg] = await db
          .select({ content: messages.content })
          .from(messages)
          .where(and(...conditions))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Résoudre le nom et la photo du personnage
        let name = 'Avatar';
        let photoUrl = '/avatar-1.png';

        if (group.characterId) {
          const staticChar = getStaticCharacterById(group.characterId);
          if (staticChar) {
            name = staticChar.name;
            photoUrl = staticChar.photoUrl;
          } else {
            try {
              const [dbChar] = await db
                .select({ name: characters.name, photoUrl: characters.photoUrl })
                .from(characters)
                .where(eq(characters.id, group.characterId))
                .limit(1);
              if (dbChar) {
                name = dbChar.name;
                photoUrl = dbChar.photoUrl || '/avatar-1.png';
              }
            } catch {
              // Ignorer
            }
          }
        }

        const conversationId = group.storyId
          ? `story-${group.storyId}`
          : group.characterId
            ? `character-${group.characterId}`
            : `chat-unknown`;

        return {
          id: conversationId,
          characterId: group.characterId ? String(group.characterId) : null,
          storyId: group.storyId ? String(group.storyId) : null,
          name,
          photoUrl,
          lastMessage: lastMsg?.content || '',
          timestamp: group.lastMessageAt,
          messageCount: group.messageCount,
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
