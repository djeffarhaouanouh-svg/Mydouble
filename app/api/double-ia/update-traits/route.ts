import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { aiDoubles, messages } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import type { Diagnostic, Trait } from '@/lib/types';

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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Récupérer le double IA
    const aiDouble = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    if (!aiDouble || aiDouble.length === 0) {
      return NextResponse.json(
        { error: 'Double IA non trouvé' },
        { status: 404 }
      );
    }

    const double = aiDouble[0];
    const currentDiagnostic = double.diagnostic as Diagnostic | null;

    if (!currentDiagnostic) {
      return NextResponse.json(
        { error: 'Diagnostic initial non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les 50 derniers messages pour l'analyse
    const recentMessages = await db.select()
      .from(messages)
      .where(eq(messages.userId, parseInt(userId)))
      .orderBy(desc(messages.createdAt))
      .limit(50);

    // Construire le prompt pour analyser les conversations et mettre à jour les traits
    const conversationHistory = recentMessages
      .reverse()
      .map(msg => `${msg.role === 'user' ? 'Utilisateur' : 'IA'}: ${msg.content}`)
      .join('\n\n');

    const updateTraitsPrompt = `Tu es un expert en psychologie de la personnalité. Analyse l'historique de conversation suivant et mets à jour les scores des traits de personnalité basés sur les échanges récents.

Historique des conversations (50 derniers messages):
${conversationHistory}

Traits actuels:
${currentDiagnostic.traits.map((t, i) => `${i + 1}. ${t.name}: ${t.score}%`).join('\n')}

Analyse les conversations et ajuste les scores des traits (entre 70 et 100) en fonction de ce qui ressort réellement des échanges. Les traits doivent refléter le comportement observé dans les conversations.

Retourne UNIQUEMENT un JSON avec cette structure exacte:
{
  "traits": [
    {
      "name": "Pragmatique",
      "score": 95,
      "evolution": 3
    },
    {
      "name": "Technique",
      "score": 90,
      "evolution": 5
    },
    ...
  ]
}

IMPORTANT:
- Génère exactement 6 traits dans le même ordre que les traits actuels
- Les scores doivent être entre 70 et 100
- Le champ "evolution" doit être la différence entre le nouveau score et l'ancien (peut être négatif)
- Garde les mêmes noms de traits
- Retourne UNIQUEMENT le JSON, sans markdown, sans code blocks`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: updateTraitsPrompt,
          },
        ],
      });

      const responseText = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // Parser le JSON
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const parsedTraits = JSON.parse(jsonText);

      // Mettre à jour les traits avec les gradients et colorClass
      const updatedTraits: Trait[] = parsedTraits.traits.map((trait: any, index: number) => {
        const existingTrait = currentDiagnostic.traits[index];
        const { gradient, colorClass } = existingTrait 
          ? { gradient: existingTrait.gradient, colorClass: existingTrait.colorClass }
          : assignGradientAndColor(index);

        return {
          name: trait.name || existingTrait?.name || 'Trait',
          score: trait.score || existingTrait?.score || 80,
          evolution: trait.evolution !== undefined ? trait.evolution : 0,
          gradient,
          colorClass,
        };
      });

      // Mettre à jour le diagnostic dans la DB
      const updatedDiagnostic: Diagnostic = {
        ...currentDiagnostic,
        traits: updatedTraits,
      };

      await db.update(aiDoubles)
        .set({ diagnostic: updatedDiagnostic })
        .where(eq(aiDoubles.id, double.id));

      return NextResponse.json({
        success: true,
        traits: updatedTraits,
        message: 'Traits mis à jour avec succès',
      });

    } catch (claudeError) {
      console.error('Erreur lors de la mise à jour des traits avec Claude:', claudeError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des traits' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour des traits:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des traits' },
      { status: 500 }
    );
  }
}
