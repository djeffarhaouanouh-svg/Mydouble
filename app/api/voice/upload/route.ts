import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob } from '@/lib/blob';
import { db } from '@/lib/db';
import { voices, characters } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    const userId = formData.get('userId') as string | null;
    const characterId = formData.get('characterId') as string | null;

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

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'UserId invalide' },
        { status: 400 }
      );
    }

    // Récupérer le nom du personnage si characterId est fourni
    let voiceName = `Voix ${new Date().toLocaleDateString('fr-FR')}`;
    if (characterId) {
      const characterIdNum = parseInt(characterId, 10);
      if (!isNaN(characterIdNum)) {
        const character = await db
          .select({ name: characters.name })
          .from(characters)
          .where(eq(characters.id, characterIdNum))
          .limit(1);
        
        if (character && character.length > 0 && character[0].name) {
          // Extraire le prénom (premier mot) ou utiliser le nom complet
          const characterName = character[0].name;
          const firstName = characterName.split(' ')[0];
          voiceName = `Voix de ${firstName}`;
        }
      }
    }

    // Upload vers Vercel Blob
    const audioUrl = await uploadToBlob(
      audio,
      `voice/${userId}/${Date.now()}-${audio.name}`
    );

    // Créer une entrée dans la table voices avec status 'cloning'
    const [newVoice] = await db.insert(voices).values({
      userId: userIdNum,
      name: voiceName,
      sampleUrl: audioUrl,
      status: 'cloning', // Statut initial, sera mis à jour après clonage ElevenLabs
    }).returning();

    // Cloner la voix sur ElevenLabs en arrière-plan
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (elevenLabsApiKey) {
      // Appeler ElevenLabs de manière asynchrone (ne pas bloquer la réponse)
      (async () => {
        try {
          // Préparer le FormData pour ElevenLabs
          const elevenLabsFormData = new FormData();
          elevenLabsFormData.append('name', `${voiceName}_${userIdNum}_${Date.now()}`);
          elevenLabsFormData.append('files', audio, audio.name);
          elevenLabsFormData.append('description', `Voix clonée pour user ${userIdNum}`);

          const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
            method: 'POST',
            headers: {
              'xi-api-key': elevenLabsApiKey,
            },
            body: elevenLabsFormData,
          });

          if (elevenLabsResponse.ok) {
            const elevenLabsData = await elevenLabsResponse.json();
            const elevenlabsVoiceId = elevenLabsData.voice_id;

            // Mettre à jour la voix avec le voice_id ElevenLabs
            await db
              .update(voices)
              .set({
                elevenlabsVoiceId,
                status: 'ready',
              })
              .where(eq(voices.id, newVoice.id));
          } else {
            const errorData = await elevenLabsResponse.json().catch(() => ({}));
            const errorMessage = errorData.detail?.message || errorData.detail || 'Erreur ElevenLabs';

            // Mettre à jour avec le statut d'erreur
            await db
              .update(voices)
              .set({ 
                status: 'failed', 
                errorMessage: errorMessage.substring(0, 500) // Limiter la longueur
              })
              .where(eq(voices.id, newVoice.id));
          }
        } catch (error) {
          console.error('Erreur clonage ElevenLabs:', error);
          // Mettre à jour avec le statut d'erreur
          await db
            .update(voices)
            .set({ 
              status: 'failed', 
              errorMessage: error instanceof Error ? error.message.substring(0, 500) : 'Erreur inconnue'
            })
            .where(eq(voices.id, newVoice.id));
        }
      })();
    } else {
      // Si pas de clé API, mettre à jour le statut
      await db
        .update(voices)
        .set({ 
          status: 'failed', 
          errorMessage: 'ELEVENLABS_API_KEY non configurée' 
        })
        .where(eq(voices.id, newVoice.id));
    }

    return NextResponse.json({
      success: true,
      url: audioUrl,
      filename: audio.name,
      voiceId: newVoice.id, // Retourner l'ID de la voix créée
      status: 'cloning', // Le clonage est en cours
    });

  } catch (error) {
    console.error('Erreur upload voix:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier audio' },
      { status: 500 }
    );
  }
}
