import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@/lib/schema';
import { eq, asc, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, characterId, storyId, role, content, audioUrl, videoUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role et contenu requis' },
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

    // Insérer le message dans la base de données
    const [savedMessage] = await db.insert(messages).values({
      userId: userIdNum,
      characterId: characterId ? parseInt(characterId, 10) : null,
      storyId: storyId ? parseInt(storyId, 10) : null,
      role: role,
      content: content,
      audioUrl: audioUrl || null,
      videoUrl: videoUrl || null,
    }).returning();

    return NextResponse.json({
      success: true,
      message: savedMessage,
    });

  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde du message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde du message', details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const characterId = searchParams.get('characterId');
    const storyId = searchParams.get('storyId');

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

    // Construire la requête avec and() pour combiner les conditions
    const conditions = [eq(messages.userId, userIdNum)];
    
    if (characterId) {
      conditions.push(eq(messages.characterId, parseInt(characterId, 10)));
    }

    if (storyId) {
      conditions.push(eq(messages.storyId, parseInt(storyId, 10)));
    }

    const allMessages = await db.select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({
      success: true,
      messages: allMessages,
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, videoUrl } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: 'MessageId requis' },
        { status: 400 }
      );
    }

    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      return NextResponse.json(
        { error: 'MessageId invalide' },
        { status: 400 }
      );
    }

    // Mettre à jour le message avec l'URL de la vidéo
    const [updatedMessage] = await db
      .update(messages)
      .set({ videoUrl: videoUrl || null })
      .where(eq(messages.id, messageIdNum))
      .returning();

    if (!updatedMessage) {
      return NextResponse.json(
        { error: 'Message non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du message', details: error?.message },
      { status: 500 }
    );
  }
}
