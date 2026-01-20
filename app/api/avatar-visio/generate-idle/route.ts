import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { avatarVisioAssets } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    // Récupérer l'asset
    const assets = await db
      .select()
      .from(avatarVisioAssets)
      .where(eq(avatarVisioAssets.userId, userIdNum))
      .limit(1);

    if (assets.length === 0) {
      return NextResponse.json(
        { error: 'Aucun asset trouvé. Veuillez d\'abord uploader une photo.' },
        { status: 404 }
      );
    }

    const asset = assets[0];

    // Si l'idle loop existe déjà, le retourner
    if (asset.idleLoopVideoUrl && asset.idleLoopVideoStatus === 'ready') {
      return NextResponse.json({
        success: true,
        status: 'ready',
        videoUrl: asset.idleLoopVideoUrl,
      });
    }

    // Pour l'instant, retourner un statut "none" car la génération idle n'est pas implémentée
    return NextResponse.json({
      success: false,
      status: 'none',
      message: 'Génération de vidéo idle non disponible',
    });
  } catch (error) {
    console.error('Erreur génération idle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la vidéo idle' },
      { status: 500 }
    );
  }
}

// GET pour vérifier le statut de la vidéo idle
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    const assets = await db
      .select()
      .from(avatarVisioAssets)
      .where(eq(avatarVisioAssets.userId, userIdNum))
      .limit(1);

    if (assets.length === 0) {
      return NextResponse.json({
        hasIdleVideo: false,
        status: 'none',
      });
    }

    const asset = assets[0];

    return NextResponse.json({
      hasIdleVideo: !!asset.idleLoopVideoUrl,
      status: asset.idleLoopVideoStatus || 'none',
      videoUrl: asset.idleLoopVideoUrl,
    });

  } catch (error) {
    console.error('Erreur vérification idle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
