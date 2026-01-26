import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'JobId requis' },
        { status: 400 }
      );
    }

    // Pour l'instant, on simule un status "completed" sans vidéo
    // La génération vidéo (lipsync) nécessite un service externe comme Wav2Lip

    return NextResponse.json({
      jobId,
      status: 'completed',
      videoUrl: null, // Pas de vidéo générée pour l'instant
    });

  } catch (error) {
    console.error('Erreur status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}
