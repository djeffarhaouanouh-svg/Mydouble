import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { aiDoubles } from '@/lib/schema';
import type { Diagnostic } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Textes pré-définis pour chaque type d'ennéagramme
const enneagramTexts: Record<number, { defauts: string; enfance: string }> = {
  1: {
    defauts: "Les défauts typiques de ce type incluent une tendance à l'autocritique excessive, à la rigidité et au perfectionnisme. Le type 1 peut avoir du mal à se détendre et à accepter l'imperfection, chez lui comme chez les autres.",
    enfance: "Le type 1 se développe souvent dans un environnement où l'on valorise fortement les règles, la morale et le sens du devoir. L'enfant apprend tôt qu'il doit être \"sage\" et irréprochable pour être aimé et reconnu."
  },
  2: {
    defauts: "Le type 2 peut devenir dépendant du regard des autres, se sacrifier excessivement et avoir du mal à poser des limites. Il risque aussi d'attendre inconsciemment de la reconnaissance en échange de son aide.",
    enfance: "Souvent, l'enfant apprend qu'il reçoit de l'amour surtout lorsqu'il s'occupe des autres. Il développe alors une stratégie basée sur le don de soi pour se sentir indispensable et aimé."
  },
  3: {
    defauts: "Les défauts typiques de ce type incluent une tendance à se définir uniquement par la réussite, à cacher ses émotions et à rechercher la validation extérieure. Le type 3 peut perdre contact avec sa vraie identité.",
    enfance: "Le type 3 grandit souvent dans un contexte où la réussite est fortement valorisée. Il comprend très tôt qu'il est aimé pour ce qu'il accomplit, pas forcément pour ce qu'il est."
  },
  4: {
    defauts: "Le type 4 peut s'enfermer dans la comparaison, le sentiment de manque et la mélancolie. Il a parfois tendance à dramatiser ses émotions et à se sentir incompris.",
    enfance: "Souvent, l'enfant a le sentiment d'être différent ou mis à l'écart. Il développe une identité basée sur l'originalité et la profondeur émotionnelle pour donner du sens à ce sentiment de décalage."
  },
  5: {
    defauts: "Le type 5 peut devenir distant, trop dans l'analyse et éviter l'implication émotionnelle. Il a parfois du mal à demander de l'aide et à se sentir en sécurité dans la relation.",
    enfance: "L'enfant apprend souvent à se replier sur lui-même pour se protéger. Il développe l'idée que comprendre le monde est plus sûr que s'y exposer émotionnellement."
  },
  6: {
    defauts: "Le type 6 peut être envahi par le doute, l'anxiété et la méfiance. Il oscille souvent entre besoin de sécurité et peur de l'autorité.",
    enfance: "Le type 6 se développe fréquemment dans un climat d'incertitude ou d'instabilité. L'enfant apprend à anticiper les dangers et à chercher des figures rassurantes pour se sentir en sécurité."
  },
  7: {
    defauts: "Le type 7 a tendance à fuir la frustration, éviter les émotions difficiles et se disperser. Il peut avoir du mal à rester engagé quand les choses deviennent inconfortables.",
    enfance: "L'enfant apprend à se protéger de la souffrance en cherchant constamment le plaisir et la nouveauté. Il développe une stratégie basée sur l'optimisme pour ne pas ressentir le manque."
  },
  8: {
    defauts: "Le type 8 peut devenir excessivement dominant, impulsif et dans le contrôle. Il a parfois du mal à montrer sa vulnérabilité et à faire confiance.",
    enfance: "Souvent confronté tôt à l'injustice ou à la dureté, l'enfant apprend à être fort pour survivre. Il développe une posture de protection et de puissance pour ne plus jamais être vulnérable."
  },
  9: {
    defauts: "Le type 9 peut s'oublier lui-même, éviter les conflits et avoir du mal à affirmer ses besoins. Il risque de tomber dans la passivité et l'inaction.",
    enfance: "L'enfant comprend que rester calme et ne pas faire de vagues est un moyen d'obtenir la paix. Il développe une stratégie d'effacement pour maintenir l'harmonie autour de lui."
  }
};

// Mapping des gradients et couleurs pour les traits
const gradientMap: Record<string, { gradient: string; colorClass: string }> = {
  purple: { gradient: 'grad-purple', colorClass: 'purple' },
  blue: { gradient: 'grad-blue', colorClass: 'blue' },
  pink: { gradient: 'grad-pink', colorClass: 'pink' },
  green: { gradient: 'grad-green', colorClass: 'green' },
  yellow: { gradient: 'grad-yellow', colorClass: 'yellow' },
  orange: { gradient: 'grad-orange', colorClass: 'orange' },
};

