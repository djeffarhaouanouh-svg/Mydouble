import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

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

    // Utiliser une requête SQL directe pour éviter les erreurs si des colonnes n'existent pas
    const sqlClient = neon(process.env.DATABASE_URL!);
    
    // Récupérer les colonnes de base
    const userResult = await sqlClient(
      `SELECT id, email, name, password, created_at, updated_at FROM users WHERE id = $1 LIMIT 1`,
      [userIdNum]
    );
    
    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    const user = userResult[0];
    
    // Récupérer les colonnes optionnelles si elles existent
    let avatarUrl = null;
    let birthMonth = null;
    let birthDay = null;
    
    try {
      const optionalResult = await sqlClient(
        `SELECT avatar_url, birth_month, birth_day FROM users WHERE id = $1 LIMIT 1`,
        [userIdNum]
      );
      
      if (optionalResult && optionalResult.length > 0) {
        avatarUrl = optionalResult[0].avatar_url || null;
        birthMonth = optionalResult[0].birth_month || null;
        birthDay = optionalResult[0].birth_day || null;
      }
    } catch (e: any) {
      // Si les colonnes n'existent pas, on continue sans elles
      console.log('Colonnes optionnelles non disponibles (normal si migration non exécutée):', e?.message);
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
      id: user.id,
      name: user.name || null,
      email: user.email,
      avatarUrl: avatarUrl,
      birthMonth: birthMonth,
      birthDay: birthDay,
      createdAt: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString(),
      plan: subscription?.plan || 'free',
      subscriptionStatus: subscription?.status || null,
    };

    return NextResponse.json({
      ...profile,
      user: profile,
    });

  } catch (error: any) {
    console.error('Erreur lors du chargement du profil:', error);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du profil', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email, avatarUrl, birthMonth, birthDay } = body;

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

    // Récupérer l'utilisateur actuel pour comparer l'email
    // Utiliser une requête qui ne dépend pas des colonnes optionnelles
    const sqlClient = neon(process.env.DATABASE_URL!);
    const currentUserResult = await sqlClient(
      `SELECT id, email FROM users WHERE id = $1 LIMIT 1`,
      [userIdNum]
    );

    if (!currentUserResult || currentUserResult.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const currentUserEmail = currentUserResult[0].email;

    // Vérifier si l'email existe déjà (seulement si l'email change)
    if (email !== undefined && email !== null && email !== '' && email !== currentUserEmail) {
      // Vérifier le format de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Format d\'email invalide' },
          { status: 400 }
        );
      }

      const existingUserResult = await sqlClient(
        `SELECT id FROM users WHERE email = $1 LIMIT 1`,
        [email]
      );
      
      if (existingUserResult && existingUserResult.length > 0 && existingUserResult[0].id !== userIdNum) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    // Ne mettre à jour avatarUrl, birthMonth, birthDay que si les colonnes existent
    // On les mettra à jour avec une requête SQL directe si nécessaire
    const needsOptionalUpdate = (avatarUrl !== undefined) || (birthMonth !== undefined) || (birthDay !== undefined);
    
    // Mise à jour des colonnes de base
    if (Object.keys(updateData).length > 1) { // Plus que juste updatedAt
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userIdNum));
    } else {
      // Si on ne met à jour que updatedAt, utiliser SQL direct
      await sqlClient(`UPDATE users SET updated_at = NOW() WHERE id = $1`, [userIdNum]);
    }
    
    // Mise à jour des colonnes optionnelles si nécessaire
    if (needsOptionalUpdate) {
      try {
        const optionalUpdates: string[] = [];
        const optionalValues: any[] = [];
        let paramIndex = 1;
        
        if (avatarUrl !== undefined) {
          optionalUpdates.push(`avatar_url = $${paramIndex}`);
          optionalValues.push(avatarUrl);
          paramIndex++;
        }
        if (birthMonth !== undefined) {
          optionalUpdates.push(`birth_month = $${paramIndex}`);
          optionalValues.push(birthMonth);
          paramIndex++;
        }
        if (birthDay !== undefined) {
          optionalUpdates.push(`birth_day = $${paramIndex}`);
          optionalValues.push(birthDay);
          paramIndex++;
        }
        
        if (optionalUpdates.length > 0) {
          optionalValues.push(userIdNum);
          const whereParam = paramIndex;
          await sqlClient(
            `UPDATE users SET ${optionalUpdates.join(', ')} WHERE id = $${whereParam}`,
            optionalValues
          );
        }
      } catch (e: any) {
        // Si les colonnes n'existent pas, on ignore l'erreur
        console.log('Colonnes optionnelles non disponibles pour mise à jour:', e?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la mise à jour du profil', details: error?.message },
      { status: 500 }
    );
  }
}
