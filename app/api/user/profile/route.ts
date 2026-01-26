import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/schema';
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

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'UserId invalide' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
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

    // Récupérer l'abonnement (optionnel)
    let subscription = null;
    try {
      const subResult = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userIdNum))
        .limit(1);
      subscription = subResult.length > 0 ? subResult[0] : null;
    } catch {
      subscription = null;
    }

    const profile = {
      id: user[0].id,
      name: user[0].name || null,
      email: user[0].email,
      avatarUrl: user[0].avatarUrl || null,
      birthMonth: user[0].birthMonth || null,
      birthDay: user[0].birthDay || null,
      createdAt: user[0].createdAt ? new Date(user[0].createdAt).toISOString() : new Date().toISOString(),
      plan: subscription?.plan || 'free',
      subscriptionStatus: subscription?.status || null,
    };

    return NextResponse.json({
      ...profile,
      user: profile,
    });

  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du profil' },
      { status: 500 }
    );
  }
}

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

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (birthMonth !== undefined) updateData.birthMonth = birthMonth;
    if (birthDay !== undefined) updateData.birthDay = birthDay;

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