function assignGradientAndColor(index: number): { gradient: string; colorClass: string } {
  const colors = ['purple', 'blue', 'pink', 'green', 'yellow', 'orange'];
  const color = colors[index % colors.length];
  return gradientMap[color];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, personality, styleRules, voiceId, voiceName } = body;

    if (!userId || !personality) {
      return NextResponse.json(
        { error: 'UserId et personality requis' },
        { status: 400 }
      );
    }

    // Construire le prompt pour Claude
    // Utiliser la description détaillée si disponible (nouveau format), sinon utiliser les champs simples
    const personalityDescription = (personality as any).description || '';
    const rawAnswers = (personality as any).rawAnswers || {};
    const scores = (personality as any).scores || {};

    // Mapping des questions pour un contexte plus lisible
    const questionLabels: Record<string, string> = {
      accept_errors: "J'ai du mal à accepter mes erreurs",
      do_things_right: "Je ressens souvent le besoin de faire les choses \"comme il faut\"",
      valued_helping: "Je me sens valorisé quand je peux aider les autres",
      others_before_me: "J'ai tendance à penser aux besoins des autres avant les miens",
      success_important: "Réussir est très important pour moi",
      adapt_behavior: "J'adapte souvent mon comportement pour être bien perçu",
      feel_different: "Je me sens souvent différent des autres",
      emotions_important: "Mes émotions prennent une grande place dans ma vie",
      need_alone_time: "J'ai besoin de beaucoup de temps seul pour me ressourcer",
      understand_depth: "J'aime comprendre les choses en profondeur avant d'agir",
      think_risks: "Je pense souvent aux risques possibles avant de prendre une décision",
      need_security: "J'ai besoin de me sentir en sécurité pour avancer sereinement",
      seek_experiences: "Je cherche souvent de nouvelles expériences stimulantes",
      avoid_negative: "J'évite autant que possible les situations trop négatives ou pesantes",
      keep_control: "J'aime garder le contrôle de ma vie et de mes choix",
      hide_vulnerability: "Je n'aime pas montrer ma vulnérabilité",
      avoid_conflicts: "J'évite les conflits autant que possible",
      preserve_harmony: "Je préfère préserver l'harmonie plutôt que d'imposer mon avis"
    };

    let personalityContext = '';
    if (personalityDescription) {
      // Nouveau format avec description détaillée
      const readableAnswers = Object.entries(rawAnswers)
        .map(([key, value]) => {
          const question = questionLabels[key] || key;
          const answerLabel = value === 'd_accord' ? 'D\'accord' : value === 'pas_d_accord' ? 'Pas d\'accord' : 'Neutre';
          return `- ${question}: ${answerLabel}`;
        })
        .join('\n');

      personalityContext = `PROFIL DE PERSONNALITÉ DÉTAILLÉ:
${personalityDescription}

RÉPONSES DÉTAILLÉES DU QUESTIONNAIRE (18 questions):
${readableAnswers}

SCORES CALCULÉS POUR CHAQUE TRAIT:
${Object.entries(scores).map(([key, value]) => {
        const question = questionLabels[key] || key;
        return `- ${question}: ${typeof value === 'number' ? value.toFixed(2) : value}`;
      }).join('\n')}`;
    } else {
      // Ancien format (rétrocompatibilité)
      personalityContext = `Réponses du questionnaire:
- Ton: ${personality.tone || 'N/A'}
- Niveau d'énergie: ${(personality as any).energy_level || 'N/A'}
- Longueur de réponses: ${(personality as any).response_length || 'N/A'}
- Empathie: ${(personality as any).empathy || 'N/A'}
- Style d'humour: ${personality.humor || 'N/A'}
- Sujets de confort: ${Array.isArray(personality.interests) ? personality.interests.join(', ') : 'N/A'}`;
    }

    const diagnosticPrompt = `Tu es un expert en psychologie de la personnalité et en ennéagramme. Analyse les informations suivantes d'un questionnaire de personnalité et génère un diagnostic complet.

${personalityContext}

${styleRules ? `Règles de style d'écriture: ${JSON.stringify(styleRules)}` : ''}

Génère un diagnostic complet au format JSON strict (sans markdown, sans code blocks) avec cette structure EXACTE:

