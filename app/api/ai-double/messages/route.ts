import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@/lib/schema';
import { eq, asc, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const personalityType = searchParams.get('personalityType');
    const lastOnly = searchParams.get('lastOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Construire les conditions de filtrage
    const conditions = [eq(messages.userId, parseInt(userId))];

    if (personalityType) {
      conditions.push(eq(messages.personalityType, personalityType));
    }

    // Si on veut seulement le dernier message
    if (lastOnly) {
      const lastMessage = await db.select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      return NextResponse.json({
        success: true,
        messages: lastMessage,
      });
    }

    // Récupérer tous les messages
    const userMessages = await db.select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({
      success: true,
      messages: userMessages,
    });

  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des messages' },
      { status: 500 }
    );
  }
}
