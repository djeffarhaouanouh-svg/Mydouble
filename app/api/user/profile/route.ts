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

    // Valider que userId est un nombre valide
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'UserId invalide' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le double IA de l'utilisateur (peut ne pas exister)
    let aiDouble = null;
    try {
      const aiDoubleResult = await db.select()
        .from(aiDoubles)
        .where(eq(aiDoubles.userId, userIdNum))
        .limit(1);
      
      aiDouble = aiDoubleResult.length > 0 ? aiDoubleResult[0] : null;
    } catch (aiDoubleError) {
      // Si la requête échoue, on continue sans le double IA
      console.error('Erreur lors de la récupération du double IA:', aiDoubleError);
      aiDouble = null;
    }

    // Retourner les données dans un format compatible avec la page compte
    const profile = {
      id: user[0].id,
      name: user[0].name || null,
      email: user[0].email,
      avatarUrl: user[0].avatarUrl || null,
      birthMonth: user[0].birthMonth || null,
      birthDay: user[0].birthDay || null,
      createdAt: user[0].createdAt ? new Date(user[0].createdAt).toISOString() : new Date().toISOString(),
      personality: aiDouble?.personality || null,
      styleRules: aiDouble?.styleRules || null,
      voiceId: aiDouble?.voiceId || null,
      vapiAssistantId: aiDouble?.vapiAssistantId || null,
      messagesCount: aiDouble?.messagesCount || 0,
      improvementLevel: aiDouble?.improvementLevel || 0,
    };

    // Retourner aussi dans l'ancien format pour compatibilité
    return NextResponse.json({
      ...profile,
      user: profile, // Pour compatibilité avec d'autres pages
    });

  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Détails de l\'erreur:', { errorMessage, errorStack });

    return NextResponse.json(
      {
        error: 'Erreur lors du chargement du profil',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour le profil utilisateur
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, avatarUrl, birthMonth, birthDay } = body;

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

    // Préparer les données à mettre à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (birthMonth !== undefined) updateData.birthMonth = birthMonth;
    if (birthDay !== undefined) updateData.birthDay = birthDay;

    // Mettre à jour l'utilisateur
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userIdNum));

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
