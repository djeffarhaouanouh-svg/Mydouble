import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { aiDoubles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, quizType } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    if (!quizType || !['personnalite', 'souvenir', 'identite'].includes(quizType)) {
      return NextResponse.json(
        { error: 'Type de quiz invalide. Doit être: personnalite, souvenir ou identite' },
        { status: 400 }
      );
    }

    // Récupérer le double IA de l'utilisateur pour avoir le contexte
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

    const personality = aiDouble[0].personality as any;
    const styleRules = aiDouble[0].styleRules as any;

    // Construire le prompt selon le type de quiz
    let quizPrompt = '';

    switch (quizType) {
      case 'personnalite':
        quizPrompt = `Tu es le double IA de cette personne. Tu connais sa personnalité et son style d'écriture.

Personnalité:
- Ton: ${personality?.tone || 'friendly'}
- Niveau d'énergie: ${personality?.energy_level || 'medium'}
- Style d'humour: ${personality?.humor_style || 'light'}
- Emojis: ${personality?.emojis || 'moderate'}
- Longueur de messages: ${personality?.messageLength || 'medium'}

Style d'écriture:
- Expressions favorites: ${styleRules?.expressions?.join(', ') || 'aucune'}
- Ponctuation: ${styleRules?.punctuation || 'normale'}

Lance un quiz de personnalité interactif. Pose des questions pour mieux comprendre la personne, ses valeurs, ses motivations, ses préférences. 
Commence par une question d'introduction amicale et pose 3-5 questions progressives pour découvrir sa personnalité profonde.
Réponds comme si tu étais cette personne, avec son style et sa personnalité.`;

        break;

      case 'souvenir':
        quizPrompt = `Tu es le double IA de cette personne. Tu connais sa personnalité et son style d'écriture.

Personnalité:
- Ton: ${personality?.tone || 'friendly'}
- Niveau d'énergie: ${personality?.energy_level || 'medium'}
- Style d'humour: ${personality?.humor_style || 'light'}
- Emojis: ${personality?.emojis || 'moderate'}
- Longueur de messages: ${personality?.messageLength || 'medium'}

Style d'écriture:
- Expressions favorites: ${styleRules?.expressions?.join(', ') || 'aucune'}
- Ponctuation: ${styleRules?.punctuation || 'normale'}

Lance un quiz de souvenirs interactif. Pose des questions pour découvrir les souvenirs importants de cette personne, ses expériences marquantes, ses moments préférés, ses voyages, ses rencontres significatives.
Commence par une question d'introduction amicale et pose 3-5 questions progressives pour explorer ses souvenirs.
Réponds comme si tu étais cette personne, avec son style et sa personnalité.`;

        break;

      case 'identite':
        quizPrompt = `Tu es le double IA de cette personne. Tu connais sa personnalité et son style d'écriture.

Personnalité:
- Ton: ${personality?.tone || 'friendly'}
- Niveau d'énergie: ${personality?.energy_level || 'medium'}
- Style d'humour: ${personality?.humor_style || 'light'}
- Emojis: ${personality?.emojis || 'moderate'}
- Longueur de messages: ${personality?.messageLength || 'medium'}

Style d'écriture:
- Expressions favorites: ${styleRules?.expressions?.join(', ') || 'aucune'}
- Ponctuation: ${styleRules?.punctuation || 'normale'}

Lance un quiz d'identité interactif. Pose des questions pour découvrir qui est vraiment cette personne : ses passions, ses rêves, ses valeurs profondes, ce qui la définit, ce qui la rend unique, ses aspirations.
Commence par une question d'introduction amicale et pose 3-5 questions progressives pour explorer son identité profonde.
Réponds comme si tu étais cette personne, avec son style et sa personnalité.`;

        break;
    }

    // Appeler Claude avec le prompt du quiz
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: quizPrompt
      }]
    });

    const quizResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Erreur lors de la génération du quiz';

    return NextResponse.json({
      success: true,
      quizType,
      response: quizResponse,
      message: `Quiz ${quizType} lancé avec succès`,
    });

  } catch (error) {
    console.error('Erreur lors du quiz:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du quiz' },
      { status: 500 }
    );
  }
}
