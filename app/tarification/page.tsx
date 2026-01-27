'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, ArrowLeft, Loader2, Coins, Zap } from 'lucide-react';
import Link from 'next/link';
import { CREDIT_CONFIG, PlanType } from '@/lib/credits';

declare global {
  interface Window {
    paypal?: any;
  }
}

const planIcons = {
  free: Coins,
  premium: Crown,
  pro: Zap,
};

const planColors = {
  free: 'from-gray-600 to-gray-700',
  premium: 'from-purple-600 to-pink-600',
  pro: 'from-amber-500 to-orange-600',
};

export default function TarificationPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && !storedUserId.startsWith('user_') && !storedUserId.startsWith('temp_')) {
      setUserId(storedUserId);
      loadUserPlan(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserPlan = async (uid: string) => {
    try {
      const response = await fetch(`/api/credits?userId=${uid}`);
      const data = await response.json();
      if (data.success && data.plan) {
        setCurrentPlan(data.plan as PlanType);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPayPalButton = (plan: PlanType) => {
    if (!userId || paypalRendered.current) return;

    const price = CREDIT_CONFIG.plans[plan].priceMonthly;
    if (price === 0) return;

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
                  value: price.toFixed(2),
                  currency_code: 'EUR'
                },
                description: `MyDouble ${CREDIT_CONFIG.plans[plan].name} - ${CREDIT_CONFIG.plans[plan].monthlyCredits} crédits/mois`
              }]
            });
          },
          onApprove: async (_data: any, actions: any) => {
            setProcessingPayment(true);
            try {
              const captureData = await actions.order.capture();

              // Mettre à jour l'abonnement avec les crédits
              await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  orderId: captureData.id,
                  plan: plan,
                }),
              });

              setPaymentSuccess(true);
              setCurrentPlan(plan);
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
  };

  useEffect(() => {
    if (selectedPlan && selectedPlan !== 'free' && userId && !paypalRendered.current) {
      renderPayPalButton(selectedPlan);
    }
  }, [selectedPlan, userId]);

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === currentPlan) return;
    if (plan === 'free') return; // On ne peut pas downgrade vers free

    paypalRendered.current = false;
    setSelectedPlan(plan);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3BB9FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#3BB9FF] hover:text-[#2FA9F2] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choisissez votre <span className="text-[#3BB9FF]">Plan</span>
          </h1>
          <p className="text-[#A3A3A3] text-lg">
            Des crédits pour générer vos vidéos IA
          </p>
        </div>

        {/* Success Message */}
        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/20 border border-green-500/50 rounded-2xl p-8 text-center mb-8"
          >
            <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Paiement réussi !</h2>
            <p className="text-green-300 mb-4">Vos crédits ont été ajoutés à votre compte</p>
            <Link
              href="/chat-video"
              className="inline-block bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600"
            >
              Commencer à créer
            </Link>
          </motion.div>
        )}

        {/* Plans Grid */}
        {!paymentSuccess && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {(Object.keys(CREDIT_CONFIG.plans) as PlanType[]).map((planKey, index) => {
              const plan = CREDIT_CONFIG.plans[planKey];
              const Icon = planIcons[planKey];
              const isCurrentPlan = currentPlan === planKey;
              const isSelected = selectedPlan === planKey;

              return (
                <motion.div
                  key={planKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-[#1A1A1A] border rounded-2xl p-6 ${
                    isCurrentPlan
                      ? 'border-[#3BB9FF] ring-2 ring-[#3BB9FF]/20'
                      : isSelected
                      ? 'border-purple-500 ring-2 ring-purple-500/20'
                      : 'border-[#2A2A2A]'
                  }`}
                >
                  {/* Badge plan actuel */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3BB9FF] text-white text-xs font-bold px-3 py-1 rounded-full">
                      Plan actuel
                    </div>
                  )}

                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${planColors[planKey]} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-white">
                        {plan.priceMonthly === 0 ? 'Gratuit' : `${plan.priceMonthly}€`}
                      </span>
                      {plan.priceMonthly > 0 && (
                        <span className="text-[#A3A3A3]">/mois</span>
                      )}
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="bg-[#252525] rounded-xl p-4 mb-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Coins className="w-5 h-5 text-[#3BB9FF]" />
                      <span className="text-3xl font-bold text-[#3BB9FF]">{plan.monthlyCredits}</span>
                    </div>
                    <p className="text-[#A3A3A3] text-sm">crédits par mois</p>
                    {planKey === 'free' && plan.signupBonus > 0 && (
                      <p className="text-green-400 text-xs mt-2">
                        + {plan.signupBonus} crédits offerts à l'inscription
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-[#A3A3A3]">
                        <Check className="w-5 h-5 text-[#3BB9FF] flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {!userId ? (
                    <Link
                      href="/connexion"
                      className="block w-full py-3 text-center bg-[#252525] text-white rounded-xl font-semibold hover:bg-[#2A2A2A] transition-colors"
                    >
                      Connexion requise
                    </Link>
                  ) : isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 text-center bg-[#252525] text-[#A3A3A3] rounded-xl font-semibold cursor-not-allowed"
                    >
                      Plan actuel
                    </button>
                  ) : planKey === 'free' ? (
                    <button
                      disabled
                      className="w-full py-3 text-center bg-[#252525] text-[#A3A3A3] rounded-xl font-semibold cursor-not-allowed"
                    >
                      Plan de base
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(planKey)}
                      className={`w-full py-3 text-center rounded-xl font-semibold transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gradient-to-r from-[#3BB9FF] to-[#2FA9F2] text-white hover:opacity-90'
                      }`}
                    >
                      {isSelected ? 'Sélectionné' : 'Choisir ce plan'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* PayPal Section */}
        {selectedPlan && selectedPlan !== 'free' && userId && !paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white text-center mb-4">
              Finaliser votre achat
            </h3>
            <p className="text-[#A3A3A3] text-center mb-6">
              Plan {CREDIT_CONFIG.plans[selectedPlan].name} - {CREDIT_CONFIG.plans[selectedPlan].monthlyCredits} crédits/mois
            </p>

            <div className="relative">
              {processingPayment && (
                <div className="absolute inset-0 bg-[#1A1A1A]/80 rounded-xl flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-[#3BB9FF] animate-spin" />
                </div>
              )}
              <div ref={paypalButtonRef} className="min-h-[50px]"></div>
            </div>

            <p className="text-center text-[#A3A3A3] text-sm mt-4">
              Paiement sécurisé par PayPal
            </p>

            <button
              onClick={() => {
                setSelectedPlan(null);
                paypalRendered.current = false;
              }}
              className="w-full mt-4 py-2 text-[#A3A3A3] hover:text-white transition-colors text-sm"
            >
              Annuler
            </button>
          </motion.div>
        )}

        {/* Info */}
        <div className="text-center text-[#A3A3A3] text-sm mt-8">
          <p>1 crédit = 1 vidéo générée</p>
          <p className="mt-1">Les crédits sont renouvelés chaque mois</p>
        </div>
      </div>
    </div>
  );
}
