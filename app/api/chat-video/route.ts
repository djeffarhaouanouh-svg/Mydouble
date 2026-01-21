import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { uploadToBlob } from '@/lib/blob';
import { generateLipsyncVideo } from '@/lib/providers/lipsync-studio';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// URL de la vidéo source - doit être publiquement accessible
const VIDEO_SOURCE_URL = process.env.CHAT_VIDEO_SOURCE_URL || process.env.AVATAR_VIDEO_URL;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      );
    }

    if (!VIDEO_SOURCE_URL) {
      return NextResponse.json(
        { error: 'VIDEO_SOURCE_URL non configuré. Ajoutez CHAT_VIDEO_SOURCE_URL dans .env.local' },
        { status: 500 }
      );
    }

    console.log('[ChatVideo] Message reçu:', message);

    // 1. Générer la réponse avec Claude (max 2 phrases)
    const aiResponse = await generateClaudeResponse(message, conversationHistory);
    console.log('[ChatVideo] Réponse Claude:', aiResponse);

    // 2. Générer l'audio avec ElevenLabs
    const audioUrl = await generateTTS(aiResponse);
    console.log('[ChatVideo] Audio généré:', audioUrl);

    // 3. Générer la vidéo lip-sync avec lipsync.studio
    console.log('[ChatVideo] Génération vidéo lip-sync...');
    const lipsyncResult = await generateLipsyncVideo(VIDEO_SOURCE_URL, audioUrl, '480p');

    if (!lipsyncResult.success || !lipsyncResult.videoUrl) {
      console.error('[ChatVideo] Erreur lipsync:', lipsyncResult.error);
      return NextResponse.json({
        success: true,
        aiResponse,
        audioUrl,
        videoUrl: null,
        error: lipsyncResult.error || 'Erreur génération vidéo',
      });
    }

    console.log('[ChatVideo] ✅ Vidéo prête:', lipsyncResult.videoUrl);

    return NextResponse.json({
      success: true,
      aiResponse,
      audioUrl,
      videoUrl: lipsyncResult.videoUrl,
    });

  } catch (error) {
    console.error('[ChatVideo] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function generateClaudeResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemPrompt = `Tu es un assistant IA sympathique en conversation vidéo.

RÈGLES STRICTES:
- Réponds en MAXIMUM 2 phrases courtes
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

  if (!elevenlabsApiKey) {
    throw new Error('ELEVENLABS_API_KEY non configurée');
  }

  // Voix par défaut - Rachel (voix naturelle)
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
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS erreur: ${response.status} - ${errorText}`);
  }

  const audioBlob = await response.blob();

  // Upload vers Vercel Blob pour avoir une URL publique
  const audioFile = new File([audioBlob], `chat-${Date.now()}.mp3`, { type: 'audio/mpeg' });
  const audioUrl = await uploadToBlob(audioFile, `chat-video/audio/${Date.now()}.mp3`);

  return audioUrl;
}
