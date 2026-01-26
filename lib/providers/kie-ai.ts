/**
 * Provider kie.ai InfiniteTalk pour la génération de vidéos lip-sync
 * https://docs.kie.ai
 */

const KIE_API_URL = 'https://api.kie.ai/api/v1';
const KIE_API_KEY = process.env.KIE_API_KEY!;

export interface KieResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  taskId?: string;
}

interface KieTaskResponse {
  code: number;
  msg: string;
  data?: {
    taskId: string;
  };
}

interface KieRecordResponse {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    state: 'pending' | 'running' | 'success' | 'fail';
    resultJson?: string; // JSON string: {"resultUrls":["..."]}
    failCode?: string;
    failMsg?: string;
    completeTime?: number;
    costTime?: number;
  };
}

// Stockage en mémoire des jobs pour webhook
export const pendingKieJobs = new Map<string, KieRecordResponse['data']>();

/**
 * Générer une vidéo lip-sync avec kie.ai InfiniteTalk (POLLING)
 */
export async function generateKieVideo(
  imageUrl: string,
  audioUrl: string,
  prompt: string = 'A person speaking naturally',
  resolution: '480p' | '720p' = '480p'
): Promise<KieResult> {
  try {
    console.log('[Kie.ai] ========== DEBUT ==========');
    console.log('[Kie.ai] API Key:', KIE_API_KEY?.substring(0, 10) + '...');
    console.log('[Kie.ai] Image URL:', imageUrl);
    console.log('[Kie.ai] Audio URL:', audioUrl);

    const requestBody = {
      model: 'infinitalk/from-audio',
      input: {
        image_url: imageUrl,
        audio_url: audioUrl,
        prompt,
        resolution,
      },
    };

    console.log('[Kie.ai] Request body:', JSON.stringify(requestBody, null, 2));

    // 1. Créer la tâche
    const createResponse = await fetch(`${KIE_API_URL}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Kie.ai] Create response status:', createResponse.status);
    const responseText = await createResponse.text();
    console.log('[Kie.ai] Create response body:', responseText);

    if (!createResponse.ok) {
      return {
        success: false,
        error: `Erreur API ${createResponse.status}: ${responseText}`,
      };
    }

    let createData: KieTaskResponse;
    try {
      createData = JSON.parse(responseText);
    } catch {
      return {
        success: false,
        error: `Réponse invalide: ${responseText}`,
      };
    }

    if (createData.code !== 200 || !createData.data?.taskId) {
      return {
        success: false,
        error: createData.msg || 'Erreur création tâche',
      };
    }

    const taskId = createData.data.taskId;
    console.log('[Kie.ai] Task créée:', taskId);

    // 2. Polling jusqu'à completion (max 5 minutes)
    const maxAttempts = 60; // 60 * 5s = 5 minutes
    const pollInterval = 5000;

    await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre 3s avant premier poll

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[Kie.ai] Polling ${attempt}/${maxAttempts}...`);

      try {
        const statusResponse = await fetch(`${KIE_API_URL}/jobs/recordInfo?taskId=${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${KIE_API_KEY}`,
          },
        });

        console.log('[Kie.ai] Poll status:', statusResponse.status);
        const statusText = await statusResponse.text();
        console.log('[Kie.ai] Poll response:', statusText);

        if (!statusResponse.ok) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        const recordData: KieRecordResponse = JSON.parse(statusText);

        if (recordData.code !== 200 || !recordData.data) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        const { state, resultJson, failMsg } = recordData.data;

        if (state === 'success' && resultJson) {
          // Parse resultJson pour extraire l'URL
          try {
            const result = JSON.parse(resultJson);
            const videoUrl = result.resultUrls?.[0];

            if (videoUrl) {
              console.log('[Kie.ai] ✅ SUCCES! Vidéo:', videoUrl);
              return {
                success: true,
                videoUrl,
                taskId,
              };
            }
          } catch (parseError) {
            console.error('[Kie.ai] Erreur parsing resultJson:', parseError);
          }
        }

        if (state === 'fail') {
          console.error('[Kie.ai] ❌ Échec:', failMsg);
          return {
            success: false,
            error: failMsg || 'Génération échouée',
            taskId,
          };
        }

        console.log('[Kie.ai] State:', state, '- attente...');

      } catch (pollError) {
        console.error('[Kie.ai] Erreur polling:', pollError);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      success: false,
      error: 'Timeout après 5 minutes',
      taskId,
    };

  } catch (error) {
    console.error('[Kie.ai] ❌ Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Générer avec WEBHOOK (pour production)
 */
export async function generateKieVideoWithWebhook(
  imageUrl: string,
  audioUrl: string,
  callbackUrl: string,
  prompt: string = 'A person speaking naturally',
  resolution: '480p' | '720p' = '480p'
): Promise<{ taskId?: string; error?: string }> {
  try {
    console.log('[Kie.ai] Lancement avec webhook:', callbackUrl);

    const requestBody = {
      model: 'infinitalk/from-audio',
      callBackUrl: callbackUrl,
      input: {
        image_url: imageUrl,
        audio_url: audioUrl,
        prompt,
        resolution,
      },
    };

    const response = await fetch(`${KIE_API_URL}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('[Kie.ai] Webhook response:', response.status, responseText);

    const data: KieTaskResponse = JSON.parse(responseText);

    if (data.code !== 200 || !data.data?.taskId) {
      return { error: data.msg || 'Erreur création tâche' };
    }

    const taskId = data.data.taskId;
    pendingKieJobs.set(taskId, { taskId, state: 'running' });

    return { taskId };

  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erreur' };
  }
}

/**
 * Mettre à jour un job (appelé par le webhook)
 */
export function updateKieJob(taskId: string, data: KieRecordResponse['data']): void {
  pendingKieJobs.set(taskId, data);
  console.log('[Kie.ai] Job mis à jour:', taskId, data?.state);
}

/**
 * Récupérer le résultat d'un job
 */
export function getKieJobResult(taskId: string): KieRecordResponse['data'] | undefined {
  return pendingKieJobs.get(taskId);
}
