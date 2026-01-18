import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { avatarVisioAssets, aiDoubles, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadToBlob } from '@/lib/blob';
import { createVideoAvatarProvider } from '@/lib/providers/heygen';
import { consumeQuota, getOrCreateUsage, updateSession } from '@/lib/visio/usage';
import { ProviderError } from '@/lib/providers/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    const userId = formData.get('userId') as string;
    const sessionId = formData.get('sessionId') as string;

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio requis' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    // 1. Vérifier le quota
    const usage = await getOrCreateUsage(userIdNum);
    if (usage.remainingSeconds <= 0) {
      return NextResponse.json(
        { error: 'Quota de minutes épuisé pour ce mois', code: 'QUOTA_EXCEEDED' },
        { status: 402 }
      );
    }

    // 2. Récupérer l'asset avatar
    const assets = await db
      .select()
      .from(avatarVisioAssets)
      .where(eq(avatarVisioAssets.userId, userIdNum))
      .limit(1);

    if (assets.length === 0 || !assets[0].heygenAvatarId) {
      return NextResponse.json(
        { error: 'Avatar non configuré. Veuillez d\'abord créer votre avatar.' },
        { status: 404 }
      );
    }

    const asset = assets[0];

    // 3. Speech-to-Text avec ElevenLabs
    const userText = await transcribeAudio(audio);

    if (!userText || userText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Aucun texte détecté dans l\'audio' },
        { status: 400 }
      );
    }

    // 4. Récupérer le contexte utilisateur pour Claude
    const aiDouble = await db
      .select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, userIdNum))
      .limit(1);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1);

    // 5. Générer la réponse avec Claude
    const aiResponse = await generateClaudeResponse(
      userText,
      asset.personalityPrompt || '',
      aiDouble[0] || null,
      user[0]?.name || ''
    );

    // 6. Text-to-Speech avec ElevenLabs
    const voiceId = asset.voiceId || aiDouble[0]?.voiceId || null;
    let audioUrl: string | null = null;

    if (voiceId) {
      audioUrl = await generateTTS(aiResponse, voiceId);
    } else {
      // Utiliser une voix par défaut si pas de voix clonée
      audioUrl = await generateTTS(aiResponse, 'EXAVITQu4vr4xnSDxMaL'); // Voix par défaut ElevenLabs
    }

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Erreur lors de la génération audio' },
        { status: 500 }
      );
    }

    // 7. Générer la vidéo avec HeyGen
    let videoUrl: string | null = null;
    let videoDuration = 0;

    try {
      const provider = createVideoAvatarProvider('heygen');

      // Lancer la génération
      const videoResult = await provider.generateTalkingVideo(
        asset.heygenAvatarId!,
        audioUrl
      );

      // Attendre que la vidéo soit prête (polling)
      const finalResult = await provider.waitForVideo(videoResult.videoId);

      if (finalResult.status === 'ready' && finalResult.videoUrl) {
        videoUrl = finalResult.videoUrl;
        videoDuration = finalResult.duration || 5;
      }
    } catch (error) {
      console.error('Erreur génération vidéo HeyGen:', error);
      // En cas d'erreur HeyGen, on retourne quand même l'audio
      // Le frontend peut afficher l'idle loop + audio
    }

    // 8. Mettre à jour le quota et la session
    if (videoDuration > 0) {
      await consumeQuota(userIdNum, videoDuration);
    }

    if (sessionId) {
      await updateSession(sessionId, videoDuration);
    }

    // Récupérer l'usage mis à jour
    const updatedUsage = await getOrCreateUsage(userIdNum);

    return NextResponse.json({
      success: true,
      userText,
      aiResponse,
      videoUrl,
      audioUrl,
      duration: videoDuration,
      usageRemaining: updatedUsage.remainingSeconds,
    });

  } catch (error) {
    console.error('Erreur conversation avatar-visio:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la conversation' },
      { status: 500 }
    );
  }
}

// Speech-to-Text avec ElevenLabs
async function transcribeAudio(audioFile: File): Promise<string> {
  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

  if (!elevenlabsApiKey) {
    throw new Error('API Key ElevenLabs non configurée');
  }

  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model_id', 'scribe_v1');

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': elevenlabsApiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Erreur ElevenLabs STT:', error);
    throw new Error('Erreur lors de la transcription audio');
  }

  const result = await response.json();
  return result.text || '';
}

// Text-to-Speech avec ElevenLabs + upload vers Blob
async function generateTTS(text: string, voiceId: string): Promise<string> {
  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

  if (!elevenlabsApiKey) {
    throw new Error('API Key ElevenLabs non configurée');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': elevenlabsApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Erreur ElevenLabs TTS:', error);
    throw new Error('Erreur lors de la génération audio');
  }

  const audioBlob = await response.blob();

  // Uploader vers Vercel Blob
  const audioFile = new File([audioBlob], `tts-${Date.now()}.mp3`, { type: 'audio/mpeg' });
  const audioUrl = await uploadToBlob(audioFile, `avatar-visio/audio/${Date.now()}-response.mp3`);

  return audioUrl;
}

// Générer la réponse avec Claude
async function generateClaudeResponse(
  userMessage: string,
  personalityPrompt: string,
  aiDouble: any | null,
  userName: string
): Promise<string> {
  // Construire le system prompt pour l'avatar visio
  let systemPrompt = `Tu es un avatar IA en conversation vidéo avec l'utilisateur.
Tu dois répondre de manière naturelle, conversationnelle et engageante.

RÈGLES IMPORTANTES:
- Réponses COURTES et NATURELLES (2-4 phrases max)
- Parle comme dans une vraie conversation vidéo
- Sois chaleureux et expressif
- Utilise un langage oral naturel
- Pas de listes à puces ni de formatage markdown
- Pas d'émojis (tu es en vidéo, ton visage exprime les émotions)`;

  if (userName) {
    systemPrompt += `\n\nL'utilisateur s'appelle ${userName}. Utilise son prénom naturellement.`;
  }

  if (personalityPrompt) {
    systemPrompt += `\n\n# PERSONNALITÉ DE L'AVATAR\n${personalityPrompt}`;
  }

  // Ajouter le contexte psychologique si disponible
  if (aiDouble?.mbtiType || aiDouble?.enneagramType) {
    systemPrompt += '\n\n# CONTEXTE UTILISATEUR';
    if (aiDouble.mbtiType) systemPrompt += `\nType MBTI: ${aiDouble.mbtiType}`;
    if (aiDouble.enneagramType) systemPrompt += `\nEnnéagramme: ${aiDouble.enneagramType}`;
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256, // Réponses courtes pour la vidéo
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
