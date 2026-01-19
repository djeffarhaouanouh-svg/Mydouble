/**
 * Provider Wav2Lip pour la génération de vidéos lip-sync
 * Utilise un pod RunPod avec Wav2Lip installé
 */

import { uploadToBlob } from '@/lib/blob';

// Configuration RunPod - A METTRE DANS .env.local
const WAV2LIP_API_URL = process.env.WAV2LIP_API_URL || 'https://YOUR_POD_ID-5000.proxy.runpod.net';

export interface Wav2LipResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  duration?: number;
}

/**
 * Générer une vidéo lip-sync avec Wav2Lip
 * @param videoUrl URL de la vidéo/image source (avatar)
 * @param audioUrl URL de l'audio (TTS)
 * @returns URL de la vidéo générée
 */
export async function generateWav2LipVideo(
  videoUrl: string,
  audioUrl: string
): Promise<Wav2LipResult> {
  try {
    console.log('[Wav2Lip] Démarrage génération...');
    console.log('[Wav2Lip] Video source:', videoUrl);
    console.log('[Wav2Lip] Audio:', audioUrl);

    // Appeler l'API Wav2Lip sur RunPod
    const response = await fetch(`${WAV2LIP_API_URL}/wav2lip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_url: videoUrl,
        audio_url: audioUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Wav2Lip] Erreur API:', response.status, errorData);
      return {
        success: false,
        error: errorData.error || `Erreur API Wav2Lip: ${response.status}`,
      };
    }

    // L'API retourne directement le fichier vidéo
    const videoBlob = await response.blob();
    console.log('[Wav2Lip] Vidéo reçue, taille:', videoBlob.size);

    if (videoBlob.size < 1000) {
      // Probablement une erreur JSON
      const text = await videoBlob.text();
      console.error('[Wav2Lip] Réponse invalide:', text);
      return {
        success: false,
        error: 'Vidéo invalide générée',
      };
    }

    // Uploader vers Vercel Blob pour servir la vidéo
    const videoFile = new File([videoBlob], `wav2lip-${Date.now()}.mp4`, {
      type: 'video/mp4',
    });
    const uploadedUrl = await uploadToBlob(
      videoFile,
      `avatar-visio/videos/${Date.now()}-lipsync.mp4`
    );

    console.log('[Wav2Lip] Vidéo uploadée:', uploadedUrl);

    // Estimer la durée (approximatif basé sur la taille)
    const estimatedDuration = Math.max(5, Math.round(videoBlob.size / 50000));

    return {
      success: true,
      videoUrl: uploadedUrl,
      duration: estimatedDuration,
    };
  } catch (error) {
    console.error('[Wav2Lip] Erreur:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Vérifier si l'API Wav2Lip est disponible
 */
export async function checkWav2LipHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${WAV2LIP_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Wav2Lip] Health check:', data);
      return data.status === 'ok' && data.checkpoint_exists;
    }
    return false;
  } catch (error) {
    console.error('[Wav2Lip] Health check failed:', error);
    return false;
  }
}
