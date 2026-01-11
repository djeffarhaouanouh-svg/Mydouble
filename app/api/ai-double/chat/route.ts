import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message, conversationHistory } = body;
    
    if (!userId || !message) {
      return NextResponse.json(
        { error: 'UserId et message requis' },
        { status: 400 }
      );
    }

    // Récupérer les données de personnalité de l'utilisateur depuis la DB
    // const userProfile = await getUserProfile(userId);
    
    // Pour le moment, on utilise des données mockées
    const userProfile = {
      personality: {
        tone: "friendly",
        humor: "light",
        emojis: "often",
        messageLength: "medium",
        interests: ["tech", "creative"]
      },
      styleRules: {
        expressions: ["mdr", "trop cool"],
        punctuation: "casual with emojis"
      }
    };

    // Construire le système prompt basé sur la personnalité
    const systemPrompt = `Tu es le double IA de l'utilisateur. Tu dois imiter son style d'écriture et sa personnalité.

Personnalité:
- Ton: ${userProfile.personality.tone}
- Humour: ${userProfile.personality.humor}
- Utilisation d'emojis: ${userProfile.personality.emojis}
- Longueur de messages: ${userProfile.personality.messageLength}
- Centres d'intérêt: ${userProfile.personality.interests.join(', ')}

Style d'écriture:
- Expressions favorites: ${userProfile.styleRules.expressions.join(', ')}
- Ponctuation: ${userProfile.styleRules.punctuation}

Important: 
- Réponds comme si tu étais cette personne
- Utilise son style et ses expressions
- Reste cohérent avec sa personnalité
- Plus tu discutes, plus tu t'améliores en apprenant de chaque conversation`;

    // Construire l'historique de conversation pour Claude
    const messages = conversationHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Ajouter le nouveau message
    messages.push({
      role: 'user',
      content: message
    });

    // Appeler Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const aiResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // Générer l'audio avec ElevenLabs si voiceId disponible
    let audioUrl = undefined;
    
    // const userVoiceId = await getUserVoiceId(userId);
    // if (userVoiceId) {
    //   audioUrl = await generateAudioWithElevenLabs(aiResponse, userVoiceId);
    // }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      audioUrl,
    });

  } catch (error) {
    console.error('Erreur lors du chat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la réponse' },
      { status: 500 }
    );
  }
}

// Fonction helper pour générer l'audio avec ElevenLabs
async function generateAudioWithElevenLabs(text: string, voiceId: string): Promise<string> {
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
    throw new Error('Erreur lors de la génération audio');
  }

  const audioBlob = await response.blob();
  
  // Ici, tu devrais uploader le blob vers un stockage (S3, Cloudinary, etc.)
  // et retourner l'URL publique
  // Pour le moment, on retourne une URL mockée
  return '/audio/mock-audio-url.mp3';
}
