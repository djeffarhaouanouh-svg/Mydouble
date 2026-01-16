import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Fichier audio requis' },
        { status: 400 }
      );
    }

    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenlabsApiKey) {
      return NextResponse.json(
        { error: 'API Key ElevenLabs non configurée' },
        { status: 500 }
      );
    }

    // Créer le FormData pour ElevenLabs
    const elevenlabsFormData = new FormData();
    elevenlabsFormData.append('file', audioFile);
    elevenlabsFormData.append('model_id', 'scribe_v1');

    // Appeler l'API Speech-to-Text d'ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
      },
      body: elevenlabsFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erreur ElevenLabs STT:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la transcription audio' },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      text: result.text,
    });

  } catch (error) {
    console.error('Erreur lors de la transcription:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la transcription audio' },
      { status: 500 }
    );
  }
}
