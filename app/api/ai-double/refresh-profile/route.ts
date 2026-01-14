import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { aiDoubles, messages as messagesTable } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Prompt de refresh pour analyser les messages
const REFRESH_PROMPT = `# ANALYSE SILENCIEUSE - Ne pas mentionner à l'utilisateur

Analyse les 10 derniers messages de la conversation.

## HISTORIQUE DES 10 DERNIERS MESSAGES
{{last_10_messages}}

## PROFIL ACTUEL
{{current_profile}}

## EXTRACTION À FAIRE

### 1. Big Five (format JSON avec scores 0-100)
Analyse les marqueurs comportementaux et psychologiques dans les messages pour évaluer :
- **Ouverture** : Curiosité intellectuelle, créativité, imagination, appréciation de l'art et des idées nouvelles
- **Conscienciosité** : Organisation, discipline, sens du devoir, orientation vers les objectifs
- **Extraversion** : Sociabilité, assertivité, recherche de stimulation sociale, énergie expressive
- **Agréabilité** : Empathie, coopération, confiance envers autrui, altruisme
- **Sensibilité émotionnelle** : Tendance à l'anxiété, vulnérabilité au stress, instabilité émotionnelle

### 2. ANPS (format JSON avec scores 0-100)
Analyse les systèmes émotionnels fondamentaux selon la neuroscience affective :
- **SEEKING** : Curiosité, exploration, motivation, anticipation positive
- **FEAR** : Anxiété, prudence, évitement des dangers
- **CARE** : Empathie, nurturing, préoccupation pour les autres
- **PLAY** : Joie, humour, légèreté, plaisir social
- **ANGER** : Frustration, irritation, affirmation de soi face aux obstacles
- **SADNESS** : Mélancolie, sensibilité à la perte, besoin de connexion

### 3. Traits dominants (top 6 avec scores)
Identifie les traits de personnalité les plus marquants observables dans la conversation.

Traits possibles : Altruiste, Authentique, Assertif, Spontané, Extraverti, Flexible, Analytique, Créatif, Empathique, Déterminé, Organisé, Aventureux, Calme, Expressif, Indépendant, Sociable, Réfléchi, Optimiste, Pragmatique, Idéaliste

### 4. MBTI (si suffisamment d'infos)
Si tu as assez d'informations pour déterminer les axes, propose un type probable.

## RÈGLES IMPORTANTES
1. **Changements progressifs** : Maximum ±5% par refresh pour chaque score (évolution douce, pas de ruptures brutales)
2. **Conservation des données** : Si pas assez d'informations nouvelles sur une dimension, garde le score actuel
3. **Justification** : Pour chaque changement significatif (>3%), fournis une brève justification basée sur les observations concrètes dans les messages
4. **Cohérence** : Vérifie que les profils Big Five et MBTI sont cohérents entre eux

## FORMAT DE RETOUR
Retourne UNIQUEMENT un objet JSON valide, sans texte avant ou après :
{
  "big_five": {
    "ouverture": 85,
    "conscienciosite": 72,
    "extraversion": 78,
    "agreabilite": 90,
    "sensibilite_emotionnelle": 45
  },
  "anps": {
    "seeking": 82,
    "fear": 45,
    "care": 85,
    "play": 76,
    "anger": 51,
    "sadness": 57
  },
  "traits_dominants": [
    {"trait": "Altruiste", "score": 92},
    {"trait": "Authentique", "score": 89},
    {"trait": "Assertif", "score": 87},
    {"trait": "Spontané", "score": 85},
    {"trait": "Extraverti", "score": 83},
    {"trait": "Flexible", "score": 81}
  ],
  "mbti": {
    "type": "ENFP",
    "confidence": 75,
    "axes": {
      "E_I": "E",
      "S_N": "N",
      "T_F": "F",
      "J_P": "P"
    }
  },
  "justifications": {
    "big_five": "Légère augmentation de l'ouverture (+3%) suite aux discussions créatives...",
    "anps": "SEEKING en hausse de 5% avec les projets enthousiastes mentionnés...",
    "traits": "Altruiste confirmé à 92% par les multiples mentions d'aide aux autres..."
  }
}`;

