import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'JobId requis' },
        { status: 400 }
      );
    }

    const vmodelApiToken = process.env.VMODEL_API_TOKEN || 'tf6d2u5kiMS0QKPrJz3FgzyJfvTyLGVzdHlFfDVxTL7iuegVbO_bTeKCiEURTjB5WjxyhN8ZSI8f6MRDGLcYiQ==';

    // Si c'est un taskId de VModel.ai (ne commence PAS par 'job_'), vérifier le statut via l'API VModel.ai
    // Les IDs locaux commencent par 'job_', les vrais taskIds de VModel.ai ne commencent pas par 'job_'
    if (vmodelApiToken && !jobId.startsWith('job_')) {
      try {
        // Endpoint correct selon la documentation VModel.ai
        const endpoint = `https://api.vmodel.ai/api/tasks/v1/get/${jobId}`;

        console.log('🔍 Vérification statut VModel.ai pour taskId:', jobId);
        const statusResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${vmodelApiToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (statusResponse.ok) {
          const responseData = await statusResponse.json();
          console.log('📦 VModel.ai status réponse complète:', JSON.stringify(responseData, null, 2));
          
          // D'après la documentation, la réponse est : { code: 200, result: { task_id, status, output, ... }, message: {} }
          const statusData = responseData.result;
          
          if (!statusData) {
            console.error('❌ Pas de "result" dans la réponse VModel.ai');
            return NextResponse.json({
              jobId,
              status: 'processing',
              videoUrl: null,
              error: null,
            });
          }
          
          // Le statut est dans result.status (starting, processing, succeeded, failed, canceled)
          const taskStatus = statusData.status;

          // Extraire l'URL vidéo : output peut être une string, un tableau d'URLs, ou un objet { url, video_url, ... }
          let videoUrl: string | null = null;
          const output = statusData.output;
          if (typeof output === 'string' && output.startsWith('http')) {
            videoUrl = output;
          } else if (Array.isArray(output) && output.length > 0) {
            const first = output[0];
            videoUrl = typeof first === 'string' ? first : (first?.url || first?.video_url) || null;
          } else if (output && typeof output === 'object') {
            videoUrl = (output as { url?: string; video_url?: string }).url
              || (output as { url?: string; video_url?: string }).video_url
              || null;
          }

          console.log('📊 Task status:', taskStatus, 'Video URL:', videoUrl);

          // D'après la doc: succeeded = terminé, failed = échec, starting/processing = en cours
          if (taskStatus === 'succeeded') {
            // Calculer le temps total si disponible dans les logs
            const totalTime = statusData.total_time || statusData.predict_time || null;
            console.log('✅ Vidéo générée avec succès!', totalTime ? `(Temps VModel.ai: ${totalTime}s)` : '');
            return NextResponse.json({
              jobId,
              status: 'completed',
              videoUrl: videoUrl || null,
              error: null,
              vmodelTime: totalTime, // Temps de génération côté VModel.ai
            });
          } else if (taskStatus === 'failed' || taskStatus === 'canceled') {
            console.error('❌ Tâche échouée:', statusData.error);
            return NextResponse.json({
              jobId,
              status: 'failed',
              videoUrl: null,
              error: statusData.error || 'Erreur lors de la génération de la vidéo',
            });
          } else {
            // En cours (starting, processing)
            console.log('⏳ Task en cours:', taskStatus);
            return NextResponse.json({
              jobId,
              status: 'processing',
              videoUrl: null,
              error: null,
            });
          }
        } else {
          // Si l'API retourne une erreur (404, etc.), la tâche n'existe peut-être pas encore
          const errorText = await statusResponse.text();
          console.error('Erreur vérification statut VModel.ai:', statusResponse.status, errorText);
          // Retourner "processing" pour réessayer plus tard
          return NextResponse.json({
            jobId,
            status: 'processing',
            videoUrl: null,
            error: null, // Explicitement null
          });
        }
      } catch (vmodelError) {
        console.error('Erreur appel VModel.ai status:', vmodelError);
        // En cas d'erreur, on retourne un statut "processing" pour réessayer plus tard
        return NextResponse.json({
          jobId,
          status: 'processing',
          videoUrl: null,
          error: null, // Explicitement null
        });
      }
    }

    // Par défaut, retourner un statut "processing" si ce n'est pas un taskId VModel.ai
    // Si c'est un jobId local (commence par 'job_'), cela signifie que VModel.ai n'a pas retourné de taskId
    if (jobId.startsWith('job_')) {
      console.warn('⚠️ JobId local détecté - VModel.ai n\'a probablement pas retourné de taskId');
      return NextResponse.json({
        jobId,
        status: 'processing',
        videoUrl: null,
        error: null, // Explicitement null au lieu de undefined
        warning: 'VModel.ai n\'a pas retourné de taskId - vérifiez les logs serveur',
      });
    }
    
    return NextResponse.json({
      jobId,
      status: 'processing',
      videoUrl: null,
      error: null, // Explicitement null au lieu de undefined
    });

  } catch (error) {
    console.error('Erreur status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}
