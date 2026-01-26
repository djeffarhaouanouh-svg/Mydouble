import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatVideoJobs } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/chat-video/status?jobId=xxx
 * Retourne le status d'un job
 */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId requis' }, { status: 400 });
    }

    const jobs = await db
      .select()
      .from(chatVideoJobs)
      .where(eq(chatVideoJobs.jobId, jobId))
      .limit(1);

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Job non trouvé' }, { status: 404 });
    }

    const job = jobs[0];

    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      aiResponse: job.aiResponse,
      audioUrl: job.audioUrl,
      videoUrl: job.videoUrl,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });

  } catch (error) {
    console.error('[ChatVideo Status] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
