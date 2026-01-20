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

interface JobStatus {
  job_id: string;
  status: 'pending' | 'downloading' | 'processing' | 'completed' | 'error';
  video_url: string | null;
  error: string | null;
}

/**
 * Attendre que le job soit terminé (polling)
 */
async function waitForJob(jobId: string, maxAttempts = 60, intervalMs = 2000): Promise<JobStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${WAV2LIP_API_URL}/job/${jobId}`);

    if (!response.ok) {
      throw new Error(`Erreur lors de la vérification du job: ${response.status}`);
    }

    const status: JobStatus = await response.json();
    console.log(`[Wav2Lip] Job ${jobId} status: ${status.status}`);

    if (status.status === 'completed') {
      return status;
    }

    if (status.status === 'error') {
      throw new Error(status.error || 'Erreur inconnue');
    }

    // Attendre avant le prochain polling
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Timeout: le job prend trop de temps');
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

    // 1. Lancer le job (réponse immédiate)
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

    // 2. Récupérer le job_id
    const data = await response.json();
    console.log('[Wav2Lip] Job créé:', data);

    if (!data.job_id) {
      return {
        success: false,
        error: 'Pas de job_id retourné',
      };
    }

    // 3. Attendre que le job soit terminé (polling)
    console.log('[Wav2Lip] Attente du résultat...');
    const jobResult = await waitForJob(data.job_id);

    if (!jobResult.video_url) {
      return {
        success: false,
        error: 'Pas de vidéo générée',
      };
    }

    // 4. Construire l'URL complète de la vidéo
    // Exemple: https://albums-readily-pin-asset.trycloudflare.com/output/xyz_output.mp4
    const fullVideoUrl = `${WAV2LIP_API_URL}${jobResult.video_url}`;
    console.log('[Wav2Lip] Vidéo URL:', fullVideoUrl);

    return {
      success: true,
      videoUrl: fullVideoUrl,
      duration: 5,
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
