import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { affiliates } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// POST /api/affiliates/create — Créer un affilié (admin)
export async function POST(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { code, name, email, userId, commissionRate } = await request.json();

    if (!code || !name || !email) {
      return NextResponse.json(
        { error: 'Code, nom et email sont requis' },
        { status: 400 }
      );
    }

    // Vérifier unicité du code
    const existing = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.code, code.toUpperCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Ce code affilié existe déjà' },
        { status: 400 }
      );
    }

    const newAffiliate = await db.insert(affiliates).values({
      code: code.toUpperCase(),
      name,
      email,
      userId: userId ? parseInt(userId, 10) : null,
      commissionRate: commissionRate ? parseInt(commissionRate, 10) : 50,
    }).returning();

    return NextResponse.json({ success: true, affiliate: newAffiliate[0] });
  } catch (error: any) {
    console.error('Erreur création affilié:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
