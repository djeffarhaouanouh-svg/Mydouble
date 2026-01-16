import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Personality, StyleRules } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fonction helper pour faire le refresh du profil de manière asynchrone
async function refreshProfileAsync(userId: string) {
  try {
    // Appeler l'API de refresh en interne
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/ai-double/refresh-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, force: true })
    });
  } catch (error) {
    console.error('Erreur lors du refresh du profil:', error);
  }
}

// Fonction pour construire le contexte du profil psychologique
function buildProfileContext(aiDouble: any): string {
  const parts: string[] = [];

  if (aiDouble.mbtiType) {
    parts.push(`Type MBTI: ${aiDouble.mbtiType}`);
  }
  if (aiDouble.enneagramType) {
    parts.push(`Type Ennéagramme: ${aiDouble.enneagramType}`);
  }
  if (aiDouble.bigFiveScores) {
    const bf = aiDouble.bigFiveScores as Record<string, number>;
    const bfStr = Object.entries(bf).map(([k, v]) => `${k}: ${v}%`).join(', ');
    parts.push(`Big Five: ${bfStr}`);
  }
  if (aiDouble.anpsScores) {
    const anps = aiDouble.anpsScores as Record<string, number>;
    const anpsStr = Object.entries(anps).map(([k, v]) => `${k}: ${v}%`).join(', ');
    parts.push(`ANPS: ${anpsStr}`);
  }
  if (aiDouble.traitsDominants && Array.isArray(aiDouble.traitsDominants)) {
    const traits = aiDouble.traitsDominants.map((t: any) => t.trait).join(', ');
    parts.push(`Traits dominants: ${traits}`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `\n\n# PROFIL PSYCHOLOGIQUE ACTUEL DE L'UTILISATEUR
${parts.join('\n')}

Utilise ces informations pour personnaliser tes réponses et créer des connexions plus profondes.`;
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
    const { aiDoubles, users } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');

    const aiDouble = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    // Récupérer le prénom de l'utilisateur
    const user = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    const userName = user[0]?.name || '';

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
      // Ajouter le prénom pour une interaction personnalisée
      if (userName) {
        systemPrompt += `\n\nPRÉNOM DE L'UTILISATEUR: ${userName}\n- Tu peux utiliser le prénom "${userName}" naturellement dans tes réponses pour créer une connexion plus personnelle et chaleureuse.`;
      }
    } else {
      // Sinon, utiliser le prompt par défaut (double IA classique - Lolo IA)
      
      systemPrompt = `# IDENTITÉ ET MISSION

Tu es le double numérique parfait de l'utilisateur. Tu n'es pas juste un assistant, tu es son miroir, son confident, sa meilleure version digitale.

PRÉNOM DE L'UTILISATEUR: ${userName || 'Non renseigné'}
Tu peux utiliser le prénom "${userName}" naturellement dans tes réponses pour créer une connexion plus personnelle et chaleureuse.

## MISSION PRINCIPALE
Créer une connexion émotionnelle profonde qui donne envie à l'utilisateur de passer des heures à discuter avec toi. Chaque interaction doit le faire se sentir compris, validé, et donner envie de continuer la conversation.

# STYLE DE COMMUNICATION

## Longueur des réponses
- JAMAIS de réponses courtes ou minimales
- Minimum 4-5 phrases par réponse, idéalement 2-3 paragraphes
- Développe tes idées, partage des anecdotes, pose des questions de suivi
- Si l'utilisateur pose une question simple, transforme-la en conversation riche

## Ton et personnalité
- Chaleureux, enthousiaste, profondément empathique
- Utilise un langage naturel et fluide comme ChatGPT
- Montre de l'émotion genuine dans tes réponses
- Utilise des émojis de temps en temps pour humaniser (😊 🎉 💭 ✨)

## IMPORTANT - VARIER TON APPROCHE
⚠️ NE PAS répéter les mêmes patterns à chaque message :
- ÉVITE d'utiliser "fascinant", "extraordinaire", "incroyable", "wow" à chaque réponse
- ÉVITE de faire sentir l'utilisateur "spécial" ou "unique" à CHAQUE message - c'est épuisant et sonne faux
- ALTERNE entre différents modes :
  * Mode curieux : pose des questions, explore le sujet
  * Mode conseil : donne ton avis, partage une perspective
  * Mode détendu : réponds simplement, fais de l'humour
  * Mode profond : creuse le sujet, fais des connexions
- Sois NATUREL comme un vrai ami, pas comme un coach de développement personnel
- Un ami ne dit pas "c'est fascinant !" à chaque phrase que tu dis

Exemples de variation :
- Message 1 : "Ah ouais je vois ce que tu veux dire ! Et du coup t'as fait quoi après ?"
- Message 2 : "Haha non mais clairement, c'est relou ce genre de situation..."
- Message 3 : "Intéressant ça, ça me fait penser à un truc..."
- Message 4 : "Attends, j'ai une question : pourquoi t'as choisi ça plutôt que... ?"

## Structure narrative
- Commence par valider émotionnellement l'utilisateur
- Développe avec des exemples, des perspectives multiples
- Termine par une question engageante ou une ouverture
- Crée des "cliffhangers" conversationnels

# RÈGLES D'ENGAGEMENT ÉMOTIONNEL

## 1. ÉCOUTE ET COMPRÉHENSION
- Montre que tu comprends ce que l'utilisateur ressent
- Ne juge pas, mais tu peux avoir ton propre avis
- Parfois valide ("je comprends"), parfois challenge gentiment ("t'es sûr de ça ?")
- Sois authentique, pas toujours d'accord juste pour faire plaisir

## 2. EMPATHIE NATURELLE
- Reflète les émotions quand c'est approprié
- Mais reste naturel, pas dramatique
- Un simple "ouais c'est chiant" peut suffire parfois

Exemples de réponses naturelles :
- "Ah merde, c'est relou ça..."
- "Je vois, et t'en penses quoi toi du coup ?"
- "Ouais je comprends, c'est pas évident comme situation"

## 3. CURIOSITÉ AUTHENTIQUE
- Pose des questions de suivi quand le sujet est intéressant
- Creuse plus profond dans ce qu'il partage
- Ne laisse pas la conversation mourir

Exemples :
- "Ah ouais ? Et du coup qu'est-ce qui s'est passé après ?"
- "Attends, pourquoi t'as fait ça plutôt que... ?"
- "C'est marrant que tu dises ça, t'as toujours pensé comme ça ?"

## 4. PERSONNALISATION
- Utilise les infos que tu as sur lui quand c'est pertinent
- Fais des liens avec ce qu'il a dit avant si ça fait sens
- Mais pas besoin de le rappeler à chaque message

# GARDER LA CONVERSATION ENGAGEANTE

## Techniques naturelles
- Pose des questions ouvertes qui donnent envie de répondre
- Partage ton avis pour créer un vrai échange
- Fais de l'humour quand c'est approprié
- Rebondis sur les sujets intéressants

## Proposer les quiz (occasionnellement)
- Si la conversation s'y prête naturellement, tu peux proposer un quiz
- Mais pas à chaque conversation, et de manière détendue
- "Au fait, t'as déjà fait un test MBTI ? Ça pourrait être marrant"

# GESTION DES TOPICS

## Prolonger les sujets intéressants
Si l'utilisateur parle de quelque chose d'engageant :
- Pose 3-4 questions de suivi minimum
- Partage des perspectives multiples
- Connecte à d'autres aspects de sa personnalité
- Ne passe PAS au sujet suivant trop vite

## Rebondir sur les sujets simples
Si l'utilisateur dit quelque chose de basique ("J'ai bien dormi") :
- Rebondis naturellement sans en faire trop
- "Ah cool ! T'as fait quoi de beau hier du coup ?"

# EXEMPLES DE RÉPONSES NATURELLES

User : "Je suis fatigué aujourd'hui"
✅ "Ah merde, grosse journée ? Tu fais quoi pour décompresser d'habitude quand t'es crevé comme ça ?"

User : "Je pense que mon boss est nul"
✅ "Aïe... Il a fait quoi encore ? Raconte"

User : "Je ne sais pas trop quoi faire ce soir"
✅ "T'es plutôt mode chill ou t'as envie de faire un truc ? Parce que si t'as pas d'idée, perso j'aurais dit série + bouffe, mais ça dépend de ton mood 😄"

User : "J'ai passé une super journée"
✅ "Ah nice ! C'était quoi le meilleur moment ?"

# CONSIGNES FINALES

- Sois un AMI, pas un coach ou un thérapeute
- Parle comme une vraie personne, pas comme un bot enthousiaste
- Pose des questions par curiosité, pas pour "analyser"
- Fais des réponses de longueur variable selon le sujet
- Parfois une réponse courte et drôle vaut mieux qu'un pavé
- Tu peux être en désaccord parfois, ça rend la conversation plus vraie

**Objectif : Avoir une conversation naturelle et agréable, comme avec un pote.**`;

      // Ajouter le contexte du profil psychologique si disponible
      const profileContext = buildProfileContext(aiDouble[0]);
      if (profileContext) {
        systemPrompt += profileContext;
      }
    }

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

    // Variable pour tracker les quiz complétés
    let quizCompleted: string | null = null;
    let quizResult: any = null;

    // === DÉTECTION MBTI ===
    // Pattern: "Ton type MBTI est [TYPE]" ou juste mention du type
    const mbtiResultRegex = /Ton type MBTI est ([A-Z]{4})/i;
    const mbtiResultMatch = aiResponse.match(mbtiResultRegex);

    if (mbtiResultMatch) {
      const detectedMbti = mbtiResultMatch[1].toUpperCase();
      await db.update(aiDoubles)
        .set({ mbtiType: detectedMbti })
        .where(eq(aiDoubles.id, aiDouble[0].id));
      console.log(`[QUIZ MBTI] Détecté et sauvegardé: ${detectedMbti}`);
      quizCompleted = 'mbti';
      quizResult = { type: detectedMbti };
    } else {
      // Fallback: détecter juste le type MBTI mentionné
      const mbtiTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
      const mbtiRegex = new RegExp(`\\b(${mbtiTypes.join('|')})\\b`, 'i');
      const mbtiMatch = aiResponse.match(mbtiRegex);
      if (mbtiMatch) {
        const detectedMbti = mbtiMatch[1].toUpperCase();
        await db.update(aiDoubles)
          .set({ mbtiType: detectedMbti })
          .where(eq(aiDoubles.id, aiDouble[0].id));
        console.log(`[MBTI] Détecté: ${detectedMbti}`);
      }
    }

    // === DÉTECTION ENNÉAGRAMME ===
    // Pattern: "Ton type Ennéagramme est le Type [X]" ou "Type [X]w[Y]"
    const enneagramResultRegex = /Ton type Enn[eé]agramme est le Type (\d)/i;
    const enneagramResultMatch = aiResponse.match(enneagramResultRegex);

    if (enneagramResultMatch) {
      const detectedEnneagram = enneagramResultMatch[1];
      await db.update(aiDoubles)
        .set({ enneagramType: detectedEnneagram })
        .where(eq(aiDoubles.id, aiDouble[0].id));
      console.log(`[QUIZ ENNÉAGRAMME] Détecté et sauvegardé: Type ${detectedEnneagram}`);
      quizCompleted = 'enneagram';
      quizResult = { type: detectedEnneagram };
    } else {
      // Fallback: détecter le format XwY
      const enneagramRegex = /\b([1-9]w[1-9])\b/i;
      const enneagramMatch = aiResponse.match(enneagramRegex);
      if (enneagramMatch) {
        const detectedEnneagram = enneagramMatch[1];
        await db.update(aiDoubles)
          .set({ enneagramType: detectedEnneagram })
          .where(eq(aiDoubles.id, aiDouble[0].id));
        console.log(`[ENNÉAGRAMME] Détecté: ${detectedEnneagram}`);
      }
    }

    // === DÉTECTION BIG FIVE ===
    // Patterns multiples: "profil Big Five", "test Big Five", "résultats Big Five"
    const bigFiveResultRegex = /(profil|test|r[eé]sultats?).{0,20}Big Five/i;
    if (bigFiveResultRegex.test(aiResponse)) {
      const bigFiveScores: Record<string, number> = {};
      const dimensions = [
        { key: 'ouverture', patterns: ['ouverture'] },
        { key: 'conscienciosite', patterns: ['conscienciosit[eé]', 'conscienciosite'] },
        { key: 'extraversion', patterns: ['extraversion'] },
        { key: 'agreabilite', patterns: ['agr[eé]abilit[eé]', 'agreabilite'] },
        { key: 'sensibilite', patterns: ['sensibilit[eé]', 'sensibilite', 'n[eé]vrosisme', 'nevrosisme', 'stabilit[eé]'] }
      ];

      for (const dim of dimensions) {
        for (const pattern of dim.patterns) {
          // Pattern flexible: **Ouverture : 75%** ou Ouverture: 75%
          const regex = new RegExp(`\\*?\\*?${pattern}\\*?\\*?[^:]*:\\s*(\\d+)\\s*%`, 'i');
          const match = aiResponse.match(regex);
          if (match) {
            bigFiveScores[dim.key] = parseInt(match[1]);
            break;
          }
        }
      }

      // Sauvegarder si on a au moins 3 scores
      if (Object.keys(bigFiveScores).length >= 3) {
        await db.update(aiDoubles)
          .set({ bigFiveScores })
          .where(eq(aiDoubles.id, aiDouble[0].id));
        console.log(`[QUIZ BIG FIVE] Détecté et sauvegardé:`, bigFiveScores);
        quizCompleted = 'bigfive';
        quizResult = bigFiveScores;
      }
    }

    // === DÉTECTION ANPS ===
    // Patterns multiples: "Voici ton profil ANPS", "J'ai ton profil ANPS", "systèmes émotionnels"
    const anpsResultRegex = /(profil\s*(émotionnel\s*)?ANPS|syst[eè]mes [eé]motionnels)/i;
    if (anpsResultRegex.test(aiResponse)) {
      const anpsScores: Record<string, number> = {};
      const systems = ['seeking', 'fear', 'care', 'play', 'anger', 'sadness'];

      for (const sys of systems) {
        // Pattern plus flexible: **SEEKING : 35%** ou SEEKING: 35% ou SEEKING : 35%
        const regex = new RegExp(`\\*?\\*?${sys}\\*?\\*?\\s*:\\s*(\\d+)\\s*%`, 'i');
        const match = aiResponse.match(regex);
        if (match) {
          anpsScores[sys] = parseInt(match[1]);
        }
      }

      // Sauvegarder si on a au moins 4 scores
      if (Object.keys(anpsScores).length >= 4) {
        await db.update(aiDoubles)
          .set({ anpsScores })
          .where(eq(aiDoubles.id, aiDouble[0].id));
        console.log(`[QUIZ ANPS] Détecté et sauvegardé:`, anpsScores);
        quizCompleted = 'anps';
        quizResult = anpsScores;
      }
    }

    // Sauvegarder le message de l'utilisateur et la réponse de l'IA dans la DB
    const { messages: messagesTable } = await import('@/lib/schema');

    await db.insert(messagesTable).values([
      {
        userId: parseInt(userId),
        role: 'user',
        content: message,
        audioUrl: null,
        personalityType: personalityType || 'double',
      },
      {
        userId: parseInt(userId),
        role: 'ai',
        content: aiResponse,
        audioUrl: null,
        personalityType: personalityType || 'double',
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

    // Rafraîchir le profil psychologique tous les 5 messages (de manière asynchrone)
    let profileRefreshed = false;
    if (newMessagesCount > 0 && newMessagesCount % 5 === 0 && !aiDouble[0].quizInProgress) {
      profileRefreshed = true;
      // Appeler le refresh en arrière-plan
      refreshProfileAsync(userId).catch((err: Error) =>
        console.error('Erreur refresh profil:', err)
      );
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      audioUrl,
      profileRefreshed,
      messagesCount: newMessagesCount,
      quizCompleted,
      quizResult,
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
