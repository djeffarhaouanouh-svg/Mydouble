import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { affiliates } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// POST /api/affiliates/mark-paid — Marquer une somme comme payée (admin)
export async function POST(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { affiliateId, amount } = await request.json();

    if (!affiliateId) {
      return NextResponse.json(
        { error: 'affiliateId requis' },
        { status: 400 }
      );
    }

    const affiliate = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, parseInt(affiliateId, 10)))
      .limit(1);

    if (affiliate.length === 0) {
      return NextResponse.json(
        { error: 'Affilié introuvable' },
        { status: 404 }
      );
    }

    const commissionDue = affiliate[0].totalEarned - affiliate[0].totalPaid;
    // Si un montant spécifique est fourni, l'utiliser ; sinon payer tout ce qui est dû
    const paymentAmount = amount ? Math.min(parseInt(amount, 10), commissionDue) : commissionDue;

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Aucune commission à payer' },
        { status: 400 }
      );
    }

    await db
      .update(affiliates)
      .set({ totalPaid: affiliate[0].totalPaid + paymentAmount })
      .where(eq(affiliates.id, affiliate[0].id));

    return NextResponse.json({
      success: true,
      paid: paymentAmount,
      newTotalPaid: affiliate[0].totalPaid + paymentAmount,
      remaining: commissionDue - paymentAmount,
    });
  } catch (error: any) {
    console.error('Erreur mark-paid:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