{
  "traits": [
    {
      "name": "Pragmatique",
      "score": 95,
      "evolution": 0,
      "gradient": "grad-purple",
      "colorClass": "purple"
    },
    {
      "name": "Technique",
      "score": 90,
      "evolution": 0,
      "gradient": "grad-blue",
      "colorClass": "blue"
    },
    {
      "name": "Direct",
      "score": 88,
      "evolution": 0,
      "gradient": "grad-pink",
      "colorClass": "pink"
    },
    {
      "name": "Débrouillard",
      "score": 87,
      "evolution": 0,
      "gradient": "grad-green",
      "colorClass": "green"
    },
    {
      "name": "Curieux",
      "score": 85,
      "evolution": 0,
      "gradient": "grad-yellow",
      "colorClass": "yellow"
    },
    {
      "name": "Perfectionniste",
      "score": 82,
      "evolution": 0,
      "gradient": "grad-orange",
      "colorClass": "orange"
    }
  ],
  "enneagram": {
    "type": 3,
    "label": "3",
    "name": "Le Battant",
    "desc": "Motivé par la réussite et l'impact, tu es ambitieux et orienté vers les résultats. Tu avances vite, tu veux des résultats concrets et tu assumes naturellement un rôle de leader."
  },
  "advice": [
    {
      "number": "1",
      "title": "Cultive ton impatience productive",
      "content": "Ton besoin de résultats rapides n'est pas un défaut, c'est un moteur. Utilise-le : découpe tes gros projets en micro-victoires quotidiennes. Ça te garde motivé et tu avances 10x plus vite."
    },
    {
      "number": "2",
      "title": "Documente tes raccourcis",
      "content": "Tu trouves constamment des solutions élégantes. Note-les : crée-toi une bibliothèque personnelle de \"patterns qui marchent\". Dans 6 mois, tu auras un arsenal de stratégies éprouvées."
    },
    {
      "number": "3",
      "title": "Protège tes phases de deep work",
      "content": "Ta force = focus intense sur l'essentiel. Blindage nécessaire : bloque 2-3h par jour en mode \"zéro interruption\". C'est là que tu produis ta meilleure work."
    },
    {
      "number": "💡",
      "title": "Ton superpower caché",
      "content": "Tu transformes la complexité en simplicité. Quand les autres voient un problème compliqué, tu vois 3 étapes claires. Monétise ça : les gens paieraient cher pour cette clarté. Enseigne, consulte, crée du contenu qui simplifie.",
      "highlight": true
    }
  ],
  "summary": "Un profil orienté résultats, efficacité et solutions concrètes."
}

IMPORTANT:
- Génère exactement 6 traits dominants avec des scores entre 70 et 100
- Pour chaque trait, utilise les gradients dans cet ordre: grad-purple, grad-blue, grad-pink, grad-green, grad-yellow, grad-orange
- Pour chaque trait, utilise les colorClass correspondants: purple, blue, pink, green, yellow, orange
- evolution doit toujours être 0 initialement
- Les noms de traits doivent être pertinents par rapport aux réponses du questionnaire

