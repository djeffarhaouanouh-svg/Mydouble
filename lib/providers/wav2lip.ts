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
    console.log('[Wav2Lip] API URL:', WAV2LIP_API_URL);
    console.log('[Wav2Lip] Video source:', videoUrl);
    console.log('[Wav2Lip] Audio:', audioUrl);

    const apiEndpoint = `${WAV2LIP_API_URL}/wav2lip-url`;
    console.log('[Wav2Lip] Endpoint complet:', apiEndpoint);

    const response = await fetch(apiEndpoint, {
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
 * Poller un job Wav2Lip jusqu'à ce qu'il soit terminé
 * @param jobId - ID du job à poller
 * @param apiUrl - URL de l'API Wav2Lip
 * @param maxWaitTime - Temps maximum d'attente en ms (défaut: 2 minutes)
 * @param pollInterval - Intervalle entre les polls en ms (défaut: 2 secondes)
 */
export async function pollWav2LipJob(
  jobId: string,
  apiUrl: string = WAV2LIP_API_URL,
  maxWaitTime: number = 120000,
  pollInterval: number = 2000
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  const startTime = Date.now();
  const maxEndTime = startTime + maxWaitTime;

  console.log(`[Wav2Lip] Démarrage polling pour job: ${jobId}`);

  while (Date.now() < maxEndTime) {
    try {
      const response = await fetch(`${apiUrl}/job/${jobId}`);
      
      if (!response.ok) {
        return {
          success: false,
          error: `Erreur HTTP ${response.status} lors du polling`,
        };
      }

      const job = await response.json();
      console.log(`[Wav2Lip] Status job ${jobId}:`, job.status);

      if (job.status === 'completed') {
        // Construire l'URL complète de la vidéo
        let videoUrl = job.video_url;
        if (videoUrl && !videoUrl.startsWith('http')) {
          // Si c'est un chemin relatif, ajouter l'URL de base
          const baseUrl = apiUrl.replace(/\/$/, ''); // Enlever le trailing slash
          const videoPath = videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`;
          videoUrl = `${baseUrl}${videoPath}`;
        }
        
        console.log(`[Wav2Lip] Vidéo prête: ${videoUrl}`);
        return {
          success: true,
          videoUrl,
        };
      } else if (job.status === 'error') {
        return {
          success: false,
          error: job.error || 'Erreur inconnue lors de la génération Wav2Lip',
        };
      }

      // Job encore en cours, attendre avant le prochain poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error(`[Wav2Lip] Erreur lors du polling:`, error);
      // En cas d'erreur réseau, continuer à poller
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  // Timeout
  return {
    success: false,
    error: `Timeout: le job ${jobId} n'a pas été complété dans les ${maxWaitTime}ms`,
  };
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
