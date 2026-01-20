/**
 * Provider Wav2Lip pour la génération de vidéos lip-sync
 */

const WAV2LIP_API_URL = process.env.WAV2LIP_API_URL!;

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

    // 1. Appeler l'API Wav2Lip
    const response = await fetch(`${WAV2LIP_API_URL}/wav2lip-url`, {
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

    // 2. Récupérer la réponse JSON avec l'URL de la vidéo
    // L'API retourne: { "job_id": "xyz", "video_url": "/output/xyz.mp4" }
    const data = await response.json();
    console.log('[Wav2Lip] Réponse:', data);

    if (!data.video_url) {
      return {
        success: false,
        error: data.error || 'Pas de vidéo générée',
      };
    }

    // 3. Construire l'URL complète de la vidéo
    // Exemple: https://albums-readily-pin-asset.trycloudflare.com/output/xyz.mp4
    const fullVideoUrl = `${WAV2LIP_API_URL}${data.video_url}`;
    console.log('[Wav2Lip] Vidéo URL:', fullVideoUrl);

    return {
      success: true,
      videoUrl: fullVideoUrl,
      duration: data.duration || 5,
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
