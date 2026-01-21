import { NextRequest, NextResponse } from 'next/server';
import { updateJob } from '@/lib/providers/lipsync-studio';

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

    // Mettre à jour le job en mémoire
    updateJob(id, {
      id,
      model,
      status,
      output,
      error,
      executionTime,
    });

    console.log('[Webhook Lipsync] Job mis à jour:', id, status);

    if (status === 'completed') {
      console.log('[Webhook Lipsync] ✅ Vidéo prête:', output);
    } else if (status === 'failed') {
      console.log('[Webhook Lipsync] ❌ Erreur:', error);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook Lipsync] Erreur:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// Permettre aussi GET pour vérifier que l'endpoint existe
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint for lipsync.studio',
  });
}
