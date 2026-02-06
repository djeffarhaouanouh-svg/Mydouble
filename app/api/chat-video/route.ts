import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob } from '@/lib/blob';
import { CreditService } from '@/lib/credit-service';
import { CREDIT_CONFIG } from '@/lib/credits';
import { getStaticCharacterById } from '@/lib/static-characters';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  const startTime = Date.now(); // Début du timer global
  const timings = {
    deepseek: 0,
    elevenlabs: 0,
    blobUpload: 0,
    vmodel: 0,
    total: 0,
  };

  try {
    const body = await request.json();
    const { message, conversationHistory, characterId, storyPrompt, userId, textOnly } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      );
    }

    // === VÉRIFICATION DES CRÉDITS (sauf en mode textOnly : vidéo à la demande) ===
    const creditCost = CREDIT_CONFIG.costs.videoGeneration480p; // 1 crédit pour 480p
    let userIdNum: number | null = null;

    if (!textOnly && userId && !String(userId).startsWith('user_') && !String(userId).startsWith('temp_')) {
      userIdNum = parseInt(String(userId), 10);

      if (!isNaN(userIdNum)) {
        const hasCredits = await CreditService.hasEnoughCredits(userIdNum, creditCost);

        if (!hasCredits) {
          const balance = await CreditService.getBalance(userIdNum);
          return NextResponse.json({
            error: 'Crédits insuffisants',
            errorCode: 'INSUFFICIENT_CREDITS',
            currentBalance: balance,
            required: creditCost,
            message: `Vous n'avez pas assez de crédits. Solde actuel: ${balance}, Requis: ${creditCost}`,
          }, { status: 402 }); // 402 Payment Required
        }
      }
    }
    // === FIN VÉRIFICATION DES CRÉDITS ===

    // Récupérer le personnage depuis les données statiques
    let character = null;

    if (characterId) {
      // Convertir characterId en nombre si c'est une string
      const charIdNum = typeof characterId === 'string' ? parseInt(characterId, 10) : characterId;

      if (!isNaN(charIdNum)) {
        character = getStaticCharacterById(charIdNum);
        if (character) {
          console.log('🎭 Character trouvé (statique):', { id: character.id, name: character.name, systemPrompt: character.systemPrompt });
        }
      }
    }

    // Construire le prompt système personnalisé pour ce character
    // Priorité: character.systemPrompt > character.description > storyPrompt > défaut
    const defaultPrompt = 'Tu es un assistant amical et serviable.';
    const lengthConstraint = 'IMPORTANT: Réponds toujours en maximum 2 phrases. Sois concis et direct.';

    let systemPrompt: string;

    if (character?.systemPrompt) {
      // Utiliser le prompt système personnalisé du character
      systemPrompt = `${character.systemPrompt}\n\n${lengthConstraint}`;
      console.log('✅ System prompt utilisé:', character.systemPrompt);
    } else if (character?.description) {
      console.log('⚠️ Pas de systemPrompt, utilisation de description:', character?.description);
      // Fallback sur la description du character
      systemPrompt = `${character.description}\n\n${storyPrompt || defaultPrompt}\n\n${lengthConstraint}`;
    } else {
      // Fallback sur le storyPrompt ou le défaut
      systemPrompt = `${storyPrompt || defaultPrompt}\n\n${lengthConstraint}`;
    }

    // Construire les messages pour DeepSeek (format OpenAI: system en premier message)
    // Limiter à 20 derniers messages de l'historique pour le contexte
    const historyMessages = (conversationHistory || []).slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const chatMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message },
    ];

    // Appeler DeepSeek (API compatible OpenAI)
    const deepseekStart = Date.now();
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY non configurée' }, { status: 500 });
    }
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 150,
        messages: chatMessages,
      }),
    });
    timings.deepseek = Date.now() - deepseekStart;
    console.log(`⏱️ DeepSeek: ${timings.deepseek}ms`);

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return NextResponse.json(
        { error: 'Erreur DeepSeek', details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse =
      data.choices?.[0]?.message?.content?.trim() ?? '';

    // Mode textOnly : retourner uniquement la réponse texte (audio/vidéo à la demande via le bouton play)
    if (textOnly) {
      return NextResponse.json({
        success: true,
        aiResponse,
        textOnly: true,
      });
    }

    // Générer l'audio avec ElevenLabs
    let audioUrl = null;
    let audioBlobUrl = null; // URL publique pour VModel.ai
    let elevenlabsStatus: { success: boolean; error: string | null; audioSize: number } = { success: false, error: null, audioSize: 0 };
    // Priorité: elevenlabsVoiceId sur le personnage > voix clonée > défaut
    const elevenlabsVoiceId = character?.elevenlabsVoiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'JSaCrNWxLT7qo7NXhgvF';

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
    let avatarUrl = character?.vmodelImageUrl || character?.photoUrl || `${baseUrl}/avatar-1.png`;

    // Si l'avatar est une URL relative, la convertir en URL absolue
    if (avatarUrl && avatarUrl.startsWith('/')) {
      avatarUrl = `${baseUrl}${avatarUrl}`;
    }

    // VModel doit pouvoir télécharger l'avatar : si l'URL est locale (localhost), on l'upload sur Blob
    const isLocalAvatar = avatarUrl && (avatarUrl.includes('localhost') || avatarUrl.includes('127.0.0.1'));
    if (isLocalAvatar && avatarUrl && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const avatarResponse = await fetch(avatarUrl);
        if (avatarResponse.ok) {
          const avatarBuffer = await avatarResponse.arrayBuffer();
          const avatarBlob = new Blob([avatarBuffer], { type: avatarResponse.headers.get('content-type') || 'image/png' });
          avatarUrl = await uploadToBlob(avatarBlob, `avatars/mia-${Date.now()}.png`);
          console.log('✅ Avatar local uploadé vers Blob pour VModel:', avatarUrl);
        }
      } catch (uploadErr) {
        console.error('❌ Erreur upload avatar vers Blob:', uploadErr);
      }
    }

    // Appeler VModel.ai pour créer la vidéo avec la photo et l'audio
    let vmodelTaskId = null;
    let vmodelStatus: { success: boolean; error: string | null; taskId: string | null } = { success: false, error: null, taskId: null };
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
      deepseek: `${timings.deepseek}ms`,
      elevenlabs: `${timings.elevenlabs}ms`,
      blobUpload: `${timings.blobUpload}ms`,
      vmodel: `${timings.vmodel}ms`,
      total: `${timings.total}ms (${(timings.total / 1000).toFixed(2)}s)`,
    });

    // === DÉDUCTION DES CRÉDITS ===
    let creditDeducted = false;
    let newCreditBalance: number | null = null;

    if (userIdNum && vmodelTaskId) {
      const deductResult = await CreditService.deductCredits(
        userIdNum,
        creditCost,
        undefined, // videoMessageId - pourrait être ajouté plus tard
        `Génération vidéo (480p)`
      );
      creditDeducted = deductResult.success;
      newCreditBalance = deductResult.newBalance;
      console.log(`💳 Crédits déduits: ${creditCost}, nouveau solde: ${newCreditBalance}`);
    }
    // === FIN DÉDUCTION DES CRÉDITS ===

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
        deepseek: timings.deepseek,
        elevenlabs: timings.elevenlabs,
        blobUpload: timings.blobUpload,
        vmodel: timings.vmodel,
        total: timings.total,
      },
      // Infos crédits
      credits: {
        deducted: creditDeducted,
        cost: creditCost,
        newBalance: newCreditBalance,
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