// Fonction pour limiter les changements à ±5%
function mergeProfileWithLimits(
  current: Record<string, number> | null,
  updates: Record<string, number>,
  maxChange: number = 5
): Record<string, number> {
  if (!current) return updates;

  const merged: Record<string, number> = {};

  for (const key in updates) {
    const currentValue = current[key] ?? 50;
    const newValue = updates[key];
    const diff = newValue - currentValue;

    if (Math.abs(diff) <= maxChange) {
      merged[key] = newValue;
    } else {
      merged[key] = currentValue + (diff > 0 ? maxChange : -maxChange);
    }
  }

  // Conserver les valeurs existantes non mises à jour
  for (const key in current) {
    if (!(key in merged)) {
      merged[key] = current[key];
    }
  }

  return merged;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, force = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Récupérer le double IA
    const [aiDouble] = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    if (!aiDouble) {
      return NextResponse.json(
        { error: 'Double IA non trouvé' },
        { status: 404 }
      );
    }

    // Ne pas refresh si un quiz est en cours
    if (aiDouble.quizInProgress && !force) {
      return NextResponse.json({
        success: false,
        message: 'Quiz en cours, refresh reporté',
        quizInProgress: true
      });
    }

    // Vérifier si on doit faire un refresh (tous les 5 messages)
    const messagesCount = aiDouble.messagesCount || 0;
    if (messagesCount % 5 !== 0 && !force) {
      return NextResponse.json({
        success: false,
        message: `Refresh non nécessaire (${messagesCount} messages, prochain refresh à ${Math.ceil(messagesCount / 5) * 5})`,
        messagesCount
      });
    }

    // Récupérer les 10 derniers messages
    const lastMessages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.userId, parseInt(userId)))
      .orderBy(desc(messagesTable.createdAt))
      .limit(10);

    if (lastMessages.length < 5) {
      return NextResponse.json({
        success: false,
        message: 'Pas assez de messages pour une analyse (minimum 5)',
        messagesCount: lastMessages.length
      });
    }

    // Formater les messages pour le prompt
    const formattedMessages = lastMessages
      .reverse()
      .map((msg, i) => `[${msg.role.toUpperCase()}]: ${msg.content}`)
      .join('\n\n');

    // Construire le profil actuel
    const currentProfile = {
      big_five: aiDouble.bigFiveScores || null,
      anps: aiDouble.anpsScores || null,
      traits_dominants: aiDouble.traitsDominants || null,
      mbti: aiDouble.mbtiType || null,
      enneagram: aiDouble.enneagramType || null
    };

    // Construire le prompt avec les données
    const prompt = REFRESH_PROMPT
      .replace('{{last_10_messages}}', formattedMessages)
      .replace('{{current_profile}}', JSON.stringify(currentProfile, null, 2));

    // Appeler Claude pour l'analyse
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const aiResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parser le JSON retourné
    let analysisResult;
    try {
      // Extraire le JSON de la réponse (au cas où il y a du texte autour)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Pas de JSON trouvé dans la réponse');
      }
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du parsing de l\'analyse',
        rawResponse: aiResponse
      }, { status: 500 });
    }

    // Merger avec les limites de ±5%
    const updatedBigFive = analysisResult.big_five
      ? mergeProfileWithLimits(aiDouble.bigFiveScores as Record<string, number>, analysisResult.big_five)
      : aiDouble.bigFiveScores;

    const updatedAnps = analysisResult.anps
      ? mergeProfileWithLimits(aiDouble.anpsScores as Record<string, number>, analysisResult.anps)
      : aiDouble.anpsScores;

    // Préparer les données de mise à jour
    const updateData: any = {
      bigFiveScores: updatedBigFive,
      anpsScores: updatedAnps,
      traitsDominants: analysisResult.traits_dominants || aiDouble.traitsDominants,
      lastRefreshAt: new Date(),
      updatedAt: new Date()
    };

    // Ne mettre à jour le MBTI que s'il n'est pas déjà défini par un quiz
    const quizCompleted = (aiDouble.quizCompleted as string[]) || [];
    if (!quizCompleted.includes('mbti') && analysisResult.mbti?.type && analysisResult.mbti.confidence >= 70) {
      updateData.mbtiType = analysisResult.mbti.type;
    }

    // Sauvegarder les mises à jour
    await db.update(aiDoubles)
      .set(updateData)
      .where(eq(aiDoubles.id, aiDouble.id));

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      updates: {
        big_five: updatedBigFive,
        anps: updatedAnps,
        traits_dominants: analysisResult.traits_dominants,
        mbti_updated: !quizCompleted.includes('mbti') && analysisResult.mbti?.type
      },
      justifications: analysisResult.justifications,
      messagesAnalyzed: lastMessages.length
    });

  } catch (error) {
    console.error('Erreur lors du refresh:', error);
    return NextResponse.json(
      { error: 'Erreur lors du refresh du profil' },
      { status: 500 }
    );
  }
}

// GET pour récupérer le profil actuel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    const [aiDouble] = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    if (!aiDouble) {
      return NextResponse.json(
        { error: 'Double IA non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        mbtiType: aiDouble.mbtiType,
        enneagramType: aiDouble.enneagramType,
        bigFiveScores: aiDouble.bigFiveScores,
        anpsScores: aiDouble.anpsScores,
        traitsDominants: aiDouble.traitsDominants,
        quizCompleted: aiDouble.quizCompleted,
        quizInProgress: aiDouble.quizInProgress,
        messagesCount: aiDouble.messagesCount,
        lastRefreshAt: aiDouble.lastRefreshAt
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}
