import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { uploadToBlob } from '@/lib/blob';
import { db } from '@/lib/db';
import { chatVideoJobs } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const LIPSYNC_API_URL = 'https://lipsync.studio/api/v1';
const LIPSYNC_API_KEY = process.env.LIPSYNC_API_KEY!;
const VIDEO_SOURCE_URL = process.env.CHAT_VIDEO_SOURCE_URL || process.env.AVATAR_VIDEO_URL;

/**
 * POST /api/chat-video
 * Mode ASYNC: retourne immédiatement avec jobId, aiResponse, audioUrl
 * La vidéo arrive via webhook
 */
export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    if (!VIDEO_SOURCE_URL) {
      return NextResponse.json({ error: 'VIDEO_SOURCE_URL non configuré' }, { status: 500 });
    }

    const jobId = randomUUID();
    console.log(`[ChatVideo] Job ${jobId} - Message: ${message}`);

    // 1. Générer la réponse Claude (rapide ~1s)
    const aiResponse = await generateClaudeResponse(message, conversationHistory);
    console.log(`[ChatVideo] Job ${jobId} - Claude OK`);

    // 2. Générer l'audio ElevenLabs (rapide ~2s)
    const audioUrl = await generateTTS(aiResponse);
    console.log(`[ChatVideo] Job ${jobId} - Audio OK: ${audioUrl}`);

    // 3. Créer le job en DB
    await db.insert(chatVideoJobs).values({
      jobId,
      status: 'processing',
      userMessage: message,
      aiResponse,
      audioUrl,
    });

    // 4. Lancer lipsync.studio avec webhook (async)
    const baseUrl = getBaseUrl(request);
    const webhookUrl = `${baseUrl}/api/webhooks/lipsync`;

    console.log(`[ChatVideo] Job ${jobId} - Lancement lipsync avec webhook: ${webhookUrl}`);

    // Fire and forget - on n'attend pas la réponse
    launchLipsyncJob(jobId, VIDEO_SOURCE_URL, audioUrl, webhookUrl).catch(err => {
      console.error(`[ChatVideo] Job ${jobId} - Erreur lipsync:`, err);
    });

    // 5. Retourner immédiatement (< 300ms après Claude+TTS)
    return NextResponse.json({
      success: true,
      jobId,
      aiResponse,
      audioUrl,
      status: 'processing',
    });

  } catch (error) {
    console.error('[ChatVideo] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

async function launchLipsyncJob(
  jobId: string,
  videoUrl: string,
  audioUrl: string,
  webhookUrl: string
): Promise<void> {
  try {
    const response = await fetch(`${LIPSYNC_API_URL}/lipsync-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LIPSYNC_API_KEY}`,
      },
      body: JSON.stringify({
        webhook: webhookUrl,
        formState: {
          video: videoUrl,
          audio: audioUrl,
          resolution: '360p',
        },
      }),
    });

    const responseText = await response.text();
    console.log(`[ChatVideo] Job ${jobId} - Lipsync response:`, response.status, responseText);

    if (!response.ok) {
      // Mettre à jour le job comme échoué
      await db
        .update(chatVideoJobs)
        .set({ status: 'failed', error: responseText })
        .where(eq(chatVideoJobs.jobId, jobId));
    } else {
      const data = JSON.parse(responseText);
      const lipsyncJobId = data.id || data.requestId;
      if (lipsyncJobId) {
        await db
          .update(chatVideoJobs)
          .set({ lipsyncJobId })
          .where(eq(chatVideoJobs.jobId, jobId));
      }
    }
  } catch (error) {
    console.error(`[ChatVideo] Job ${jobId} - launchLipsyncJob error:`, error);
    await db
      .update(chatVideoJobs)
      .set({ status: 'failed', error: String(error) })
      .where(eq(chatVideoJobs.jobId, jobId));
  }
}

async function generateClaudeResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemPrompt = `Tu es un assistant IA sympathique en conversation vidéo.

RÈGLES STRICTES:
- Réponds en UNE SEULE phrase courte
- Sois naturel et conversationnel
- Pas de listes, pas de formatage
- Pas d'émojis
- Langage oral simple et direct`;

  const messages = [
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    system: systemPrompt,
    messages,
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

async function generateTTS(text: string): Promise<string> {
  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenlabsApiKey) throw new Error('ELEVENLABS_API_KEY non configurée');

  const voiceId = '21m00Tcm4TlvDq8ikWAM';

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': elevenlabsApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS erreur: ${response.status}`);
  }

  const audioBlob = await response.blob();
  const audioFile = new File([audioBlob], `chat-${Date.now()}.mp3`, { type: 'audio/mpeg' });
  return await uploadToBlob(audioFile, `chat-video/audio/${Date.now()}.mp3`);
}
