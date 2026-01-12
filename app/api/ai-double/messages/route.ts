import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

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

    // Récupérer les messages depuis la base de données
    const userMessages = await db.select()
      .from(messages)
      .where(eq(messages.userId, parseInt(userId)))
      .orderBy(desc(messages.createdAt));

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
