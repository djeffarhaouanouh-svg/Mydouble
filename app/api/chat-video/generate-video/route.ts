import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob } from '@/lib/blob';
import { CreditService } from '@/lib/credit-service';
import { CREDIT_CONFIG } from '@/lib/credits';
import { getStaticCharacterById } from '@/lib/static-characters';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, content, characterId, userId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Contenu du message requis pour générer la vidéo' },
        { status: 400 }
      );
    }

    const creditCost = CREDIT_CONFIG.costs.videoGeneration480p;
    let userIdNum: number | null = null;

    if (!userId || String(userId).startsWith('user_') || String(userId).startsWith('temp_')) {
      return NextResponse.json(
        { error: 'Utilisateur non connecté' },
        { status: 401 }
      );
    }
    userIdNum = parseInt(String(userId), 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'UserId invalide' },
        { status: 400 }
      );
    }

    const hasCredits = await CreditService.hasEnoughCredits(userIdNum, creditCost);
    if (!hasCredits) {
      const balance = await CreditService.getBalance(userIdNum);
      return NextResponse.json({
        error: 'Crédits insuffisants',
        errorCode: 'INSUFFICIENT_CREDITS',
        currentBalance: balance,
        required: creditCost,
        message: `Vous n'avez pas assez de crédits. Solde actuel: ${balance}, Requis: ${creditCost}`,
      }, { status: 402 });
    }

    let character = null;
    const charIdNum = characterId != null ? (typeof characterId === 'string' ? parseInt(characterId, 10) : characterId) : null;
    if (charIdNum != null && !isNaN(charIdNum)) {
      character = getStaticCharacterById(charIdNum);
    }

    const elevenlabsVoiceId = character?.elevenlabsVoiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'JSaCrNWxLT7qo7NXhgvF';
    let audioBlobUrl: string | null = null;

    if (process.env.ELEVENLABS_API_KEY && elevenlabsVoiceId) {
      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenlabsVoiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: content.trim(),
            model_id: 'eleven_multilingual_v2',
          }),
        }
      );
      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        audioBlobUrl = await uploadToBlob(
          audioBlob,
          `audio/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`
        );
      }
    }

    if (!audioBlobUrl) {
      return NextResponse.json(
        { error: 'Impossible de générer l\'audio (ElevenLabs)' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let avatarUrl = character?.vmodelImageUrl || character?.photoUrl || `${baseUrl}/avatar-1.png`;
    if (avatarUrl && avatarUrl.startsWith('/')) {
      avatarUrl = `${baseUrl}${avatarUrl}`;
    }
    const isLocalAvatar = avatarUrl && (avatarUrl.includes('localhost') || avatarUrl.includes('127.0.0.1'));
    if (isLocalAvatar && avatarUrl && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const avatarResponse = await fetch(avatarUrl);
        if (avatarResponse.ok) {
          const avatarBuffer = await avatarResponse.arrayBuffer();
          const avatarBlob = new Blob([avatarBuffer], { type: avatarResponse.headers.get('content-type') || 'image/png' });
          avatarUrl = await uploadToBlob(avatarBlob, `avatars/mia-${Date.now()}.png`);
        }
      } catch (_) {}
    }

    const vmodelApiToken = process.env.VMODEL_API_TOKEN;
    if (!vmodelApiToken) {
      return NextResponse.json(
        { error: 'VModel non configuré' },
        { status: 500 }
      );
    }

    const vmodelResponse = await fetch('https://api.vmodel.ai/api/tasks/v1/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vmodelApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'ae74513f15f2bb0e42acf4023d7cd6dbddd61242c5538b71f830a630aacf1c9d',
        input: {
          avatar: avatarUrl,
          speech: audioBlobUrl,
          resolution: '480',
        },
      }),
    });

    if (!vmodelResponse.ok) {
      const errText = await vmodelResponse.text();
      return NextResponse.json(
        { error: `VModel: ${errText}` },
        { status: 502 }
      );
    }

    const vmodelData = await vmodelResponse.json();
    const vmodelTaskId = vmodelData.result?.task_id || null;
    const jobId = vmodelTaskId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (userIdNum && vmodelTaskId) {
      await CreditService.deductCredits(
        userIdNum,
        creditCost,
        undefined,
        `Génération vidéo (480p)`
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      vmodelTaskId,
      messageId: messageId ?? null,
    });
  } catch (error) {
    console.error('Erreur generate-video:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération vidéo' },
      { status: 500 }
    );
  }
}
