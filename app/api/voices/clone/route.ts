import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { voices } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadToBlob } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    const userId = formData.get('userId') as string;
    const name = formData.get('name') as string;

    if (!audio) {
      return NextResponse.json(
        { error: 'Fichier audio requis' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Nom de la voix requis' },
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

    const userIdNum = parseInt(userId);

    // 1. Upload l'audio vers Vercel Blob
    const sampleUrl = await uploadToBlob(
      audio,
      `voices/${userId}/${Date.now()}-${audio.name}`
    );

    // 2. Créer l'entrée en base avec status 'cloning'
    const [newVoice] = await db
      .insert(voices)
      .values({
        userId: userIdNum,
        name,
        sampleUrl,
        status: 'cloning',
      })
      .returning();

    // 3. Cloner la voix sur ElevenLabs
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      await db
        .update(voices)
        .set({ status: 'failed', errorMessage: 'ELEVENLABS_API_KEY non configurée' })
        .where(eq(voices.id, newVoice.id));

      return NextResponse.json(
        { error: 'Configuration ElevenLabs manquante' },
        { status: 500 }
      );
    }

    // Préparer le FormData pour ElevenLabs
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('name', `${name}_${userId}_${Date.now()}`);
    elevenLabsFormData.append('files', audio, audio.name);

    // Optionnel: description
    elevenLabsFormData.append('description', `Voix clonée pour user ${userId}`);

    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
      body: elevenLabsFormData,
    });

    if (!elevenLabsResponse.ok) {
      const errorData = await elevenLabsResponse.json().catch(() => ({}));
      const errorMessage = errorData.detail?.message || errorData.detail || 'Erreur ElevenLabs';

      await db
        .update(voices)
        .set({ status: 'failed', errorMessage })
        .where(eq(voices.id, newVoice.id));

      return NextResponse.json(
        { error: `Erreur clonage ElevenLabs: ${errorMessage}` },
        { status: 500 }
      );
    }

    const elevenLabsData = await elevenLabsResponse.json();
    const elevenlabsVoiceId = elevenLabsData.voice_id;

    // 4. Mettre à jour avec le voice_id ElevenLabs
    const [updatedVoice] = await db
      .update(voices)
      .set({
        elevenlabsVoiceId,
        status: 'ready',
      })
      .where(eq(voices.id, newVoice.id))
      .returning();

    return NextResponse.json({
      success: true,
      voice: {
        id: updatedVoice.id,
        name: updatedVoice.name,
        elevenlabsVoiceId: updatedVoice.elevenlabsVoiceId,
        sampleUrl: updatedVoice.sampleUrl,
        status: updatedVoice.status,
      },
    });

  } catch (error) {
    console.error('Erreur clonage voix:', error);
    return NextResponse.json(
      { error: 'Erreur lors du clonage de la voix' },
      { status: 500 }
    );
  }
}

// GET - Récupérer les voix d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    const userVoices = await db
      .select()
      .from(voices)
      .where(eq(voices.userId, parseInt(userId)));

    return NextResponse.json({
      success: true,
      voices: userVoices,
    });

  } catch (error) {
    console.error('Erreur récupération voix:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des voix' },
      { status: 500 }
    );
  }
}
