import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Récupérer le statut premium de l'utilisateur
    const user = await db
      .select({
        hasPremiumAccess: users.hasPremiumAccess
      })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      hasPremiumAccess: user[0].hasPremiumAccess || false
    });
  } catch (error: any) {
    console.error('Error checking premium status:', error);
    return NextResponse.json(
      { error: 'Failed to check premium status', details: error.message },
      { status: 500 }
    );
  }
}
