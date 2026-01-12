import { NextRequest, NextResponse } from 'next/server';
import { uploadMultipleToBlob } from '@/lib/blob';
import { db } from '@/lib/db';
import { voiceSamples as voiceSamplesTable, aiDoubles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;

    if (!userId) {
      // Essayer de récupérer depuis localStorage côté client, sinon utiliser un userId par défaut
      // Pour l'instant, on va demander le userId dans le formData
      return NextResponse.json(
        { error: 'UserId requis. Ajoute userId au FormData.' },
        { status: 400 }
      );
    }

    // Récupérer tous les fichiers audio
    const audioFiles: File[] = [];
    const audioData: Array<{ phraseId: string; text: string; type: string }> = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('audio_') && value instanceof File) {
        audioFiles.push(value);
        const phraseId = key.replace('audio_', '');
        audioData.push({
          phraseId,
          text: formData.get(`text_${phraseId}`) as string || '',
          type: formData.get(`type_${phraseId}`) as string || '',
        });
      }
    }

    if (audioFiles.length < 3) {
      return NextResponse.json(
        { error: 'Au moins 3 échantillons vocaux requis' },
        { status: 400 }
      );
    }

    // Uploader les échantillons vers Vercel Blob
    const uploadedUrls = await uploadMultipleToBlob(audioFiles, `voice-samples/${userId}/`);

    // Sauvegarder les URLs dans la base de données
    const sampleRecords = uploadedUrls.map((url, index) => ({
      userId: parseInt(userId),
      filename: `sample_${index}.webm`,
      url: url,
    }));

    await db.insert(voiceSamplesTable).values(sampleRecords);

    // Appel à l'API ElevenLabs pour créer la voix
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenlabsApiKey) {
      return NextResponse.json(
        { error: 'API Key ElevenLabs non configurée' },
        { status: 500 }
      );
    }

    // Créer un FormData pour ElevenLabs
    const elevenlabsFormData = new FormData();
    const voiceName = `Voice_${userId}_${Date.now()}`;
    elevenlabsFormData.append('name', voiceName);
    
    // Ajouter les fichiers audio
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      elevenlabsFormData.append('files', file, `sample_${i}.webm`);
    }

    // Faire l'appel à ElevenLabs API pour créer la voix
    const elevenlabsResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
      },
      body: elevenlabsFormData,
    });

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error('Erreur ElevenLabs:', errorText);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la voix sur ElevenLabs' },
        { status: 500 }
      );
    }

    const elevenlabsResult = await elevenlabsResponse.json();
    const voiceId = elevenlabsResult.voice_id;

    if (!voiceId) {
      console.error('Réponse ElevenLabs:', elevenlabsResult);
      return NextResponse.json(
        { error: 'Voice ID non retourné par ElevenLabs' },
        { status: 500 }
      );
    }

    // Mettre à jour ou créer le double IA avec le voiceId
    const existingDouble = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    if (existingDouble && existingDouble.length > 0) {
      // Mettre à jour le double existant
      await db.update(aiDoubles)
        .set({ voiceId: voiceId })
        .where(eq(aiDoubles.id, existingDouble[0].id));
    } else {
      // Si le double n'existe pas encore, on le créera à l'étape finale
      // Pour l'instant, on retourne juste le voiceId
    }

    // Créer ou mettre à jour l'assistant VAPI avec le voiceId
    let vapiAssistantId = null;
    try {
      const vapiApiKey = process.env.VAPI_API_KEY;
      if (vapiApiKey) {
        const assistantData = {
          name: `Double IA - User ${userId}`,
          model: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
            messages: [
              {
                role: 'system',
                content: `Tu es le double IA de l'utilisateur. Réponds de manière naturelle et conversationnelle.`,
              },
            ],
          },
          voice: {
            provider: 'elevenlabs',
            voiceId: voiceId,
          },
          firstMessage: 'Salut ! Je suis ton double IA. Comment ça va ?',
        };

        const existingAssistantId = existingDouble && existingDouble.length > 0 
          ? existingDouble[0].vapiAssistantId 
          : null;

        let vapiResponse;
        if (existingAssistantId) {
          // Mettre à jour l'assistant existant
          vapiResponse = await fetch(`https://api.vapi.ai/assistant/${existingAssistantId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${vapiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(assistantData),
          });
        } else {
          // Créer un nouvel assistant
          vapiResponse = await fetch('https://api.vapi.ai/assistant', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${vapiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(assistantData),
          });
        }

        if (vapiResponse.ok) {
          const vapiResult = await vapiResponse.json();
          vapiAssistantId = vapiResult.id || existingAssistantId;

          // Sauvegarder l'assistantId dans la base de données
          if (existingDouble && existingDouble.length > 0) {
            await db.update(aiDoubles)
              .set({ vapiAssistantId: vapiAssistantId })
              .where(eq(aiDoubles.id, existingDouble[0].id));
          }
        } else {
          const errorText = await vapiResponse.text();
          console.error('Erreur VAPI (non bloquant):', errorText);
        }
      }
    } catch (vapiError) {
      console.error('Erreur lors de la création de l\'assistant VAPI (non bloquant):', vapiError);
      // On continue même si VAPI échoue, car la voix est créée
    }

    return NextResponse.json({
      success: true,
      voiceId: voiceId,
      voiceName: voiceName,
      vapiAssistantId: vapiAssistantId,
      message: 'Voix créée avec succès sur ElevenLabs' + (vapiAssistantId ? ' et assistant VAPI configuré' : ''),
    });

  } catch (error) {
    console.error('Erreur lors de la création de la voix:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la voix' },
      { status: 500 }
    );
  }
}
