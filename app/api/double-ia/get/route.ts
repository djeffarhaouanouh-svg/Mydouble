import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiDoubles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    if (!userId && !id) {
      return NextResponse.json(
        { error: 'UserId ou id requis' },
        { status: 400 }
      );
    }

    let double;

    if (id) {
      // Récupérer par ID du double
      const doubles = await db.select()
        .from(aiDoubles)
        .where(eq(aiDoubles.id, parseInt(id)))
        .limit(1);
      
      double = doubles[0];
    } else {
      // Récupérer par userId (le plus récent)
      const doubles = await db.select()
        .from(aiDoubles)
        .where(eq(aiDoubles.userId, parseInt(userId!)))
        .orderBy(aiDoubles.createdAt)
        .limit(1);
      
      double = doubles[0];
    }

    if (!double) {
      return NextResponse.json(
        { error: 'Double IA non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      double,
    });

  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du double IA' },
      { status: 500 }
    );
  }
}
