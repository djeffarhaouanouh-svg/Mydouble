import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { videoMessages, characters, voices } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
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
      const charResult = await db.select()
        .from(characters)
        .where(eq(characters.id, characterId))
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

    // Construire le prompt système
    let systemPrompt = storyPrompt || 'Tu es un assistant amical et serviable.';

    if (character?.description) {
      systemPrompt = `${character.description}\n\n${systemPrompt}`;
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
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const aiResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Générer l'audio avec ElevenLabs
    let audioUrl = null;
    const elevenlabsVoiceId = voice?.elevenlabsVoiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID;

    if (process.env.ELEVENLABS_API_KEY && elevenlabsVoiceId) {
      try {
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
        }
      } catch (ttsError) {
        console.error('Erreur TTS:', ttsError);
      }
    }

    // Créer un job ID pour le tracking vidéo
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Sauvegarder le message vidéo en base (optionnel)
    // await db.insert(videoMessages).values({...});

    return NextResponse.json({
      success: true,
      aiResponse,
      audioUrl,
      jobId,
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
