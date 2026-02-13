import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { affiliates } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/affiliates/check?code=XXX — Vérifier si un code affilié est valide (public)
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ valid: false });
    }

    const affiliate = await db
      .select({ name: affiliates.name, code: affiliates.code })
      .from(affiliates)
      .where(
        and(
          eq(affiliates.code, code.toUpperCase()),
          eq(affiliates.isActive, true)
        )
      )
      .limit(1);

    if (affiliate.length === 0) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      name: affiliate[0].name,
      code: affiliate[0].code,
    });
  } catch (error: any) {
    console.error('Erreur vérification code affilié:', error);
    return NextResponse.json({ valid: false });
  }
}
