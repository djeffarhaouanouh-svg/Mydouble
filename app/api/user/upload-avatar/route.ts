import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadToBlob } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const avatarFile = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;

    if (!avatarFile) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien une image
    if (!avatarFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Uploader l'image vers Vercel Blob
    const avatarUrl = await uploadToBlob(
      avatarFile,
      `avatars/${userId}/${Date.now()}-${avatarFile.name}`
    );

    // Mettre à jour l'utilisateur dans la base de données
    await db
      .update(users)
      .set({ 
        avatarUrl: avatarUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, parseInt(userId)));

    return NextResponse.json({ avatarUrl });

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload de l\'avatar' },
      { status: 500 }
    );
  }
}
