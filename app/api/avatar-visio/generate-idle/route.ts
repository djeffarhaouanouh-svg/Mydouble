import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { avatarVisioAssets } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createVideoAvatarProvider } from '@/lib/providers/heygen';
import { ProviderError } from '@/lib/providers/types';

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

    if (!asset.heygenAvatarId) {
      return NextResponse.json(
        { error: 'Avatar HeyGen non créé. Veuillez d\'abord créer l\'avatar.' },
        { status: 400 }
      );
    }

    // Si l'idle loop existe déjà, le retourner
    if (asset.idleLoopVideoUrl && asset.idleLoopVideoStatus === 'ready') {
      return NextResponse.json({
        success: true,
        status: 'ready',
        videoUrl: asset.idleLoopVideoUrl,
      });
    }

    // Mettre à jour le statut
    await db
      .update(avatarVisioAssets)
      .set({
        idleLoopVideoStatus: 'generating',
        updatedAt: new Date(),
      })
      .where(eq(avatarVisioAssets.id, asset.id));

    try {
      const provider = createVideoAvatarProvider('heygen');

      // Générer la vidéo idle
      const result = await provider.generateIdleVideo(asset.heygenAvatarId, 5);

      // Attendre que la vidéo soit prête
      const finalResult = await provider.waitForVideo(result.videoId);

      if (finalResult.status === 'ready' && finalResult.videoUrl) {
        // Sauvegarder l'URL
        await db
          .update(avatarVisioAssets)
          .set({
            idleLoopVideoUrl: finalResult.videoUrl,
            idleLoopVideoStatus: 'ready',
            updatedAt: new Date(),
          })
          .where(eq(avatarVisioAssets.id, asset.id));

        return NextResponse.json({
          success: true,
          status: 'ready',
          videoUrl: finalResult.videoUrl,
        });
      } else {
        await db
          .update(avatarVisioAssets)
          .set({
            idleLoopVideoStatus: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(avatarVisioAssets.id, asset.id));

        return NextResponse.json(
          { error: 'Échec de la génération de la vidéo idle', status: 'failed' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Erreur génération idle:', error);

      await db
        .update(avatarVisioAssets)
        .set({
          idleLoopVideoStatus: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(avatarVisioAssets.id, asset.id));

      if (error instanceof ProviderError) {
        return NextResponse.json(
          { error: error.message, code: error.code, status: 'failed' },
          { status: 500 }
        );
      }

      throw error;
    }
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
