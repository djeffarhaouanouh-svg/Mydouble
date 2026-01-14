import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@/lib/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const personality = searchParams.get('personality');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Construire la condition WHERE
    let whereCondition;
    
    // Si une personnalité est spécifiée, filtrer par personnalité
    if (personality) {
      whereCondition = and(
        eq(messages.userId, parseInt(userId)),
        eq(messages.personality, personality)
      ) as any;
    } else {
      // Pour le double IA principal, les messages ont personality = NULL (ou pas de champ pour les anciens messages)
      whereCondition = and(
        eq(messages.userId, parseInt(userId)),
        isNull(messages.personality)
      ) as any;
    }

    // Récupérer les messages depuis la base de données, triés par date décroissante (le plus récent en premier)
    const userMessages = await db.select()
      .from(messages)
      .where(whereCondition)
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
