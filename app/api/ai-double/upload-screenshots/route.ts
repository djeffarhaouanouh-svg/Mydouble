import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import vision from '@google-cloud/vision';
import { uploadMultipleToBlob } from '@/lib/blob';
import { db } from '@/lib/db';
import { screenshots as screenshotsTable } from '@/lib/schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configurer Google Vision avec les credentials
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
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

    // Uploader les screenshots vers Vercel Blob
    const uploadedUrls = await uploadMultipleToBlob(screenshots, `screenshots/${userId}/`);

    // Sauvegarder les URLs dans la base de données
    const screenshotRecords = uploadedUrls.map((url, index) => ({
      userId: parseInt(userId),
      filename: `screenshot_${index}.png`,
      url: url,
    }));

    await db.insert(screenshotsTable).values(screenshotRecords);

    // Extraire le texte des images avec Google Vision
    const extractedTexts: string[] = [];

    for (const screenshot of screenshots) {
      try {
        const buffer = await screenshot.arrayBuffer();
        const [result] = await visionClient.textDetection({
          image: { content: Buffer.from(buffer) }
        });

        const detections = result.textAnnotations;
        if (detections && detections.length > 0) {
          extractedTexts.push(detections[0].description || '');
        }
      } catch (error) {
        console.error('Erreur extraction texte:', error);
      }
    }

    if (extractedTexts.length === 0) {
      return NextResponse.json(
        { error: 'Impossible d\'extraire le texte des captures d\'écran' },
        { status: 400 }
      );
    }

    // Analyser le style d'écriture avec Claude
    const combinedText = extractedTexts.join('\n\n---\n\n');
    const analysisPrompt = `Analyse ce texte extrait de conversations et identifie le style d'écriture de la personne.

Texte:
${combinedText}

Résume en quelques points clés:
- Le ton général (formel, amical, décontracté, etc.)
- Les expressions favorites
- La structure des phrases
- L'utilisation de ponctuation
- Les tics de langage
- Le niveau de détail

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans \`\`\`json) avec cette structure exacte:
{
  "tone": "description du ton",
  "expressions": ["expression1", "expression2"],
  "sentenceStructure": "description de la structure",
  "punctuation": "description de la ponctuation",
  "details": "description du niveau de détail"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: analysisPrompt
      }]
    });

    const aiResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : '{}';

    // Parser la réponse JSON
    let styleRules;
    try {
      styleRules = JSON.parse(aiResponse);
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      // Fallback sur des règles par défaut
      styleRules = {
        tone: "friendly and casual",
        expressions: ["mdr", "trop cool"],
        sentenceStructure: "short and direct",
        punctuation: "frequent use of emojis",
        details: "concise but friendly",
      };
    }

    // Sauvegarder les styleRules dans la base de données
    const { aiDoubles } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');

    await db.update(aiDoubles)
      .set({ styleRules: styleRules })
      .where(eq(aiDoubles.userId, parseInt(userId)));

    return NextResponse.json({
      success: true,
      styleRules: styleRules,
      message: 'Style analysé avec succès',
      extractedTextsCount: extractedTexts.length,
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}
