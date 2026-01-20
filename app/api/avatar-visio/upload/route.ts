import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { avatarVisioAssets, aiDoubles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadToBlob } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const userId = formData.get('userId') as string;
    const voiceSample = formData.get('voiceSample') as File | null;
    const useExistingVoice = formData.get('useExistingVoice') === 'true';
    const personalityPrompt = formData.get('personalityPrompt') as string | null;

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo requise' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien une image
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image (JPG, PNG, etc.)' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    // Upload la photo vers Vercel Blob
    const photoUrl = await uploadToBlob(
      photo,
      `avatar-visio/${userId}/${Date.now()}-photo-${photo.name}`
    );

    let voiceId: string | null = null;
    let voiceSource: string = 'elevenlabs_preset';
    let voiceSampleUrl: string | null = null;

    // Si on utilise la voix existante de l'aiDouble
    if (useExistingVoice) {
      const aiDouble = await db
        .select({ voiceId: aiDoubles.voiceId })
        .from(aiDoubles)
        .where(eq(aiDoubles.userId, userIdNum))
        .limit(1);

      if (aiDouble.length > 0 && aiDouble[0].voiceId) {
        voiceId = aiDouble[0].voiceId;
        voiceSource = 'elevenlabs_clone';
      }
    }

    // Si un échantillon de voix est fourni
    if (voiceSample && !useExistingVoice) {
      if (!voiceSample.type.startsWith('audio/')) {
        return NextResponse.json(
          { error: 'L\'échantillon de voix doit être un fichier audio' },
          { status: 400 }
        );
      }

      voiceSampleUrl = await uploadToBlob(
        voiceSample,
        `avatar-visio/${userId}/${Date.now()}-voice-${voiceSample.name}`
      );
      voiceSource = 'elevenlabs_clone';
    }

    // Vérifier si un asset existe déjà pour cet utilisateur
    const existingAsset = await db
      .select()
      .from(avatarVisioAssets)
      .where(eq(avatarVisioAssets.userId, userIdNum))
      .limit(1);

    let assetId: number;

    if (existingAsset.length > 0) {
      // Mettre à jour l'asset existant
      const updated = await db
        .update(avatarVisioAssets)
        .set({
          photoUrl,
          photoOriginalName: photo.name,
          voiceSource,
          voiceId,
          voiceSampleUrl,
          personalityPrompt,
          idleLoopVideoUrl: null,
          idleLoopVideoStatus: null,
          updatedAt: new Date(),
        })
        .where(eq(avatarVisioAssets.userId, userIdNum))
        .returning();

      assetId = updated[0].id;
    } else {
      // Créer un nouvel asset
      const newAsset = await db
        .insert(avatarVisioAssets)
        .values({
          userId: userIdNum,
          photoUrl,
          photoOriginalName: photo.name,
          voiceSource,
          voiceId,
          voiceSampleUrl,
          personalityPrompt,
        })
        .returning();

      assetId = newAsset[0].id;
    }

    return NextResponse.json({
      success: true,
      assetId,
      photoUrl,
      voiceSampleUrl,
      voiceId,
      voiceSource,
    });

  } catch (error) {
    console.error('Erreur upload avatar-visio:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload des fichiers' },
      { status: 500 }
    );
  }
}
