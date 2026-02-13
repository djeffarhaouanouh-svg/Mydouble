import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { affiliates, referralSales } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

// GET /api/affiliates — Liste tous les affiliés (admin)
export async function GET(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const allAffiliates = await db.select().from(affiliates);

    // Pour chaque affilié, compter les ventes
    const affiliatesWithStats = await Promise.all(
      allAffiliates.map(async (affiliate) => {
        const salesCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(referralSales)
          .where(eq(referralSales.affiliateId, affiliate.id));

        return {
          ...affiliate,
          salesCount: Number(salesCount[0]?.count ?? 0),
          commissionDue: affiliate.totalEarned - affiliate.totalPaid,
        };
      })
    );

    return NextResponse.json({ success: true, affiliates: affiliatesWithStats });
  } catch (error: any) {
    console.error('Erreur liste affiliés:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
