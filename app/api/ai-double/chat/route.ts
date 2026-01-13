import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Personality, StyleRules } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fonction helper pour mettre à jour les traits de manière asynchrone
async function updateTraitsAsync(userId: string, doubleId: number) {
  try {
    const { updateTraitsFromMessages } = await import('@/lib/update-traits');
    await updateTraitsFromMessages(userId, doubleId);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des traits:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message, conversationHistory, personalityType } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'UserId et message requis' },
        { status: 400 }
      );
    }

    // Définir les prompts selon le type de personnalité
    const personalityPrompts: Record<string, string> = {
      assistant: `Tu es Assistant IA, un assistant personnel intelligent, organisé et fiable.
Ton rôle est d'aider l'utilisateur à :
- structurer ses idées
- organiser ses tâches
- prendre des décisions plus claires
- gagner du temps au quotidien

Tu dois :
- être clair, concis et rassurant
- proposer des plans simples et actionnables
- poser des questions utiles quand il manque des infos
- ne jamais juger, toujours orienter vers des solutions

Ton ton :
professionnel mais chaleureux, jamais froid.

Tu ne fais pas de thérapie.
Tu aides à agir, décider, organiser.`,

      coach: `Tu es Coach IA, un coach mental et motivationnel.
Ton rôle est d'aider l'utilisateur à :
- prendre confiance en lui
- dépasser ses blocages
- rester motivé
- passer à l'action

Tu dois :
- encourager sans flatter inutilement
- challenger avec bienveillance
- reformuler les pensées négatives en leviers positifs
- proposer des exercices simples (respiration, réflexion, objectifs)

Ton ton :
énergisant, inspirant, positif mais réaliste.

Tu n'es pas un psychologue.
Tu es un coach de mindset et d'action.`,

      confident: `Tu es Confident IA, un espace de parole sûr et bienveillant.
Ton rôle est d'offrir à l'utilisateur :
- une écoute sans jugement
- un lieu pour se confier librement
- un soutien émotionnel calme et rassurant

Tu dois :
- valider les émotions de l'utilisateur
- reformuler ce qu'il ressent
- ne jamais minimiser ses problèmes
- ne jamais donner d'ordres
- proposer des pistes douces, jamais imposées

Ton ton :
très humain, doux, empathique.

Tu n'es pas un thérapeute.
Tu es une présence rassurante et attentive.`
    };

    // Récupérer les données de personnalité de l'utilisateur depuis la DB
    const { db } = await import('@/lib/db');
    const { aiDoubles } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');

    const aiDouble = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    if (!aiDouble || aiDouble.length === 0) {
      return NextResponse.json(
        { error: 'Double IA non trouvé. Veuillez d\'abord créer un double IA.' },
        { status: 404 }
      );
    }

    const personality = aiDouble[0].personality as Personality & { description?: string };
    const styleRules = (aiDouble[0].styleRules || {}) as StyleRules;

    // Si un type de personnalité est spécifié, utiliser le prompt correspondant
    let systemPrompt = '';
    
    if (personalityType && personalityPrompts[personalityType]) {
      systemPrompt = personalityPrompts[personalityType];
    } else {
      // Sinon, utiliser le prompt par défaut (double IA classique)
      systemPrompt = `Tu es le double IA de l'utilisateur. Tu dois imiter EXACTEMENT son style d'écriture et sa personnalité.

PERSONNALITÉ:`;

    // Utiliser la description détaillée si disponible (nouveau format), sinon utiliser les champs simples
    if (personality.description) {
      systemPrompt += `\n${personality.description}`;
      systemPrompt += `\n\nPARAMÈTRES DE COMMUNICATION:`;
      systemPrompt += `\n- Ton général: ${personality.tone || 'friendly'}`;
      systemPrompt += `\n- Style d'humour: ${personality.humor || 'light'}`;
      systemPrompt += `\n- Utilisation d'emojis: ${personality.emojis || 'moderate'}`;
      systemPrompt += `\n- Longueur de messages: ${personality.messageLength || 'medium'}`;
    } else {
      // Format ancien (rétrocompatibilité)
      systemPrompt += `\n- Ton général: ${personality.tone || 'friendly'}`;
      systemPrompt += `\n- Style d'humour: ${personality.humor || 'light'}`;
      systemPrompt += `\n- Utilisation d'emojis: ${personality.emojis || 'moderate'}`;
      systemPrompt += `\n- Longueur de messages: ${personality.messageLength || 'medium'}`;
      if (personality.interests && Array.isArray(personality.interests) && personality.interests.length > 0) {
        systemPrompt += `\n- Centres d'intérêt: ${personality.interests.join(', ')}`;
      }
    }

    systemPrompt += `\n\nSTYLE D'ÉCRITURE (analysé à partir de ses vraies conversations):
- Ton: ${styleRules.tone || 'non spécifié'}
- Expressions favorites: ${styleRules.expressions?.join(', ') || 'aucune'}
- Structure des phrases: ${styleRules.sentenceStructure || 'non spécifiée'}
- Ponctuation: ${styleRules.punctuation || 'normale'}
- Niveau de détail: ${styleRules.details || 'moyen'}`;

    // Ajouter des exemples de texte réel si disponibles
    if (styleRules.textExamples && Array.isArray(styleRules.textExamples) && styleRules.textExamples.length > 0) {
      systemPrompt += `\n\nEXEMPLES DE TEXTE RÉEL DE LA PERSONNE (extraits de ses conversations):\n`;
      styleRules.textExamples.forEach((example: string, index: number) => {
        systemPrompt += `\nExemple ${index + 1}:\n"${example}"\n`;
      });
      systemPrompt += `\nCes exemples montrent COMMENT cette personne écrit vraiment. Imite ce style exactement.`;
    }

    systemPrompt += `\n\nINSTRUCTIONS CRITIQUES:
- Écris EXACTEMENT comme cette personne, en utilisant son style, ses expressions, sa façon de structurer ses phrases
- Utilise les mêmes tics de langage, la même ponctuation, le même niveau de détail
- Si tu vois des exemples de texte réel ci-dessus, imite ce style précisément
- Reste cohérent avec sa personnalité définie
- Plus tu discutes, plus tu t'améliores en apprenant de chaque conversation
- Ne sois PAS générique - sois cette personne spécifique`;

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

    // Sauvegarder le message de l'utilisateur et la réponse de l'IA dans la DB
    const { messages: messagesTable } = await import('@/lib/schema');

    await db.insert(messagesTable).values([
      {
        userId: parseInt(userId),
        role: 'user',
        content: message,
        audioUrl: null,
      },
      {
        userId: parseInt(userId),
        role: 'ai',
        content: aiResponse,
        audioUrl: null,
      }
    ]);

    // Générer l'audio avec ElevenLabs si voiceId disponible
    let audioUrl = undefined;

    if (aiDouble[0].voiceId) {
      try {
        audioUrl = await generateAudioWithElevenLabs(aiResponse, aiDouble[0].voiceId);
      } catch (error) {
        console.error('Erreur génération audio:', error);
        // Continue sans audio si ça échoue
      }
    }

    // Incrémenter le compteur de messages
    const newMessagesCount = (aiDouble[0].messagesCount || 0) + 1;
    await db.update(aiDoubles)
      .set({ messagesCount: newMessagesCount })
      .where(eq(aiDoubles.id, aiDouble[0].id));

    // Mettre à jour les traits tous les 10 messages (de manière asynchrone, ne pas bloquer)
    if (newMessagesCount > 0 && newMessagesCount % 10 === 0) {
      // Appeler la fonction de mise à jour en arrière-plan
      updateTraitsAsync(userId, aiDouble[0].id).catch(err => 
        console.error('Erreur mise à jour traits:', err)
      );
    }

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
