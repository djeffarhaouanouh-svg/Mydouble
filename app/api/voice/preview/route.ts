import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceId, text } = body;

    if (!voiceId) {
      return NextResponse.json(
        { error: 'voiceId requis' },
        { status: 400 }
      );
    }

    const previewText = text || "Bonjour, je suis votre assistant vocal. Comment puis-je vous aider aujourd'hui?";

    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenlabsApiKey) {
      return NextResponse.json(
        { error: 'Clé API ElevenLabs non configurée' },
        { status: 500 }
      );
    }

    // Appeler l'API ElevenLabs Text-to-Speech
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenlabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: previewText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('ElevenLabs preview error:', ttsResponse.status, errorText);
      return NextResponse.json(
        { error: 'Erreur lors de la génération de l\'aperçu', details: errorText },
        { status: ttsResponse.status }
      );
    }

    // Retourner l'audio en tant que stream
    const audioBuffer = await ttsResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Erreur voice preview:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la prévisualisation de la voix' },
      { status: 500 }
    );
  }
}
