import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Premium désactivé - tout le monde a accès
  return NextResponse.json({
    hasPremiumAccess: true
  });
}