POUR DÉTERMINER L'ENNÉAGRAMME:
Analyse attentivement les réponses du questionnaire pour identifier le type d'ennéagramme (1-9):
- Type 1 (Le Perfectionniste): accept_errors faible + do_things_right élevé = perfectionnisme, besoin de faire "comme il faut"
- Type 2 (L'Aidant): valued_helping élevé + others_before_me élevé = altruisme, besoin d'aider
- Type 3 (Le Battant): success_important élevé + adapt_behavior élevé = orientation réussite, adaptation pour être perçu positivement
- Type 4 (L'Individualiste): feel_different élevé + emotions_important élevé = sentiment de différence, émotions importantes
- Type 5 (L'Investigateur): need_alone_time élevé + understand_depth élevé = besoin de solitude, compréhension profonde
- Type 6 (Le Loyaliste): think_risks élevé + need_security élevé = prudence, besoin de sécurité
- Type 7 (L'Enthousiaste): seek_experiences élevé + avoid_negative élevé = recherche d'expériences, évitement du négatif
- Type 8 (Le Challenger): keep_control élevé + hide_vulnerability élevé = besoin de contrôle, évitement de la vulnérabilité
- Type 9 (Le Pacificateur): avoid_conflicts élevé + preserve_harmony élevé = évitement des conflits, préservation de l'harmonie

- NE MENTIONNE JAMAIS les ailes (wings) dans la description ou le nom
- La description de l'ennéagramme doit être complète et détaillée, expliquant les motivations, forces et défis, SANS mentionner d'aile
- Le label doit être uniquement le numéro du type (ex: "3" et non "3w8")
- Le nom doit être le nom simple du type (ex: "Le Battant" et non "Le Battant-Protecteur")
- Génère 4 conseils pratiques et personnalisés basés sur le profil réel (le dernier peut avoir highlight: true et number: "💡")
- Le résumé doit être concis et percutant, une phrase maximum

- Retourne UNIQUEMENT le JSON valide, sans texte avant ou après, sans markdown, sans code blocks`;

    // Appeler Claude pour générer le diagnostic
    let diagnostic: Diagnostic | null = null;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: diagnosticPrompt,
          },
        ],
      });

      const responseText = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // Parser le JSON de la réponse
      // Nettoyer la réponse si elle contient des markdown code blocks
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const parsedDiagnostic = JSON.parse(jsonText);

      // Vérifier et compléter la structure si nécessaire
      const traits = parsedDiagnostic.traits.map((trait: any, index: number) => {
        // Si les gradients/colorClass ne sont pas présents, les ajouter
        if (!trait.gradient || !trait.colorClass) {
          const { gradient, colorClass } = assignGradientAndColor(index);
          return {
            name: trait.name,
            score: trait.score || 80,
            evolution: trait.evolution !== undefined ? trait.evolution : 0,
            gradient: trait.gradient || gradient,
            colorClass: trait.colorClass || colorClass,
          };
        }
        return {
          name: trait.name,
          score: trait.score || 80,
          evolution: trait.evolution !== undefined ? trait.evolution : 0,
          gradient: trait.gradient,
          colorClass: trait.colorClass,
        };
      });

      // Ajouter les textes pré-définis selon le type d'ennéagramme
      const enneagramType = parsedDiagnostic.enneagram?.type;
      const predefinedTexts = enneagramType && enneagramTexts[enneagramType] 
        ? enneagramTexts[enneagramType] 
        : { defauts: '', enfance: '' };

      const enneagram = {
        ...parsedDiagnostic.enneagram,
        defauts: predefinedTexts.defauts,
        enfance: predefinedTexts.enfance,
      };

      console.log('[CREATE] Ennéagramme généré:', JSON.stringify(enneagram, null, 2));

      diagnostic = {
        traits,
        enneagram: enneagram,
        advice: parsedDiagnostic.advice || [],
        summary: parsedDiagnostic.summary || 'Un profil unique et personnalisé.',
      };
    } catch (claudeError) {
      console.error('Erreur lors de la génération du diagnostic avec Claude:', claudeError);
      // Utiliser des valeurs par défaut si Claude échoue
      diagnostic = {
        traits: [
          { name: 'Pragmatique', score: 85, evolution: 0, gradient: 'grad-purple', colorClass: 'purple' },
          { name: 'Technique', score: 80, evolution: 0, gradient: 'grad-blue', colorClass: 'blue' },
          { name: 'Direct', score: 75, evolution: 0, gradient: 'grad-pink', colorClass: 'pink' },
          { name: 'Débrouillard', score: 75, evolution: 0, gradient: 'grad-green', colorClass: 'green' },
          { name: 'Curieux', score: 70, evolution: 0, gradient: 'grad-yellow', colorClass: 'yellow' },
          { name: 'Perfectionniste', score: 70, evolution: 0, gradient: 'grad-orange', colorClass: 'orange' },
        ],
        enneagram: {
          type: 3,
          label: '3',
          name: 'Le Battant',
          desc: 'Motivé par la réussite et l\'impact, tu es ambitieux et orienté vers les résultats. Tu avances vite, tu veux des résultats concrets et tu assumes naturellement un rôle de leader.',
          defauts: enneagramTexts[3].defauts,
          enfance: enneagramTexts[3].enfance,
        },
        advice: [
          {
            number: '1',
            title: 'Cultive ton impatience productive',
            content: 'Ton besoin de résultats rapides n\'est pas un défaut, c\'est un moteur. Utilise-le : découpe tes gros projets en micro-victoires quotidiennes. Ça te garde motivé et tu avances 10x plus vite.',
          },
          {
            number: '2',
            title: 'Documente tes raccourcis',
            content: 'Tu trouves constamment des solutions élégantes. Note-les : crée-toi une bibliothèque personnelle de "patterns qui marchent". Dans 6 mois, tu auras un arsenal de stratégies éprouvées.',
          },
          {
            number: '3',
            title: 'Protège tes phases de deep work',
            content: 'Ta force = focus intense sur l\'essentiel. Blindage nécessaire : bloque 2-3h par jour en mode "zéro interruption". C\'est là que tu produis ta meilleure work.',
          },
          {
            number: '💡',
            title: 'Ton superpower caché',
            content: 'Tu transformes la complexité en simplicité. Quand les autres voient un problème compliqué, tu vois 3 étapes claires. Monétise ça : les gens paieraient cher pour cette clarté. Enseigne, consulte, crée du contenu qui simplifie.',
            highlight: true,
          },
        ],
        summary: 'Un profil orienté résultats, efficacité et solutions concrètes.',
      };
    }

    // Sauvegarder le double IA dans la base de données
    const result = await db.insert(aiDoubles).values({
      userId: parseInt(userId),
      personality: personality,
      styleRules: styleRules || null,
      voiceId: voiceId || null,
      diagnostic: diagnostic,
      messagesCount: 0,
      improvementLevel: 0,
    }).returning();

    return NextResponse.json({
      success: true,
      doubleId: result[0].id,
      aiDouble: result[0],
      message: 'Double IA créé avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la création:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du double IA' },
      { status: 500 }
    );
  }
}
