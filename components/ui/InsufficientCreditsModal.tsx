'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Coins, X, Crown, Zap, Check, Loader2 } from 'lucide-react';
import { CREDIT_CONFIG, PlanType } from '@/lib/credits';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  required: number;
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

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  currentBalance,
  required,
}: InsufficientCreditsModalProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  // Charger l'utilisateur et son plan actuel
  useEffect(() => {
    if (isOpen) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId && !storedUserId.startsWith('user_') && !storedUserId.startsWith('temp_')) {
        setUserId(storedUserId);
        loadUserPlan(storedUserId);
      }
    }
  }, [isOpen]);

  // Reset state quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlan(null);
      setPaymentSuccess(false);
      paypalRendered.current = false;
    }
  }, [isOpen]);

  const loadUserPlan = async (uid: string) => {
    try {
      const response = await fetch(`/api/credits?userId=${uid}`);
      const data = await response.json();
      if (data.success && data.plan) {
        setCurrentPlan(data.plan as PlanType);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
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
            height: 45,
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

              // Fermer le modal après 2 secondes
              setTimeout(() => {
                onClose();
                window.location.reload();
              }, 2000);
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
    if (selectedPlan && selectedPlan !== 'free' && userId && !paypalRendered.current && isOpen) {
      renderPayPalButton(selectedPlan);
    }
  }, [selectedPlan, userId, isOpen]);

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === currentPlan) return;
    if (plan === 'free') return;

    paypalRendered.current = false;
    setSelectedPlan(plan);
  };

  // Filtrer pour afficher seulement premium et pro
  const availablePlans: PlanType[] = ['premium', 'pro'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Crédits insuffisants</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-[#252525] rounded transition-colors"
                >
                  <X className="w-5 h-5 text-[#A3A3A3]" />
                </button>
              </div>

              {/* Message */}
              <p className="text-[#A3A3A3] mb-4">
                Vous n'avez pas assez de crédits pour générer cette vidéo.
              </p>

              {/* Balance Info */}
              <div className="bg-[#252525] rounded-lg p-3 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-[#A3A3A3]">Solde actuel</span>
                  <span className="text-white font-semibold">{currentBalance} crédit{currentBalance > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A3A3]">Requis</span>
                  <span className="text-amber-400 font-semibold">{required} crédit{required > 1 ? 's' : ''}</span>
                </div>
                {currentBalance < required && (
                  <div className="flex justify-between mt-2 pt-2 border-t border-[#3A3A3A]">
                    <span className="text-[#A3A3A3]">Manquant</span>
                    <span className="text-red-400 font-semibold">{required - currentBalance} crédit{(required - currentBalance) > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Payment Success */}
              {paymentSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 text-center"
                >
                  <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Paiement réussi !</h3>
                  <p className="text-green-300 text-sm">Vos crédits ont été ajoutés. Rechargement...</p>
                </motion.div>
              ) : selectedPlan ? (
                /* PayPal Section */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#252525] rounded-xl p-5"
                >
                  <h3 className="text-lg font-bold text-white text-center mb-3">
                    Finaliser votre achat
                  </h3>
                  <p className="text-[#A3A3A3] text-center mb-4 text-sm">
                    Plan {CREDIT_CONFIG.plans[selectedPlan].name} - {CREDIT_CONFIG.plans[selectedPlan].monthlyCredits} crédits/mois
                  </p>

                  <div className="relative">
                    {processingPayment && (
                      <div className="absolute inset-0 bg-[#252525]/80 rounded-xl flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-[#3BB9FF] animate-spin" />
                      </div>
                    )}
                    <div ref={paypalButtonRef} className="min-h-[50px]"></div>
                  </div>

                  <p className="text-center text-[#A3A3A3] text-xs mt-3">
                    Paiement sécurisé par PayPal
                  </p>

                  <button
                    onClick={() => {
                      setSelectedPlan(null);
                      paypalRendered.current = false;
                    }}
                    className="w-full mt-3 py-2 text-[#A3A3A3] hover:text-white transition-colors text-sm"
                  >
                    ← Retour aux plans
                  </button>
                </motion.div>
              ) : (
                /* Plans Grid */
                <>
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">
                    Choisissez un abonnement
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    {availablePlans.map((planKey) => {
                      const plan = CREDIT_CONFIG.plans[planKey];
                      const Icon = planIcons[planKey];
                      const isCurrentPlan = currentPlan === planKey;

                      return (
                        <motion.div
                          key={planKey}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`relative bg-[#252525] border rounded-xl p-4 ${
                            isCurrentPlan
                              ? 'border-[#3BB9FF] ring-1 ring-[#3BB9FF]/20'
                              : 'border-[#3A3A3A] hover:border-[#4A4A4A]'
                          }`}
                        >
                          {isCurrentPlan && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#3BB9FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Actuel
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${planColors[planKey]} flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">{plan.name}</h4>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">{plan.priceMonthly}€</span>
                                <span className="text-[#A3A3A3] text-xs">/mois</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#1A1A1A] rounded-lg p-2 mb-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Coins className="w-4 h-4 text-[#3BB9FF]" />
                              <span className="text-lg font-bold text-[#3BB9FF]">{plan.monthlyCredits}</span>
                              <span className="text-[#A3A3A3] text-xs">crédits/mois</span>
                            </div>
                          </div>

                          <ul className="space-y-1.5 mb-3">
                            {plan.features.slice(0, 3).map((feature) => (
                              <li key={feature} className="flex items-center gap-2 text-[#A3A3A3] text-xs">
                                <Check className="w-3 h-3 text-[#3BB9FF] flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          {!userId ? (
                            <a
                              href="/connexion"
                              className="block w-full py-2 text-center bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2A2A2A] transition-colors"
                            >
                              Connexion requise
                            </a>
                          ) : isCurrentPlan ? (
                            <button
                              disabled
                              className="w-full py-2 text-center bg-[#1A1A1A] text-[#A3A3A3] rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              Plan actuel
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSelectPlan(planKey)}
                              className="w-full py-2 text-center bg-gradient-to-r from-[#3BB9FF] to-[#2FA9F2] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              Choisir
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="text-center text-[#A3A3A3] text-xs">
                    1 crédit = 1 vidéo • Crédits renouvelés chaque mois
                  </p>
                </>
              )}

              {/* Close button */}
              {!paymentSuccess && (
                <button
                  onClick={onClose}
                  className="w-full mt-4 py-2 text-[#A3A3A3] hover:text-white transition-colors text-sm"
                >
                  Fermer
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
