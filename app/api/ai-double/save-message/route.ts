import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, aiDoubles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, messagesList } = body;

    if (!userId || !messagesList || !Array.isArray(messagesList)) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // Sauvegarder les messages dans la base de données
    const messagesToInsert = messagesList.map((msg: any) => ({
      userId: parseInt(userId),
      role: msg.role,
      content: msg.content,
      audioUrl: msg.audioUrl || null,
    }));

    await db.insert(messages).values(messagesToInsert);

    // Incrémenter le compteur de messages
    const aiDouble = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    if (aiDouble && aiDouble.length > 0) {
      await db.update(aiDoubles)
        .set({
          messagesCount: (aiDouble[0].messagesCount || 0) + messagesList.length,
          improvementLevel: Math.min(100, (aiDouble[0].improvementLevel || 0) + Math.floor(messagesList.length / 10))
        })
        .where(eq(aiDoubles.id, aiDouble[0].id));
    }

    return NextResponse.json({
      success: true,
      message: 'Messages sauvegardés',
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}
