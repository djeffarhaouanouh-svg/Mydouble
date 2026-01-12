import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiDoubles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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

    // Récupérer les doubles IA de l'utilisateur depuis la base de données
    const doubles = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)));

    return NextResponse.json({
      success: true,
      doubles: doubles,
    });

  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des doubles IA' },
      { status: 500 }
    );
  }
}
