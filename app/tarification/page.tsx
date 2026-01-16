'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function TarificationPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      checkPremiumStatus(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const checkPremiumStatus = async (uid: string) => {
    try {
      const response = await fetch(`/api/payment/status?userId=${uid}`);
      const data = await response.json();
      setHasPremiumAccess(data.hasPremiumAccess || false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || hasPremiumAccess || paypalRendered.current || loading) return;

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'ASeBra7QwjUUSH1Os_b6B5mxf1Da0vwT1vSL9nusB9G-gF8lfuuU-_eWC9Js_WCqxye3LXsQxdS21Eak'}&currency=EUR`;
    script.async = true;
    script.onload = () => {
      if (window.paypal && paypalButtonRef.current && !paypalRendered.current) {
        paypalRendered.current = true;
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'pill',
            label: 'paypal',
            height: 50,
          },
          createOrder: (_data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: '9.99',
                  currency_code: 'EUR'
                },
                description: 'MyDouble Premium'
              }]
            });
          },
          onApprove: async (_data: any, actions: any) => {
            setProcessingPayment(true);
            try {
              await actions.order.capture();
              // Mettre à jour le statut premium
              await fetch('/api/payment/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, paymentMethod: 'paypal' }),
              });
              setPaymentSuccess(true);
              setHasPremiumAccess(true);
            } catch (error) {
              console.error('Payment error:', error);
            } finally {
              setProcessingPayment(false);
            }
          },
        }).render(paypalButtonRef.current);
      }
    };
    document.body.appendChild(script);
  }, [userId, hasPremiumAccess, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Link
          href="/mon-double-ia"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Success */}
        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/20 border border-green-500/50 rounded-2xl p-8 text-center"
          >
            <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Paiement réussi !</h2>
            <p className="text-green-300 mb-6">Vous êtes maintenant Premium</p>
            <Link
              href="/mon-double-ia"
              className="bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600"
            >
              Continuer
            </Link>
          </motion.div>
        )}

        {/* Already Premium */}
        {hasPremiumAccess && !paymentSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-purple-500/20 border border-purple-500/50 rounded-2xl p-8 text-center"
          >
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Vous êtes Premium !</h2>
            <Link
              href="/mon-double-ia"
              className="inline-block mt-4 bg-purple-500 text-white px-8 py-3 rounded-full hover:bg-purple-600"
            >
              Mon Double IA
            </Link>
          </motion.div>
        )}

        {/* Payment Card */}
        {!paymentSuccess && !hasPremiumAccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/80 to-slate-800/80 border border-purple-500/50 rounded-2xl p-8"
          >
            <div className="text-center mb-8">
              <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">MyDouble Premium</h1>
              <p className="text-gray-400">Débloquez toutes les fonctionnalités</p>
            </div>

            <div className="text-center mb-8">
              <span className="text-5xl font-bold text-white">9,99€</span>
              <span className="text-gray-400">/mois</span>
            </div>

            <ul className="space-y-3 mb-8">
              {['Quiz MBTI complet', 'Quiz Big Five', 'Quiz ANPS', 'Analyses avancées', 'Support prioritaire'].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-yellow-400" />
                  {feature}
                </li>
              ))}
            </ul>

            {userId ? (
              <div className="relative">
                {processingPayment && (
                  <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  </div>
                )}
                <div ref={paypalButtonRef} className="min-h-[50px]"></div>
              </div>
            ) : (
              <Link
                href="/connexion"
                className="block w-full py-4 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600"
              >
                Connectez-vous
              </Link>
            )}

            <p className="text-center text-gray-500 text-sm mt-6">
              Paiement sécurisé par PayPal
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
