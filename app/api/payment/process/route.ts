import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Premium désactivé - tout le monde a accès
  return NextResponse.json({
    success: true,
    message: 'Payment processed successfully',
    hasPremiumAccess: true
  });
}
