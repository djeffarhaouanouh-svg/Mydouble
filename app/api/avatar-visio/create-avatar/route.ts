import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { avatarVisioAssets } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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

    // Mettre à jour le prompt de personnalité si fourni
    if (personalityPrompt) {
      await db
        .update(avatarVisioAssets)
        .set({ personalityPrompt, updatedAt: new Date() })
        .where(eq(avatarVisioAssets.id, asset.id));
    }

    // Avatar prêt (on utilise directement la photo)
    return NextResponse.json({
      success: true,
      status: 'ready',
      message: 'Avatar prêt',
      photoUrl: asset.photoUrl,
    });

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

    return NextResponse.json({
      hasAvatar: true,
      status: 'ready',
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
