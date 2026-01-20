/**
 * Provider Wav2Lip pour la génération de vidéos lip-sync
 */

const WAV2LIP_API_URL = process.env.WAV2LIP_API_URL!;

export interface Wav2LipResult {
  success: boolean;
  jobId?: string;
  apiUrl?: string;
  error?: string;
}

/**
 * Lancer un job Wav2Lip (retourne immédiatement avec job_id)
 * Le frontend fera le polling
 */
export async function generateWav2LipVideo(
  videoUrl: string,
  audioUrl: string
): Promise<Wav2LipResult> {
  try {
    console.log('[Wav2Lip] Démarrage job...');
    console.log('[Wav2Lip] Video source:', videoUrl);
    console.log('[Wav2Lip] Audio:', audioUrl);

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

    const data = await response.json();
    console.log('[Wav2Lip] Job créé:', data);

    if (!data.job_id) {
      return {
        success: false,
        error: 'Pas de job_id retourné',
      };
    }

    // Retourner job_id + API URL pour que le frontend puisse poller
    return {
      success: true,
      jobId: data.job_id,
      apiUrl: WAV2LIP_API_URL,
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
