import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, birthMonth, birthDay } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    // Vérifier la connexion à la base de données
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur avec date de naissance si fournie
      const userData: any = {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
      };
      
      // Ajouter la date de naissance si fournie
      if (birthMonth && birthDay) {
        userData.birthMonth = parseInt(birthMonth.toString());
        userData.birthDay = parseInt(birthDay.toString());
        console.log('Sauvegarde date de naissance lors de l\'inscription:', { birthMonth, birthDay });
      }
      
      const newUser = await db.insert(users).values(userData).returning();

      return NextResponse.json({
        success: true,
        userId: newUser[0].id,
        message: 'Compte créé avec succès',
      });
    } catch (dbError: any) {
      console.error('Erreur base de données:', dbError);
      
      // Vérifier si c'est une erreur de connexion
      if (dbError.message?.includes('DATABASE_URL') || dbError.message?.includes('connection')) {
        return NextResponse.json(
          { error: 'Erreur de connexion à la base de données. Vérifiez votre configuration DATABASE_URL.' },
          { status: 500 }
        );
      }
      
      // Vérifier si c'est une erreur de contrainte (email déjà utilisé)
      if (dbError.code === '23505' || dbError.message?.includes('unique') || dbError.message?.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
      
      // Autre erreur de base de données
      return NextResponse.json(
        { error: `Erreur base de données: ${dbError.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', error);
    
    // Erreur de parsing JSON
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'Format de données invalide' },
        { status: 400 }
      );
    }
    
    // Erreur générique
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de l\'inscription',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
