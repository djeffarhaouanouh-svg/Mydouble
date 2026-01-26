import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatVideoJobs } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Webhook endpoint pour recevoir les résultats de lipsync.studio
 * POST /api/webhooks/lipsync
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Webhook Lipsync] ========== RECU ==========');
    console.log('[Webhook Lipsync] Body:', JSON.stringify(body, null, 2));

    const { id, model, status, output, error, executionTime } = body;

    if (!id) {
      console.error('[Webhook Lipsync] Pas d\'ID dans le webhook');
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Trouver le job par lipsyncJobId
    const jobs = await db
      .select()
      .from(chatVideoJobs)
      .where(eq(chatVideoJobs.lipsyncJobId, id))
      .limit(1);

    if (jobs.length === 0) {
      console.error('[Webhook Lipsync] Job non trouvé pour lipsyncJobId:', id);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobs[0];
    console.log('[Webhook Lipsync] Job trouvé:', job.jobId);

    if (status === 'completed' && output) {
      // Succès - mettre à jour avec videoUrl
      await db
        .update(chatVideoJobs)
        .set({
          status: 'completed',
          videoUrl: output,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(chatVideoJobs.jobId, job.jobId));

      console.log('[Webhook Lipsync] ✅ Job complété:', job.jobId, output);
    } else if (status === 'failed') {
      // Échec
      await db
        .update(chatVideoJobs)
        .set({
          status: 'failed',
          error: error || 'Génération échouée',
          updatedAt: new Date(),
        })
        .where(eq(chatVideoJobs.jobId, job.jobId));

      console.log('[Webhook Lipsync] ❌ Job échoué:', job.jobId, error);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook Lipsync] Erreur:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET pour vérifier que l'endpoint existe
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint for lipsync.studio',
  });
}
