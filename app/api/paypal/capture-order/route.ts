import { NextRequest, NextResponse } from 'next/server';
import { getPayPalAccessToken, getPayPalBaseUrl } from '@/lib/paypal';

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json();

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
      // Premium désactivé - pas besoin de mettre à jour la base
      return NextResponse.json({
        success: true,
        message: 'Paiement effectué avec succès!',
        hasPremiumAccess: true,
        transactionId: captureData.id,
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
