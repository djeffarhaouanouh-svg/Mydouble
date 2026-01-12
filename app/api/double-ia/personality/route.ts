import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers } = body;

    if (!answers) {
      return NextResponse.json(
        { error: 'Réponses requises' },
        { status: 400 }
      );
    }

    // Transformer les réponses du questionnaire en format personality standard
    const personalityRules = {
      tone: answers.tone || 'friendly',
      energy_level: answers.energy_level || 'medium',
      response_length: answers.response_length || 'medium',
      empathy: answers.empathy || 'medium',
      humor_style: answers.humor_style || 'light',
      topics_comfort: answers.topics_comfort || [],
      conversation_boundaries: answers.conversation_boundaries || [],
      // Format pour compatibilité avec l'API chat
      humor: answers.humor_style || 'light',
      emojis: answers.humor_style === 'none' ? 'rare' : 'moderate',
      messageLength: answers.response_length || 'medium',
      interests: answers.topics_comfort || [],
    };

    return NextResponse.json({
      success: true,
      personalityRules,
    });

  } catch (error) {
    console.error('Erreur lors de la transformation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la transformation de la personnalité' },
      { status: 500 }
    );
  }
}
