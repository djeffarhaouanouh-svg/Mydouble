import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { uploadMultipleToBlob } from '@/lib/blob';
import { db } from '@/lib/db';
import { screenshots as screenshotsTable } from '@/lib/schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configurer Google Vision avec les credentials
let visionClient: ImageAnnotatorClient | null = null;

try {
  // Essayer d'initialiser Google Vision avec les credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    visionClient = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  } else if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_KEY) {
    // Alternative: utiliser les credentials directement depuis les variables d'environnement
    visionClient = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      credentials: JSON.parse(process.env.GOOGLE_CLOUD_KEY),
    });
  }
} catch (error) {
  console.error('Erreur initialisation Google Vision:', error);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;

    // Récupérer toutes les images (peuvent être sous "screenshots" ou "screenshot_*")
    const screenshots: File[] = [];
    for (const [key, value] of formData.entries()) {
      if ((key === 'screenshots' || key.startsWith('screenshot_')) && value instanceof File) {
        screenshots.push(value);
      }
    }

    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: 'Aucune capture d\'écran trouvée' },
        { status: 400 }
      );
    }

    // Si userId n'est pas fourni, essayer de le récupérer depuis localStorage côté client
    // Pour l'instant, on va le demander dans le formData ou utiliser un userId temporaire
    let currentUserId = userId;
    if (!currentUserId) {
      // Générer un userId temporaire si non fourni (sera remplacé plus tard)
      currentUserId = `temp_${Date.now()}`;
    }

    // Uploader les screenshots vers Vercel Blob
    const uploadedUrls = await uploadMultipleToBlob(screenshots, `screenshots/${currentUserId}/`);

    // Sauvegarder les URLs dans la base de données si userId est valide
    if (currentUserId && !currentUserId.startsWith('temp_')) {
      const screenshotRecords = uploadedUrls.map((url, index) => ({
        userId: parseInt(currentUserId),
        filename: `screenshot_${index}.png`,
        url: url,
      }));

      await db.insert(screenshotsTable).values(screenshotRecords);
    }

    // Extraire le texte des images avec Google Vision
    const extractedTexts: string[] = [];

    if (visionClient) {
      for (const screenshot of screenshots) {
        try {
          const buffer = await screenshot.arrayBuffer();
          const [result] = await visionClient.textDetection({
            image: { content: Buffer.from(buffer) }
          });

          const detections = result.textAnnotations;
          if (detections && detections.length > 0) {
            // Le premier élément contient tout le texte détecté
            extractedTexts.push(detections[0].description || '');
          }
        } catch (error) {
          console.error('Erreur extraction texte avec Google Vision:', error);
          // Continuer avec les autres images
        }
      }
    } else {
      console.warn('Google Vision non configuré, utilisation de Claude Vision comme fallback');
      // Fallback: utiliser Claude Vision si Google Vision n'est pas disponible
      for (const screenshot of screenshots) {
        try {
          const buffer = await screenshot.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: 'Extrait tout le texte visible dans cette image de conversation. Retourne uniquement le texte, sans commentaires.',
                },
              ],
            }],
          });

          const text = response.content[0].type === 'text' ? response.content[0].text : '';
          if (text) {
            extractedTexts.push(text);
          }
        } catch (error) {
          console.error('Erreur extraction texte avec Claude Vision:', error);
        }
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

    // Parser la réponse JSON (nettoyer si nécessaire)
    let styleRules;
    try {
      // Nettoyer la réponse pour enlever les markdown code blocks si présents
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      styleRules = JSON.parse(cleanedResponse);
      
      // Ajouter des exemples de texte extrait pour que Claude puisse vraiment imiter le style
      // On garde les 3 premiers extraits comme exemples (tronqués à 500 caractères max chacun)
      const textExamples = extractedTexts
        .slice(0, 3)
        .map(text => text.substring(0, 500))
        .filter(text => text.length > 0);
      
      styleRules.textExamples = textExamples;
      styleRules.extractedTextCount = extractedTexts.length;
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      // Fallback sur des règles par défaut
      styleRules = {
        tone: "friendly and casual",
        expressions: ["mdr", "trop cool"],
        sentenceStructure: "short and direct",
        punctuation: "frequent use of emojis",
        details: "concise but friendly",
        textExamples: [],
        extractedTextCount: 0,
      };
    }

    // Sauvegarder les styleRules dans la base de données si userId est valide
    if (currentUserId && !currentUserId.startsWith('temp_')) {
      const { aiDoubles } = await import('@/lib/schema');
      const { eq } = await import('drizzle-orm');

      const existingDouble = await db.select()
        .from(aiDoubles)
        .where(eq(aiDoubles.userId, parseInt(currentUserId)))
        .limit(1);

      if (existingDouble && existingDouble.length > 0) {
        await db.update(aiDoubles)
          .set({ styleRules: styleRules })
          .where(eq(aiDoubles.id, existingDouble[0].id));
      }
    }

    return NextResponse.json({
      success: true,
      styleRules: styleRules,
      message: 'Style analysé avec succès',
      extractedTextsCount: extractedTexts.length,
    });

  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}
