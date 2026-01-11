import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Récupérer toutes les images
    const screenshots: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('screenshot_') && value instanceof File) {
        screenshots.push(value);
      }
    }

    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: 'Aucune capture d\'écran trouvée' },
        { status: 400 }
      );
    }

    // Analyser les images avec Claude Vision pour extraire le style
    const analysisPrompt = `Analyse ces captures d'écran de conversations et identifie le style d'écriture de la personne. 
    
Résume en quelques points clés:
- Le ton général (formel, amical, décontracté, etc.)
- Les expressions favorites
- La structure des phrases
- L'utilisation de ponctuation
- Les tics de langage
- Le niveau de détail

Retourne uniquement un objet JSON avec ces informations structurées.`;

    // Pour le moment, on retourne une réponse mockée
    // Dans la vraie version, tu enverrais les images à Claude Vision
    const mockStyleRules = {
      tone: "friendly and casual",
      expressions: ["mdr", "trop cool", "franchement"],
      sentenceStructure: "short and direct",
      punctuation: "frequent use of emojis",
      details: "concise but friendly",
    };

    // Sauvegarder dans la base de données (à implémenter)
    // await saveUserStyleRules(userId, mockStyleRules);

    return NextResponse.json({
      success: true,
      styleRules: mockStyleRules,
      message: 'Style analysé avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}
