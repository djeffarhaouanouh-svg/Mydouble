// Configuration PayPal
export const PAYPAL_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'ASeBra7QwjUUSH1Os_b6B5mxf1Da0vwT1vSL9nusB9G-gF8lfuuU-_eWC9Js_WCqxye3LXsQxdS21Eak',
  // Mode sandbox pour les tests, changer en 'live' pour la production
  mode: process.env.PAYPAL_MODE || 'sandbox',
};

// Prix Premium (en EUR)
export const PREMIUM_PRICE = {
  amount: '9.99',
  currency: 'EUR',
  description: 'MyDouble Premium - Accès illimité aux fonctionnalités avancées',
};

// URL de base PayPal selon le mode
export const getPayPalBaseUrl = () => {
  return PAYPAL_CONFIG.mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
};

// Générer un token d'accès PayPal
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = PAYPAL_CONFIG.clientId;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error('PAYPAL_CLIENT_SECRET is not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}
