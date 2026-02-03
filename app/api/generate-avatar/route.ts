import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { list } from '@vercel/blob';
import { CreditService } from '@/lib/credit-service';
import { copyUrlToBlob } from '@/lib/blob';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Coût en crédits pour la génération d'avatar
const AVATAR_GENERATION_COST = 10;

// Mapping ethnicité française -> nom du dossier dans Blob
const ETHNICITY_FOLDER_MAP: Record<string, string> = {
  "Occidentale": "occidentale",
  "Asiatique": "asiatique",
  "Africaine": "africaine",
  "Latine": "latine",
  "Indienne": "indienne",
  "Arabe": "arabe",
  "Métisse": "metisse",
};

// Récupérer les images de référence depuis Vercel Blob (sélection aléatoire)
async function getEthnicityReferenceImages(ethnicity: string): Promise<string[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn('BLOB_READ_WRITE_TOKEN non configuré - pas d\'images de référence');
    return [];
  }

  const folder = ETHNICITY_FOLDER_MAP[ethnicity];
  if (!folder) {
    console.warn(`Ethnicité inconnue: ${ethnicity}`);
    return [];
  }

  try {
    const { blobs } = await list({
      prefix: `references/ethnicite/${folder}/`,
      token,
    });

    const allUrls = blobs.map(b => b.url);

    // Minimum 2 images, maximum toutes les images disponibles
    const minImages = 2;
    if (allUrls.length <= minImages) {
      console.log(`Images de référence pour ${ethnicity} (toutes):`, allUrls);
      return allUrls;
    }

    // Sélectionner un nombre aléatoire entre 2 et le total
    const count = Math.floor(Math.random() * (allUrls.length - minImages + 1)) + minImages;

    // Mélanger et prendre les N premières
    const shuffled = [...allUrls].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    console.log(`Images de référence pour ${ethnicity} (${selected.length}/${allUrls.length}):`, selected);
    return selected;
  } catch (error) {
    console.error(`Erreur récupération images de référence pour ${ethnicity}:`, error);
    return [];
  }
}

// Traductions des attributs
const TRANSLATIONS = {
  ethnicite: {
    "Occidentale": "Caucasian/European",
    "Asiatique": "East Asian",
    "Africaine": "African/Black",
    "Latine": "Latina/Hispanic",
    "Indienne": "South Asian/Indian",
    "Arabe": "Middle Eastern/Arab",
    "Métisse": "Mixed race",
  },
  couleurYeux: {
    "Marron": "brown",
    "Bleu": "blue",
    "Vert": "green",
    "Gris": "gray",
    "Noisette": "hazel",
  },
  coiffure: {
    "Lisse": "straight",
    "Frange": "with bangs",
    "Bouclé": "curly",
    "Chignon": "in a bun",
    "Court": "short",
    "Attaché": "in a ponytail",
  },
  couleurCheveux: {
    "Brune": "brunette/brown",
    "Blonde": "blonde",
    "Noire": "black",
    "Rousse": "red/ginger",
    "Rose": "pink",
    "Blanche": "white/platinum",
  },
  typeCorps: {
    "Mince": "slim",
    "Moyenne": "average",
    "Athlétique": "athletic",
    "Pulpeuse": "curvy",
  },
  taillePoitrine: {
    "Petite (A)": "A",
    "Moyenne (B)": "B",
    "Forte (C)": "C",
    "Très forte (D)": "D",
  },
  vetements: {
    "Bikini": "a stylish bikini",
    "Robe élégante": "an elegant dress",
    "Casual": "casual everyday clothes",
    "Lingerie": "elegant lingerie",
    "Tenue de sport": "athletic sportswear",
    "Tenue de soirée": "a glamorous evening gown",
  },
};

// Descriptions du corps basées sur le type
const BODY_DESCRIPTIONS = {
  "Mince": "slim but healthy body, light curves",
  "Moyenne": "balanced feminine body, soft curves",
  "Athlétique": "toned body, firm shape, subtle curves",
  "Pulpeuse": "curvy feminine body, wider hips, soft waist, fuller thighs",
};

