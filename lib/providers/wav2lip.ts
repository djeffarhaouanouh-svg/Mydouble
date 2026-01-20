/**
 * Provider Wav2Lip pour la génération de vidéos lip-sync
 * API SYNCHRONE - 1 seul call, pas de polling
 */

const WAV2LIP_API_URL = process.env.WAV2LIP_API_URL!;

export interface Wav2LipResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

/**
 * Générer une vidéo lip-sync avec Wav2Lip
 * SYNCHRONE - attend la fin du traitement et retourne directement l'URL
 */
export async function generateWav2LipVideo(
  videoUrl: string,
  audioUrl: string
): Promise<Wav2LipResult> {
  try {
    console.log('[Wav2Lip] Génération en cours...');
    console.log('[Wav2Lip] API URL:', WAV2LIP_API_URL);

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

    console.log('[Wav2Lip] Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Wav2Lip] Erreur:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      return {
        success: false,
        error: errorData.error || `Erreur API: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('[Wav2Lip] Réponse:', data);

    if (!data.video_url) {
      return {
        success: false,
        error: 'Pas de video_url dans la réponse',
      };
    }

    console.log('[Wav2Lip] ✅ Vidéo prête:', data.video_url);

    return {
      success: true,
      videoUrl: data.video_url,
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
