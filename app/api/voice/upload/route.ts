import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    const userId = formData.get('userId') as string | null;

    if (!audio) {
      return NextResponse.json(
        { error: 'Fichier audio requis' },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien un fichier audio
    if (!audio.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être un fichier audio (MP3, WAV, etc.)' },
        { status: 400 }
      );
    }

    // Upload vers Vercel Blob
    const audioUrl = await uploadToBlob(
      audio,
      `voice/${userId || 'anonymous'}/${Date.now()}-${audio.name}`
    );

    return NextResponse.json({
      success: true,
      url: audioUrl,
      filename: audio.name,
    });

  } catch (error) {
    console.error('Erreur upload voix:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier audio' },
      { status: 500 }
    );
  }
}
