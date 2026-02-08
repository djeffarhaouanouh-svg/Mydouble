import { NextResponse } from 'next/server';

// POST /api/credits/daily-checkin - Désactivé
export async function POST() {
  return NextResponse.json(
    { error: 'Le bonus quotidien a été désactivé' },
    { status: 410 }
  );
}
