import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Endpoint pour uploader video-1.mp4 vers Vercel Blob
 * Appeler une seule fois pour obtenir l'URL publique
 * GET /api/chat-video/upload-source
 */
export async function GET() {
  try {
    // Lire video-1.mp4 depuis le dossier public
    const videoPath = join(process.cwd(), 'public', 'video-1.mp4');

    let videoBuffer: Buffer;
    try {
      videoBuffer = await readFile(videoPath);
    } catch {
      return NextResponse.json(
        { error: 'video-1.mp4 non trouvé dans le dossier public' },
        { status: 404 }
      );
    }

    console.log('[Upload] Uploading video-1.mp4 vers Blob...');
    console.log('[Upload] Taille:', videoBuffer.length, 'bytes');

    // Upload vers Vercel Blob
    const blob = await put('chat-video/video-source.mp4', videoBuffer, {
      access: 'public',
      contentType: 'video/mp4',
    });

    console.log('[Upload] ✅ Upload terminé:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url,
      message: 'Ajoutez cette URL dans .env.local: CHAT_VIDEO_SOURCE_URL=' + blob.url,
    });

  } catch (error) {
    console.error('[Upload] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur upload' },
      { status: 500 }
    );
  }
}
