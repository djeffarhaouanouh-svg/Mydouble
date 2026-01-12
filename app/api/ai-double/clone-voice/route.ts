import { NextRequest, NextResponse } from 'next/server';
import { uploadMultipleToBlob } from '@/lib/blob';
import { db } from '@/lib/db';
import { voiceSamples as voiceSamplesTable } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const name = formData.get('name') as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Récupérer tous les échantillons vocaux
    const voiceSamples: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('voice_') && value instanceof File) {
        voiceSamples.push(value);
      }
    }

    if (voiceSamples.length < 3) {
      return NextResponse.json(
        { error: 'Au moins 3 échantillons vocaux requis' },
        { status: 400 }
      );
    }

    // Uploader les échantillons vers Vercel Blob
    const uploadedUrls = await uploadMultipleToBlob(voiceSamples, `voice-samples/${userId}/`);

    // Sauvegarder les URLs dans la base de données
    const sampleRecords = uploadedUrls.map((url, index) => ({
      userId: parseInt(userId),
      filename: `sample_${index}.webm`,
      url: url,
    }));

    await db.insert(voiceSamplesTable).values(sampleRecords);

    // Appel à l'API ElevenLabs pour cloner la voix
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenlabsApiKey) {
      return NextResponse.json(
        { error: 'API Key ElevenLabs non configurée' },
        { status: 500 }
      );
    }

    // Créer un FormData pour ElevenLabs
    const elevenlabsFormData = new FormData();
    elevenlabsFormData.append('name', name || `Voice_${userId}`);
    
    // Ajouter les fichiers audio
    for (let i = 0; i < voiceSamples.length; i++) {
      const sample = voiceSamples[i];
      elevenlabsFormData.append('files', sample, `sample_${i}.webm`);
    }

    // Faire l'appel à ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
      },
      body: elevenlabsFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erreur ElevenLabs:', error);
      return NextResponse.json(
        { error: 'Erreur lors du clonage vocal' },
        { status: 500 }
      );
    }

    const result = await response.json();
    const voiceId = result.voice_id;

    // Sauvegarder le voiceId dans la base de données
    const { aiDoubles } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');

    await db.update(aiDoubles)
      .set({ voiceId: voiceId })
      .where(eq(aiDoubles.userId, parseInt(userId)));

    return NextResponse.json({
      success: true,
      voiceId,
      message: 'Voix clonée avec succès',
    });

  } catch (error) {
    console.error('Erreur lors du clonage:', error);
    return NextResponse.json(
      { error: 'Erreur lors du clonage vocal' },
      { status: 500 }
    );
  }
}