// Descriptions de la poitrine
const CHEST_DESCRIPTIONS = {
  "Petite (A)": "small natural chest",
  "Moyenne (B)": "medium natural chest",
  "Forte (C)": "fuller bust, natural rounded breasts",
  "Très forte (D)": "very full bust, heavy natural breasts, realistic gravity",
};

// Construire le prompt pour l'étape 1 (visage)
function buildFacePrompt(attributes: Record<string, string>): string {
  const ethnicity = TRANSLATIONS.ethnicite[attributes.ethnicite as keyof typeof TRANSLATIONS.ethnicite] || attributes.ethnicite;
  const age = attributes.age.replace(' ans', '');
  const eyeColor = TRANSLATIONS.couleurYeux[attributes.couleurYeux as keyof typeof TRANSLATIONS.couleurYeux] || attributes.couleurYeux;
  const hairStyle = TRANSLATIONS.coiffure[attributes.coiffure as keyof typeof TRANSLATIONS.coiffure] || attributes.coiffure;
  const hairColor = TRANSLATIONS.couleurCheveux[attributes.couleurCheveux as keyof typeof TRANSLATIONS.couleurCheveux] || attributes.couleurCheveux;

  return `Ultra realistic portrait of a young woman,
front facing, looking directly at the camera,
neutral expression, natural confident look,
unique identity, not generic, not model-like.

Ethnicity: ${ethnicity}
Age: ${age}
Eye color: ${eyeColor}
Hair: ${hairStyle}, ${hairColor}

Natural facial features, realistic proportions,
soft natural makeup, clean skin with subtle imperfections,
realistic eyes, realistic lips, natural eyebrows.

Studio daylight lighting, clean neutral background,
35mm lens look, sharp focus,
high detail skin texture, photorealistic,
no filters, no beauty retouching, no stylization.

This face must look like a real person,
not an influencer, not a model, not an AI face.`;
}

