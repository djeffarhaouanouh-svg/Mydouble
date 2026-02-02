import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const ETHNICITIES = [
  'occidentale',
  'asiatique',
  'africaine',
  'latine',
  'indienne',
  'arabe',
  'metisse',
];

export async function POST(request: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN non configuré' },
        { status: 500 }
      );
    }

    const results: Record<string, string[]> = {};

    // Parcourir chaque ethnicité
    for (const ethnicity of ETHNICITIES) {
      const localDir = path.join(process.cwd(), 'public', 'references', 'ethnicite', ethnicity);

      if (!fs.existsSync(localDir)) {
        console.log(`Dossier non trouvé: ${localDir}`);
        results[ethnicity] = [];
        continue;
      }

      const files = fs.readdirSync(localDir).filter(f =>
        /\.(jpg|jpeg|png|webp)$/i.test(f)
      );

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const filePath = path.join(localDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer], {
          type: file.endsWith('.png') ? 'image/png' : 'image/jpeg'
        });

        // Upload vers Blob avec un nom unique
        const blobResult = await put(
          `references/ethnicite/${ethnicity}/${file}`,
          blob,
          { access: 'public', token }
        );

        uploadedUrls.push(blobResult.url);
        console.log(`Uploadé: ${ethnicity}/${file} -> ${blobResult.url}`);
      }

      results[ethnicity] = uploadedUrls;
    }

    return NextResponse.json({
      success: true,
      message: 'Images de référence uploadées vers Blob',
      urls: results,
    });
  } catch (error) {
    console.error('Erreur upload images de référence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur upload' },
      { status: 500 }
    );
  }
}

// GET: Lister les images de référence existantes dans Blob
export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN non configuré' },
        { status: 500 }
      );
    }

    const results: Record<string, string[]> = {};

    for (const ethnicity of ETHNICITIES) {
      const { blobs } = await list({
        prefix: `references/ethnicite/${ethnicity}/`,
        token,
      });

      results[ethnicity] = blobs.map(b => b.url);
    }

    return NextResponse.json({
      success: true,
      urls: results,
    });
  } catch (error) {
    console.error('Erreur liste images de référence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur liste' },
      { status: 500 }
    );
  }
}
