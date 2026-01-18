import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Vérifier la connexion à la base de données
    try {
      // Récupérer l'utilisateur avec tous les champs
      const user = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        password: users.password,
      })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || user.length === 0) {
        console.log(`[LOGIN] Utilisateur non trouvé pour l'email: ${email}`);
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        );
      }

      const userData = user[0];
      console.log(`[LOGIN] Utilisateur trouvé: ID=${userData.id}, Email=${userData.email}`);
      console.log(`[LOGIN] Password présent: ${!!userData.password}, Longueur: ${userData.password?.length || 0}`);
      console.log(`[LOGIN] Password hash (premiers 30 caractères): ${userData.password?.substring(0, 30) || 'N/A'}...`);

      // Vérifier si l'utilisateur a un mot de passe
      if (!userData.password) {
        console.error('[LOGIN] Utilisateur sans mot de passe:', email);
        return NextResponse.json(
          { error: 'Compte invalide. Veuillez réinitialiser votre mot de passe.' },
          { status: 401 }
        );
      }

      // Vérifier que le hash a la bonne longueur (bcrypt hash fait 60 caractères)
      if (userData.password.length < 50) {
        console.error(`[LOGIN] Hash de mot de passe suspect (trop court): ${userData.password.length} caractères`);
        console.error(`[LOGIN] Hash complet: ${userData.password}`);
      }

      // Nettoyer le mot de passe (supprimer les espaces en début/fin)
      const cleanedPassword = password.trim();
      
      // Vérifier le mot de passe
      console.log(`[LOGIN] Comparaison du mot de passe pour l'utilisateur ${userData.id}`);
      console.log(`[LOGIN] Mot de passe fourni (longueur): ${cleanedPassword.length} caractères`);
      console.log(`[LOGIN] Hash stocké (longueur): ${userData.password.length} caractères`);
      console.log(`[LOGIN] Hash stocké (début): ${userData.password.substring(0, 30)}...`);
      
      // Essayer la comparaison
      let isValidPassword = false;
      try {
        isValidPassword = await bcrypt.compare(cleanedPassword, userData.password);
        console.log(`[LOGIN] Résultat de la comparaison: ${isValidPassword}`);
      } catch (bcryptError: any) {
        console.error(`[LOGIN] Erreur lors de la comparaison bcrypt:`, bcryptError);
        return NextResponse.json(
          { error: 'Erreur lors de la vérification du mot de passe' },
          { status: 500 }
        );
      }
      
      if (!isValidPassword) {
        console.error(`[LOGIN] Échec de la comparaison pour l'utilisateur ${userData.id}`);
        console.error(`[LOGIN] Email utilisé: ${email}`);
        console.error(`[LOGIN] Hash stocké (complet): ${userData.password}`);
        
        // Essayer aussi avec le mot de passe non nettoyé (au cas où)
        const isValidPasswordUncleaned = await bcrypt.compare(password, userData.password);
        if (isValidPasswordUncleaned) {
          console.log(`[LOGIN] ⚠️ La comparaison fonctionne avec le mot de passe non nettoyé (espaces?)`);
        }
      }

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        userId: userData.id,
        userName: userData.name,
        userEmail: userData.email,
        message: 'Connexion réussie',
      });
    } catch (dbError: any) {
      console.error('Erreur base de données lors de la connexion:', dbError);
      
      // Vérifier si c'est une erreur de connexion
      if (dbError.message?.includes('DATABASE_URL') || dbError.message?.includes('connection')) {
        return NextResponse.json(
          { error: 'Erreur de connexion à la base de données. Vérifiez votre configuration DATABASE_URL.' },
          { status: 500 }
        );
      }
      
      // Autre erreur de base de données
      return NextResponse.json(
        { error: `Erreur base de données: ${dbError.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error);
    
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
        error: error.message || 'Erreur lors de la connexion',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
