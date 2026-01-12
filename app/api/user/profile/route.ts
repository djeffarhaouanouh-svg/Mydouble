import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, aiDoubles } from '@/lib/schema';
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

    // Récupérer l'utilisateur depuis la base de données
    const user = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le double IA de l'utilisateur
    const aiDouble = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    // Retourner les données dans un format compatible avec la page compte
    const profile = {
      id: user[0].id,
      name: user[0].name || null,
      email: user[0].email,
      avatarUrl: user[0].avatarUrl || null,
      createdAt: user[0].createdAt ? new Date(user[0].createdAt).toISOString() : new Date().toISOString(),
      personality: aiDouble[0]?.personality || null,
      styleRules: aiDouble[0]?.styleRules || null,
      voiceId: aiDouble[0]?.voiceId || null,
      vapiAssistantId: aiDouble[0]?.vapiAssistantId || null,
      messagesCount: aiDouble[0]?.messagesCount || 0,
      improvementLevel: aiDouble[0]?.improvementLevel || 0,
    };

    // Retourner aussi dans l'ancien format pour compatibilité
    return NextResponse.json({
      ...profile,
      user: profile, // Pour compatibilité avec d'autres pages
    });

  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du profil' },
      { status: 500 }
    );
  }
}
