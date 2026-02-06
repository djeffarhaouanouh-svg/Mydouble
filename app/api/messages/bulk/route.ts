import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, conversations } = body;

    if (!userId) {
      return NextResponse.json({ error: 'UserId requis' }, { status: 400 });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json({ error: 'UserId invalide' }, { status: 400 });
    }

    if (!conversations || !Array.isArray(conversations)) {
      return NextResponse.json({ error: 'Conversations requises' }, { status: 400 });
    }

    let totalSynced = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const conv of conversations) {
      const characterId = conv.characterId ? parseInt(conv.characterId, 10) : null;
      const storyId = conv.storyId ? parseInt(conv.storyId, 10) : null;

      // Vérifier si cette conversation a déjà des messages en DB
      const conditions = [eq(messages.userId, userIdNum)];
      if (characterId !== null) conditions.push(eq(messages.characterId, characterId));
      if (storyId !== null) conditions.push(eq(messages.storyId, storyId));

      const existing = await db.select({ id: messages.id })
        .from(messages)
        .where(and(...conditions))
        .limit(1);

      if (existing.length > 0) {
        totalSkipped += conv.messages?.length || 0;
        continue;
      }

      // Insérer tous les messages de cette conversation
      if (conv.messages && conv.messages.length > 0) {
        for (const msg of conv.messages) {
          if (!msg.content || !msg.role) continue;
          try {
            await db.insert(messages).values({
              userId: userIdNum,
              characterId: characterId,
              storyId: storyId,
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content,
              audioUrl: msg.audioUrl || null,
              videoUrl: msg.videoUrl || null,
            });
            totalSynced++;
          } catch (insertError: any) {
            totalErrors++;
            console.error('Erreur insert message:', insertError?.message);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalSynced,
      totalSkipped,
      totalErrors,
    });

  } catch (error: any) {
    console.error('Erreur bulk sync:', error);
    return NextResponse.json(
      { error: 'Erreur lors du sync', details: error?.message },
      { status: 500 }
    );
  }
}
