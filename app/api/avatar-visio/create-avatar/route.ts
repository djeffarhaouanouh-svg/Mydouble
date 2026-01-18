import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { avatarVisioAssets } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createVideoAvatarProvider } from '@/lib/providers/heygen';
import { ProviderError } from '@/lib/providers/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, assetId, personalityPrompt } = await request.json();

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

    // Si l'avatar est déjà créé et prêt, retourner son status
    if (asset.heygenAvatarId && asset.heygenAvatarStatus === 'ready') {
      return NextResponse.json({
        success: true,
        heygenAvatarId: asset.heygenAvatarId,
        status: 'ready',
        message: 'Avatar déjà prêt',
      });
    }

    // Mettre à jour le prompt de personnalité si fourni
    if (personalityPrompt) {
      await db
        .update(avatarVisioAssets)
        .set({ personalityPrompt, updatedAt: new Date() })
        .where(eq(avatarVisioAssets.id, asset.id));
    }

    // Créer le provider et l'avatar
    const provider = createVideoAvatarProvider('heygen');

    try {
      const result = await provider.createAvatar(asset.photoUrl);

      // Sauvegarder l'ID de l'avatar
      await db
        .update(avatarVisioAssets)
        .set({
          heygenAvatarId: result.avatarId,
          heygenAvatarStatus: result.status,
          updatedAt: new Date(),
        })
        .where(eq(avatarVisioAssets.id, asset.id));

      return NextResponse.json({
        success: true,
        heygenAvatarId: result.avatarId,
        status: result.status,
        estimatedTime: result.estimatedTimeSeconds,
      });
    } catch (error) {
      if (error instanceof ProviderError) {
        // Marquer l'avatar comme failed
        await db
          .update(avatarVisioAssets)
          .set({
            heygenAvatarStatus: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(avatarVisioAssets.id, asset.id));

        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: 500 }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Erreur création avatar:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'avatar' },
      { status: 500 }
    );
  }
}

// GET pour vérifier le statut d'un avatar
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
        hasAvatar: false,
        status: 'none',
      });
    }

    const asset = assets[0];

    // Si l'avatar est en cours de création, vérifier son statut
    if (asset.heygenAvatarId && asset.heygenAvatarStatus === 'pending') {
      try {
        const provider = createVideoAvatarProvider('heygen');
        const statusResult = await provider.getAvatarStatus(asset.heygenAvatarId);

        // Mettre à jour le statut
        if (statusResult.status !== asset.heygenAvatarStatus) {
          await db
            .update(avatarVisioAssets)
            .set({
              heygenAvatarStatus: statusResult.status,
              updatedAt: new Date(),
            })
            .where(eq(avatarVisioAssets.id, asset.id));
        }

        return NextResponse.json({
          hasAvatar: true,
          heygenAvatarId: asset.heygenAvatarId,
          status: statusResult.status,
          photoUrl: asset.photoUrl,
          idleLoopVideoUrl: asset.idleLoopVideoUrl,
          voiceId: asset.voiceId,
        });
      } catch {
        // En cas d'erreur, retourner le statut stocké
      }
    }

    return NextResponse.json({
      hasAvatar: true,
      heygenAvatarId: asset.heygenAvatarId,
      status: asset.heygenAvatarStatus || 'none',
      photoUrl: asset.photoUrl,
      idleLoopVideoUrl: asset.idleLoopVideoUrl,
      voiceId: asset.voiceId,
    });

  } catch (error) {
    console.error('Erreur vérification avatar:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de l\'avatar' },
      { status: 500 }
    );
  }
}
