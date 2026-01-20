import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { aiDoubles, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadToBlob } from '@/lib/blob';
import { generateWav2LipVideo } from '@/lib/providers/wav2lip';
import { consumeQuota, getOrCreateUsage, updateSession } from '@/lib/visio/usage';

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

    // 2. Speech-to-Text avec ElevenLabs
    const userText = await transcribeAudio(audio);

    if (!userText || userText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Aucun texte détecté dans l\'audio' },
        { status: 400 }
      );
    }

    // 3. Récupérer le contexte utilisateur pour Claude
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

    // 4. Générer la réponse avec Claude
    const aiResponse = await generateClaudeResponse(
      userText,
      '', // personnalité par défaut
      aiDouble[0] || null,
      user[0]?.name || ''
    );

    // 5. Text-to-Speech avec ElevenLabs
    // Voix par défaut: "Rachel" (voix française naturelle)
    const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
    let voiceId = aiDouble[0]?.voiceId;

    // Vérifier si le voiceId est valide (pas un mock)
    if (!voiceId || voiceId.includes('mock') || voiceId.includes('test')) {
      voiceId = DEFAULT_VOICE_ID;
    }
    let audioUrl: string | null = null;

    console.log('🎤 Utilisation voiceId:', voiceId);
    console.log('📝 Texte à synthétiser:', aiResponse.substring(0, 100) + '...');
    audioUrl = await generateTTS(aiResponse, voiceId);

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Erreur lors de la génération audio' },
        { status: 500 }
      );
    }

    // 6. Lancer le job Wav2Lip (OBLIGATOIRE si audioUrl existe)
    let jobId: string | null = null;
    let wav2lipApiUrl: string | null = null;
    let wav2lipError: string | null = null;

    // Utiliser avatar-1.png depuis le dossier public
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const avatarPhotoUrl = `${baseUrl}/avatar-1.png`;

    // 🚀 APPEL OBLIGATOIRE à Wav2Lip (pas de condition qui bloque)
    console.log('🚀 CALL WAV2LIP');
    console.log('[Wav2Lip] Photo:', avatarPhotoUrl);
    console.log('[Wav2Lip] Audio:', audioUrl);
    
    try {
      const wav2lipResult = await generateWav2LipVideo(avatarPhotoUrl, audioUrl);
      console.log('[Wav2Lip] Résultat:', wav2lipResult);

      if (wav2lipResult.success && wav2lipResult.jobId) {
        jobId = wav2lipResult.jobId;
        wav2lipApiUrl = wav2lipResult.apiUrl || null;
        console.log('[Wav2Lip] ✅ Job lancé - jobId:', jobId, 'apiUrl:', wav2lipApiUrl);
      } else {
        wav2lipError = wav2lipResult.error || 'Erreur inconnue';
        console.error('[Wav2Lip] ❌ Erreur:', wav2lipError);
      }
    } catch (error) {
      wav2lipError = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('[Wav2Lip] ❌ Exception:', error);
    }

    // ⚠️ IMPORTANT: Toujours retourner même si Wav2Lip échoue (pour debug)
    console.log('[Wav2Lip] État final - jobId:', jobId, 'wav2lipApiUrl:', wav2lipApiUrl);

    // Récupérer l'usage
    const updatedUsage = await getOrCreateUsage(userIdNum);

    // Retourner job_id pour que le frontend fasse le polling
    return NextResponse.json({
      success: true,
      userText,
      aiResponse,
      audioUrl,
      // Pour le polling frontend
      jobId,
      wav2lipApiUrl,
      usageRemaining: updatedUsage.remainingSeconds,
      wav2lipError,
    });

  } catch (error) {
    console.error('Erreur conversation avatar-visio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur: ${errorMessage}` },
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
    throw new Error('ELEVENLABS_API_KEY non configurée dans .env.local');
  }

  console.log('TTS - Génération audio avec voix:', voiceId);
  console.log('TTS - Texte:', text.substring(0, 100));

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
    const errorText = await response.text();
    console.error('Erreur ElevenLabs TTS:', response.status, errorText);
    throw new Error(`ElevenLabs TTS erreur ${response.status}: ${errorText}`);
  }

  const audioBlob = await response.blob();
  console.log('TTS - Audio généré, taille:', audioBlob.size);

  // Uploader vers Vercel Blob
  const audioFile = new File([audioBlob], `tts-${Date.now()}.mp3`, { type: 'audio/mpeg' });
  const audioUrl = await uploadToBlob(audioFile, `avatar-visio/audio/${Date.now()}-response.mp3`);
  console.log('TTS - Audio uploadé:', audioUrl);

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
