import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const scenario = formData.get('scenario') as string | null;
    const userId = formData.get('userId') as string | null;

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo requise' },
        { status: 400 }
      );
    }

    if (!scenario || !scenario.trim()) {
      return NextResponse.json(
        { error: 'Description du scénario requise' },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien une image
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image (JPG, PNG, etc.)' },
        { status: 400 }
      );
    }

    // Upload vers Vercel Blob
    const photoUrl = await uploadToBlob(
      photo,
      `histoire/${userId || 'anonymous'}/${Date.now()}-${photo.name}`
    );

    // TODO: Sauvegarder dans la base de données si nécessaire
    // const userIdNum = parseInt(userId || '0');
    // if (!isNaN(userIdNum) && userIdNum > 0) {
    //   await db.insert(histoire).values({
    //     userId: userIdNum,
    //     photoUrl,
    //     scenario: scenario.trim(),
    //   });
    // }

    return NextResponse.json({
      success: true,
      photoUrl,
      scenario: scenario.trim(),
    });

  } catch (error) {
    console.error('Erreur upload histoire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload de l\'histoire' },
      { status: 500 }
    );
  }
}
