import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId, paymentMethod } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Ici, vous pouvez intégrer un vrai système de paiement (Stripe, PayPal, etc.)
    // Pour l'instant, on simule un paiement réussi
    // En production, vous devriez:
    // 1. Créer une session de paiement avec Stripe
    // 2. Vérifier le webhook de confirmation
    // 3. Mettre à jour hasPremiumAccess seulement après confirmation

    // Simuler le traitement du paiement
    // TODO: Remplacer par une vraie intégration de paiement
    if (paymentMethod === 'stripe' || paymentMethod === 'paypal' || paymentMethod === 'test') {
      // Mettre à jour l'utilisateur avec l'accès premium
      await db
        .update(users)
        .set({ 
          hasPremiumAccess: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, parseInt(userId)));

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        hasPremiumAccess: true
      });
    }

    return NextResponse.json(
      { error: 'Invalid payment method' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment', details: error.message },
      { status: 500 }
    );
  }
}
