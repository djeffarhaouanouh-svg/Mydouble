import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { referralSales, affiliates, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/affiliates/sales — Liste toutes les ventes affiliées (admin)
export async function GET(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const sales = await db
      .select({
        id: referralSales.id,
        amount: referralSales.amount,
        commissionAmount: referralSales.commissionAmount,
        plan: referralSales.plan,
        status: referralSales.status,
        paypalOrderId: referralSales.paypalOrderId,
        createdAt: referralSales.createdAt,
        affiliateCode: affiliates.code,
        affiliateName: affiliates.name,
        buyerEmail: users.email,
        buyerName: users.name,
      })
      .from(referralSales)
      .innerJoin(affiliates, eq(referralSales.affiliateId, affiliates.id))
      .innerJoin(users, eq(referralSales.userId, users.id))
      .orderBy(desc(referralSales.createdAt))
      .limit(100);

    return NextResponse.json({ success: true, sales });
  } catch (error: any) {
    console.error('Erreur liste ventes affiliées:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