// Construire le prompt pour l'étape 2 (corps complet)
function buildBodyPrompt(attributes: Record<string, string>): string {
  const bodyType = TRANSLATIONS.typeCorps[attributes.typeCorps as keyof typeof TRANSLATIONS.typeCorps] || attributes.typeCorps;
  const chestSize = TRANSLATIONS.taillePoitrine[attributes.taillePoitrine as keyof typeof TRANSLATIONS.taillePoitrine] || attributes.taillePoitrine;
  const outfit = TRANSLATIONS.vetements[attributes.vetements as keyof typeof TRANSLATIONS.vetements] || attributes.vetements;

  const bodyDescription = BODY_DESCRIPTIONS[attributes.typeCorps as keyof typeof BODY_DESCRIPTIONS] || "balanced feminine body";
  const chestDescription = CHEST_DESCRIPTIONS[attributes.taillePoitrine as keyof typeof CHEST_DESCRIPTIONS] || "natural chest";

  return `Full body portrait of the SAME woman,
standing pose, front facing camera,
HEAD TO TOE framing, face clearly visible at top of frame,
same face, same identity, same person.

IMPORTANT: The entire body must be visible from head to feet,
the face and head must be fully visible at the top of the image.

Body type: ${bodyType}
Chest size: ${chestSize}

Adjust body proportions naturally:
${bodyDescription}, ${chestDescription}

Healthy feminine proportions, realistic anatomy,
balanced curves, natural posture.

Wearing: ${outfit}
Clothing fits the body naturally,
realistic fabric, proper support, no distortion.

Photorealistic, studio daylight lighting,
clean background, sharp focus,
full length portrait composition,
35mm lens look, natural shadows,
realistic skin texture.

This must look like a real photo of the same woman,
not a new person, not a new face.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attributes, name, userId } = body;

    if (!attributes) {
      return NextResponse.json(
        { error: 'Les attributs sont requis' },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    if (!userId || String(userId).startsWith('user_') || String(userId).startsWith('temp_')) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour générer un avatar' },
        { status: 401 }
      );
    }

    const userIdNum = parseInt(String(userId), 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'UserId invalide' },
        { status: 400 }
      );
    }

    // Vérifier et déduire les crédits
    const hasCredits = await CreditService.hasEnoughCredits(userIdNum, AVATAR_GENERATION_COST);
    if (!hasCredits) {
      const balance = await CreditService.getBalance(userIdNum);
      return NextResponse.json({
        error: 'Crédits insuffisants',
        errorCode: 'INSUFFICIENT_CREDITS',
        currentBalance: balance,
        required: AVATAR_GENERATION_COST,
        message: `Vous n'avez pas assez de crédits. Solde: ${balance}, Requis: ${AVATAR_GENERATION_COST}`,
      }, { status: 402 });
    }

    // Déduire les crédits AVANT la génération
    const deductResult = await CreditService.deductCredits(
      userIdNum,
      AVATAR_GENERATION_COST,
      undefined,
      `Génération d'avatar: ${name || 'Sans nom'}`
    );

    if (!deductResult.success) {
      return NextResponse.json({
        error: deductResult.error || 'Erreur lors de la déduction des crédits',
        errorCode: 'CREDIT_DEDUCTION_FAILED',
      }, { status: 402 });
    }

    console.log('=== GÉNÉRATION AVATAR EN 2 ÉTAPES ===');
    console.log('Crédits déduits:', AVATAR_GENERATION_COST, '- Nouveau solde:', deductResult.newBalance);
    console.log('Attributs reçus:', attributes);

    // ============ ÉTAPE 1: Génération du visage ============
    const facePrompt = buildFacePrompt(attributes);
    console.log('Étape 1 - Prompt visage:', facePrompt);

    // Récupérer les images de référence depuis Vercel Blob
    const referenceImages = await getEthnicityReferenceImages(attributes.ethnicite);
    const hasReferenceImages = referenceImages.length > 0;

    console.log('Images de référence pour', attributes.ethnicite, ':', referenceImages);

    // Construire l'input pour nano-banana
    const faceInput: { prompt: string; image_input?: string[] } = {
      prompt: facePrompt,
    };

    // Ajouter les images de référence si disponibles
    if (hasReferenceImages) {
      faceInput.image_input = referenceImages;
    }

    const faceOutput = await replicate.run("google/nano-banana", {
      input: faceInput,
    }) as { url: () => string };

    const faceImageUrlTemp = faceOutput.url();
    console.log('Étape 1 - Image visage générée (temp):', faceImageUrlTemp);

    // Stocker l'image du visage dans Vercel Blob pour persistance
    const faceImageUrl = await copyUrlToBlob(
      faceImageUrlTemp,
      `avatars/faces/${userIdNum}-${Date.now()}.png`
    ) || faceImageUrlTemp;
    console.log('Étape 1 - Image visage stockée dans Blob:', faceImageUrl);

    // ============ ÉTAPE 2: Génération du corps complet ============
    const bodyPrompt = buildBodyPrompt(attributes);
    console.log('Étape 2 - Prompt corps:', bodyPrompt);

    const bodyOutput = await replicate.run("google/nano-banana", {
      input: {
        prompt: bodyPrompt,
        image_input: [faceImageUrl], // Utiliser le visage généré comme référence
        aspect_ratio: "1:1", // Format carré
      },
    }) as { url: () => string };

    const finalImageUrl = bodyOutput.url();
    console.log('Étape 2 - Image finale générée:', finalImageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      faceImageUrl: faceImageUrl, // Optionnel: retourner aussi l'image du visage
      prompts: {
        face: facePrompt,
        body: bodyPrompt,
      },
    });
  } catch (error) {
    console.error('Erreur génération avatar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la génération' },
      { status: 500 }
    );
  }
}
