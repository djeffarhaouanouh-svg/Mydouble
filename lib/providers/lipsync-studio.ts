/**
 * Provider lipsync.studio pour la génération de vidéos lip-sync
 * Supporte webhook (recommandé) et polling
 */

const LIPSYNC_API_URL = 'https://lipsync.studio/api/v1';
const LIPSYNC_API_KEY = process.env.LIPSYNC_API_KEY!;

export interface LipsyncResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  executionTime?: number;
  jobId?: string;
}

interface LipsyncJobResponse {
  id?: string;
  requestId?: string;
  model?: string;
  status: 'processing' | 'completed' | 'failed';
  output?: string;
  error?: string;
  executionTime?: number;
}

// Stockage en mémoire des jobs en attente (pour webhook)
export const pendingJobs = new Map<string, LipsyncJobResponse>();

/**
 * Générer une vidéo lip-sync avec lipsync.studio (POLLING)
 */
export async function generateLipsyncVideo(
  videoUrl: string,
  audioUrl: string,
  resolution: '480p' | '720p' = '480p'
): Promise<LipsyncResult> {
  try {
    console.log('[Lipsync.studio] ========== DEBUT ==========');
    console.log('[Lipsync.studio] API Key:', LIPSYNC_API_KEY?.substring(0, 15) + '...');
    console.log('[Lipsync.studio] Video URL:', videoUrl);
    console.log('[Lipsync.studio] Audio URL:', audioUrl);
    console.log('[Lipsync.studio] Resolution:', resolution);

    const requestBody = {
      formState: {
        video: videoUrl,
        audio: audioUrl,
        resolution,
      },
    };

    console.log('[Lipsync.studio] Request body:', JSON.stringify(requestBody, null, 2));

    // 1. Lancer le job
    const createResponse = await fetch(`${LIPSYNC_API_URL}/lipsync-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LIPSYNC_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Lipsync.studio] Create response status:', createResponse.status);
    const responseText = await createResponse.text();
    console.log('[Lipsync.studio] Create response body:', responseText);

    if (!createResponse.ok) {
      return {
        success: false,
        error: `Erreur API ${createResponse.status}: ${responseText}`,
      };
    }

    let createData: any;
    try {
      createData = JSON.parse(responseText);
    } catch {
      return {
        success: false,
        error: `Réponse invalide: ${responseText}`,
      };
    }

    // L'ID peut être dans différents champs
    const requestId = createData.id || createData.requestId || createData.jobId;

    if (!requestId) {
      console.error('[Lipsync.studio] Pas de requestId trouvé. Réponse complète:', createData);
      return {
        success: false,
        error: `Pas de requestId dans la réponse: ${JSON.stringify(createData)}`,
      };
    }

    console.log('[Lipsync.studio] Job créé avec ID:', requestId);

    // 2. Attendre un peu avant de commencer le polling
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Polling jusqu'à completion (max 3 minutes)
    const maxAttempts = 36;
    const pollInterval = 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[Lipsync.studio] Polling ${attempt}/${maxAttempts}...`);

      try {
        const statusResponse = await fetch(`${LIPSYNC_API_URL}/jobs/${requestId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${LIPSYNC_API_KEY}`,
          },
        });

        console.log('[Lipsync.studio] Poll status:', statusResponse.status);
        const statusText = await statusResponse.text();
        console.log('[Lipsync.studio] Poll response:', statusText);

        if (!statusResponse.ok) {
          console.error('[Lipsync.studio] Erreur polling:', statusResponse.status);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        const jobData: LipsyncJobResponse = JSON.parse(statusText);

        if (jobData.status === 'completed' && jobData.output) {
          console.log('[Lipsync.studio] ✅ SUCCES! Vidéo:', jobData.output);
          return {
            success: true,
            videoUrl: jobData.output,
            executionTime: jobData.executionTime,
            jobId: requestId,
          };
        }

        if (jobData.status === 'failed') {
          console.error('[Lipsync.studio] ❌ Job échoué:', jobData.error);
          return {
            success: false,
            error: jobData.error || 'Job échoué sans message',
            jobId: requestId,
          };
        }

        // Toujours en processing, attendre
        console.log('[Lipsync.studio] Status:', jobData.status, '- attente...');

      } catch (pollError) {
        console.error('[Lipsync.studio] Erreur pendant polling:', pollError);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      success: false,
      error: 'Timeout après 3 minutes de polling',
      jobId: requestId,
    };

  } catch (error) {
    console.error('[Lipsync.studio] ❌ Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Générer une vidéo lip-sync avec WEBHOOK
 * Retourne immédiatement le jobId, le résultat arrive via webhook
 */
export async function generateLipsyncVideoWithWebhook(
  videoUrl: string,
  audioUrl: string,
  webhookUrl: string,
  resolution: '480p' | '720p' = '480p'
): Promise<{ jobId?: string; error?: string }> {
  try {
    console.log('[Lipsync.studio] Lancement avec webhook:', webhookUrl);

    const requestBody = {
      webhook: webhookUrl,
      formState: {
        video: videoUrl,
        audio: audioUrl,
        resolution,
      },
    };

    const response = await fetch(`${LIPSYNC_API_URL}/lipsync-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LIPSYNC_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('[Lipsync.studio] Webhook response:', response.status, responseText);

    if (!response.ok) {
      return { error: `Erreur ${response.status}: ${responseText}` };
    }

    const data = JSON.parse(responseText);
    const jobId = data.id || data.requestId || data.jobId;

    if (jobId) {
      // Initialiser le job en mémoire
      pendingJobs.set(jobId, { status: 'processing' });
    }

    return { jobId };

  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erreur' };
  }
}

/**
 * Récupérer le résultat d'un job (appelé après réception du webhook)
 */
export function getJobResult(jobId: string): LipsyncJobResponse | undefined {
  return pendingJobs.get(jobId);
}

/**
 * Mettre à jour un job (appelé par le webhook)
 */
export function updateJob(jobId: string, data: LipsyncJobResponse): void {
  pendingJobs.set(jobId, data);
  console.log('[Lipsync.studio] Job mis à jour:', jobId, data.status);
}
