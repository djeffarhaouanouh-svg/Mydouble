import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { aiDoubles } from '@/lib/schema';
import type { Diagnostic } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    const diagnosticPrompt = `Tu es un expert en psychologie de la personnalité et en ennéagramme. Analyse les réponses suivantes d'un questionnaire de personnalité et génère un diagnostic complet.

Réponses du questionnaire:
- Ton: ${personality.tone || 'N/A'}
- Niveau d'énergie: ${personality.energy_level || 'N/A'}
- Longueur de réponses: ${personality.response_length || 'N/A'}
- Empathie: ${personality.empathy || 'N/A'}
- Style d'humour: ${personality.humor_style || 'N/A'}
- Sujets de confort: ${Array.isArray(personality.topics_comfort) ? personality.topics_comfort.join(', ') : 'N/A'}
- Limites de conversation: ${Array.isArray(personality.conversation_boundaries) ? personality.conversation_boundaries.join(', ') : 'N/A'}

${styleRules ? `Règles de style: ${JSON.stringify(styleRules)}` : ''}

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
- Les noms de traits doivent être pertinents par rapport aux réponses (ex: si énergique + direct = Pragmatique, Direct, etc.)
- Détermine le type d'ennéagramme (1-9) basé sur les réponses
- NE MENTIONNE JAMAIS les ailes (wings) dans la description ou le nom
- La description de l'ennéagramme doit être complète et détaillée, expliquant les motivations, forces et défis, SANS mentionner d'aile
- Le label doit être uniquement le numéro du type (ex: "3" et non "3w8")
- Le nom doit être le nom simple du type (ex: "Le Battant" et non "Le Battant-Protecteur")
- Génère 4 conseils pratiques et personnalisés (le dernier peut avoir highlight: true et number: "💡")
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

      diagnostic = {
        traits,
        enneagram: parsedDiagnostic.enneagram,
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
