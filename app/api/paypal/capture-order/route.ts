import { NextRequest, NextResponse } from 'next/server';
import { getPayPalAccessToken, getPayPalBaseUrl } from '@/lib/paypal';
import { CreditService } from '@/lib/credit-service';
import { PlanType } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId, plan } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Valider le plan
    const validPlans: PlanType[] = ['free', 'premium', 'pro'];
    const selectedPlan: PlanType = validPlans.includes(plan) ? plan : 'premium';

    const accessToken = await getPayPalAccessToken();

    // Capturer le paiement
    const response = await fetch(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal capture error:', errorData);
      return NextResponse.json(
        { error: 'Failed to capture PayPal order', details: errorData },
        { status: 500 }
      );
    }

    const captureData = await response.json();

    // Vérifier que le paiement est complété
    if (captureData.status === 'COMPLETED') {
      // Mettre à jour l'abonnement et ajouter les crédits
      const userIdNum = parseInt(userId, 10);
      if (!isNaN(userIdNum)) {
        try {
          await CreditService.updateSubscription(
            userIdNum,
            selectedPlan,
            captureData.id, // PayPal transaction ID
            captureData.payer?.payer_id
          );
          console.log(`✅ Abonnement ${selectedPlan} activé pour l'utilisateur ${userIdNum}`);
        } catch (creditError) {
          console.error('Erreur mise à jour crédits:', creditError);
          // On ne bloque pas le paiement si la mise à jour des crédits échoue
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Paiement effectué avec succès!',
        hasPremiumAccess: true,
        transactionId: captureData.id,
        plan: selectedPlan,
      });
    }

    return NextResponse.json(
      { error: 'Payment not completed', status: captureData.status },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture payment', details: error.message },
      { status: 500 }
    );
  }
}
