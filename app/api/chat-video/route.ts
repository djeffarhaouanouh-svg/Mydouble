import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { videoMessages, characters, voices } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { uploadToBlob } from '@/lib/blob';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now(); // Début du timer global
  const timings = {
    claude: 0,
    elevenlabs: 0,
    blobUpload: 0,
    vmodel: 0,
    total: 0,
  };

  try {
    const body = await request.json();
    const { message, conversationHistory, characterId, storyPrompt } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      );
    }

    // Récupérer le personnage et sa voix si fourni
    let character = null;
    let voice = null;

    if (characterId) {
      // Convertir characterId en nombre si c'est une string
      const charIdNum = typeof characterId === 'string' ? parseInt(characterId, 10) : characterId;
      
      if (!isNaN(charIdNum)) {
        const charResult = await db.select()
          .from(characters)
          .where(eq(characters.id, charIdNum))
          .limit(1);

        if (charResult.length > 0) {
          character = charResult[0];

          if (character.voiceId) {
            const voiceResult = await db.select()
              .from(voices)
              .where(eq(voices.id, character.voiceId))
              .limit(1);
            voice = voiceResult.length > 0 ? voiceResult[0] : null;
          }
        }
      }
    }

    // Construire le prompt système
    let systemPrompt = storyPrompt || 'Tu es un assistant amical et serviable.';
    
    // Ajouter la contrainte de longueur
    const lengthConstraint = 'IMPORTANT: Réponds toujours en maximum 2 phrases. Sois concis et direct.';
    
    if (character?.description) {
      systemPrompt = `${character.description}\n\n${systemPrompt}\n\n${lengthConstraint}`;
    } else {
      systemPrompt = `${systemPrompt}\n\n${lengthConstraint}`;
    }

    // Construire les messages pour Claude
    const messages = [
      ...(conversationHistory || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Appeler Claude
    const claudeStart = Date.now();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150, // Limité à 150 tokens pour des réponses courtes (environ 2 phrases)
      system: systemPrompt,
      messages,
    });
    timings.claude = Date.now() - claudeStart;
    console.log(`⏱️ Claude: ${timings.claude}ms`);

    const aiResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Générer l'audio avec ElevenLabs
    let audioUrl = null;
    let audioBlobUrl = null; // URL publique pour VModel.ai
    let elevenlabsStatus = { success: false, error: null, audioSize: 0 };
    const elevenlabsVoiceId = voice?.elevenlabsVoiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'JSaCrNWxLT7qo7NXhgvF';

    if (process.env.ELEVENLABS_API_KEY && elevenlabsVoiceId) {
      try {
        const elevenlabsStart = Date.now();
        console.log('🎤 Appel ElevenLabs avec voiceId:', elevenlabsVoiceId);
        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${elevenlabsVoiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: aiResponse,
              model_id: 'eleven_multilingual_v2',
            }),
          }
        );

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
          elevenlabsStatus.success = true;
          elevenlabsStatus.audioSize = audioBuffer.byteLength;
          timings.elevenlabs = Date.now() - elevenlabsStart;
          console.log(`✅ ElevenLabs: Audio généré en ${timings.elevenlabs}ms, taille:`, audioBuffer.byteLength, 'bytes');

          // Uploader l'audio vers Blob Storage pour obtenir une URL publique
          try {
            const blobStart = Date.now();
            const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            audioBlobUrl = await uploadToBlob(
              audioBlob,
              `audio/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`
            );
            timings.blobUpload = Date.now() - blobStart;
            console.log(`✅ Audio uploadé vers Blob en ${timings.blobUpload}ms:`, audioBlobUrl);
          } catch (uploadError) {
            console.error('❌ Erreur upload audio:', uploadError);
            elevenlabsStatus.error = `Upload échoué: ${uploadError}`;
          }
        } else {
          const errorText = await ttsResponse.text();
          console.error('❌ ElevenLabs erreur:', ttsResponse.status, errorText);
          elevenlabsStatus.error = `HTTP ${ttsResponse.status}: ${errorText}`;
        }
      } catch (ttsError: any) {
        console.error('❌ Erreur TTS:', ttsError);
        elevenlabsStatus.error = ttsError?.message || 'Erreur inconnue';
      }
    } else {
      elevenlabsStatus.error = !process.env.ELEVENLABS_API_KEY 
        ? 'Pas de clé API ElevenLabs' 
        : 'Pas de voiceId configuré';
      console.error('❌ ElevenLabs non configuré:', elevenlabsStatus.error);
    }

    // Récupérer l'URL de l'avatar (photo du personnage ou avatar-1.png du dossier public)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let avatarUrl = character?.photoUrl || `${baseUrl}/avatar-1.png`;
    
    // Si l'avatar est une URL relative, la convertir en URL absolue
    if (avatarUrl && avatarUrl.startsWith('/')) {
      avatarUrl = `${baseUrl}${avatarUrl}`;
    }

    // Appeler VModel.ai pour créer la vidéo avec la photo et l'audio
    let vmodelTaskId = null;
    let vmodelStatus = { success: false, error: null, taskId: null };
    const vmodelApiToken = process.env.VMODEL_API_TOKEN || 'tf6d2u5kiMS0QKPrJz3FgzyJfvTyLGVzdHlFfDVxTL7iuegVbO_bTeKCiEURTjB5WjxyhN8ZSI8f6MRDGLcYiQ==';

    if (audioBlobUrl && vmodelApiToken) {
      try {
        const vmodelStart = Date.now();
        console.log('🎬 Appel VModel.ai avec:', { avatar: avatarUrl, speech: audioBlobUrl });
        const vmodelResponse = await fetch('https://api.vmodel.ai/api/tasks/v1/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vmodelApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'ae74513f15f2bb0e42acf4023d7cd6dbddd61242c5538b71f830a630aacf1c9d',
            input: {
              avatar: avatarUrl,
              speech: audioBlobUrl,
              resolution: '480', // 480p (480 pixels de hauteur)
            },
          }),
        });

        if (vmodelResponse.ok) {
          const vmodelData = await vmodelResponse.json();
          console.log('📦 VModel.ai réponse complète:', JSON.stringify(vmodelData, null, 2));
          
          // D'après la documentation VModel.ai, la réponse est :
          // { code: 200, result: { task_id: "...", task_cost: 10 }, message: { en: "..." } }
          vmodelTaskId = vmodelData.result?.task_id || null;
          
          if (vmodelTaskId) {
            timings.vmodel = Date.now() - vmodelStart;
            console.log(`✅ VModel.ai task créé en ${timings.vmodel}ms:`, vmodelTaskId);
            vmodelStatus.success = true;
            vmodelStatus.taskId = vmodelTaskId;
          } else {
            console.warn('⚠️ Aucun taskId trouvé dans la réponse VModel.ai.');
            console.warn('📋 Structure complète:', JSON.stringify(vmodelData, null, 2));
            console.warn('📋 Clés disponibles:', Object.keys(vmodelData));
            vmodelStatus.error = `Pas de taskId dans la réponse. Réponse: ${JSON.stringify(vmodelData).substring(0, 200)}`;
          }
        } else {
          const errorText = await vmodelResponse.text();
          console.error('❌ VModel.ai erreur:', vmodelResponse.status, errorText);
          vmodelStatus.error = `HTTP ${vmodelResponse.status}: ${errorText}`;
        }
      } catch (vmodelError: any) {
        console.error('❌ Erreur appel VModel.ai:', vmodelError);
        vmodelStatus.error = vmodelError?.message || 'Erreur inconnue';
      }
    } else {
      if (!audioBlobUrl) {
        vmodelStatus.error = 'Pas d\'URL audio (ElevenLabs a peut-être échoué)';
        console.error('❌ VModel.ai: Pas d\'audioBlobUrl disponible');
      }
      if (!vmodelApiToken) {
        vmodelStatus.error = 'Pas de clé API VModel.ai';
        console.error('❌ VModel.ai: Pas de token API');
      }
    }

    // Créer un job ID pour le tracking vidéo (utiliser le taskId de VModel si disponible)
    const jobId = vmodelTaskId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    timings.total = Date.now() - startTime;
    console.log('⏱️ Temps total (jusqu\'à la création de la tâche VModel):', {
      claude: `${timings.claude}ms`,
      elevenlabs: `${timings.elevenlabs}ms`,
      blobUpload: `${timings.blobUpload}ms`,
      vmodel: `${timings.vmodel}ms`,
      total: `${timings.total}ms (${(timings.total / 1000).toFixed(2)}s)`,
    });

    return NextResponse.json({
      success: true,
      aiResponse,
      audioUrl,
      jobId,
      vmodelTaskId,
      // Informations de debug pour le client
      debug: {
        elevenlabs: elevenlabsStatus,
        vmodel: vmodelStatus,
        audioBlobUrl: audioBlobUrl || null,
        avatarUrl: avatarUrl,
      },
      timings: {
        claude: timings.claude,
        elevenlabs: timings.elevenlabs,
        blobUpload: timings.blobUpload,
        vmodel: timings.vmodel,
        total: timings.total,
      },
      // videoUrl sera fourni plus tard via /api/chat-video/status
    });

  } catch (error) {
    console.error('Erreur chat-video:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la réponse' },
      { status: 500 }
    );
  }
}
