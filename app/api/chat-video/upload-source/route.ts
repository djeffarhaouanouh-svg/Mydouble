import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Endpoint pour uploader avatar-1.png vers Vercel Blob
 * Appeler une seule fois pour obtenir l'URL publique
 * GET /api/chat-video/upload-source
 */
export async function GET() {
  try {
    // Lire avatar-1.png depuis le dossier public
    const imagePath = join(process.cwd(), 'public', 'avatar-1.png');

    let imageBuffer: Buffer;
    try {
      imageBuffer = await readFile(imagePath);
    } catch {
      return NextResponse.json(
        { error: 'avatar-1.png non trouvé dans le dossier public' },
        { status: 404 }
      );
    }

    console.log('[Upload] Uploading avatar-1.png vers Blob...');
    console.log('[Upload] Taille:', imageBuffer.length, 'bytes');

    // Upload vers Vercel Blob
    const blob = await put('chat-video/avatar-source.png', imageBuffer, {
      access: 'public',
      contentType: 'image/png',
    });

    console.log('[Upload] ✅ Upload terminé:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url,
      message: 'Ajoutez cette URL dans .env.local: CHAT_IMAGE_SOURCE_URL=' + blob.url,
    });

  } catch (error) {
    console.error('[Upload] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur upload' },
      { status: 500 }
    );
  }
}
