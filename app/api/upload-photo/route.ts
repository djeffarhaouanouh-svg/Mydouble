import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photoFile = formData.get('photo') as File | null;
    const userId = formData.get('userId') as string;

    if (!photoFile) {
      return NextResponse.json(
        { error: 'Photo requise' },
        { status: 400 }
      );
    }

    if (!photoFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    const userIdNum = userId ? parseInt(userId, 10) : Date.now();

    const photoUrl = await uploadToBlob(
      photoFile,
      `characters/${userIdNum}/${Date.now()}-${photoFile.name}`
    );

    return NextResponse.json({
      success: true,
      photoUrl,
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload de la photo' },
      { status: 500 }
    );
  }
}
