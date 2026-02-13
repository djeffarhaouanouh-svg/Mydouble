'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { CREDIT_CONFIG, PlanType } from '@/lib/credits';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PromoValentineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PromoStep = 'plans' | 'paypal' | 'success';

export function PromoValentineModal({ isOpen, onClose }: PromoValentineModalProps) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [step, setStep] = useState<PromoStep>('plans');
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      setCountdown({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setStep('plans');
      setSelectedPlan(null);
      paypalRendered.current = false;
    }
  }, [isOpen]);

  // Lire le cookie affiliate_ref
  const getAffiliateRef = () => {
    const cookies = document.cookie.split(';').reduce((acc, c) => {
      const [key, val] = c.trim().split('=');
      if (key && val) acc[key] = val;
      return acc;
    }, {} as Record<string, string>);
    return cookies['affiliate_ref'] || undefined;
  };

  const renderPayPalButton = (plan: PlanType) => {
    const userId = localStorage.getItem('userId');
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
          style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal', height: 45 },
          createOrder: (_data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: { value: price.toFixed(2), currency_code: 'EUR' },
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
                  plan,
                  affiliateRef: getAffiliateRef(),
                }),
              });
              setStep('success');
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
    if (selectedPlan && isOpen && step === 'paypal' && !paypalRendered.current) {
      renderPayPalButton(selectedPlan);
    }
  }, [selectedPlan, isOpen, step]);

  const handleSelectPlan = (plan: PlanType) => {
    paypalRendered.current = false;
    setSelectedPlan(plan);
    setStep('paypal');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[380px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header gradient */}
        <div className="relative px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 50%, #e91e63 100%)', backgroundSize: '200% 100%' }}>
          <div className="absolute top-2 left-3 text-2xl opacity-60">💕</div>
          <div className="absolute top-1 right-12 text-lg opacity-40">💗</div>
          <div className="absolute bottom-2 left-1/4 text-sm opacity-30">❤️</div>

          <div className="flex items-center justify-between">
            <div>
              <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">-70%</span>
              <h2 className="text-white text-xl font-bold tracking-wide">SAINT-VALENTIN</h2>
            </div>

            <div className="flex items-center gap-1 text-white">
              <div className="text-center">
                <div className="bg-black/30 rounded px-2 py-1 text-lg font-bold leading-none" style={{ fontVariantNumeric: 'tabular-nums', minWidth: '36px' }}>
                  {String(countdown.hours).padStart(2, '0')}
                </div>
                <span className="text-[9px] opacity-70 uppercase">H</span>
              </div>
              <span className="text-white/50 font-bold mb-3">|</span>
              <div className="text-center">
                <div className="bg-black/30 rounded px-2 py-1 text-lg font-bold leading-none" style={{ fontVariantNumeric: 'tabular-nums', minWidth: '36px' }}>
                  {String(countdown.minutes).padStart(2, '0')}
                </div>
                <span className="text-[9px] opacity-70 uppercase">Min</span>
              </div>
              <span className="text-white/50 font-bold mb-3">|</span>
              <div className="text-center">
                <div className="bg-black/30 rounded px-2 py-1 text-lg font-bold leading-none" style={{ fontVariantNumeric: 'tabular-nums', minWidth: '36px' }}>
                  {String(countdown.seconds).padStart(2, '0')}
                </div>
                <span className="text-[9px] opacity-70 uppercase">Sec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-5 pt-4 pb-5">

          {/* ÉTAPE : Choix du plan */}
          {step === 'plans' && (
            <div className="space-y-3">
              <p className="text-[#A3A3A3] text-xs text-center">Vos crédits sont épuisés. Profitez de l'offre !</p>

              {/* Premium */}
              <button
                onClick={() => handleSelectPlan('premium')}
                className="relative w-full border-2 border-purple-500 rounded-xl p-3 text-left transition-all hover:border-purple-400"
                style={{ background: '#252525' }}
              >
                <span className="absolute -top-2.5 left-3 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Choix populaire</span>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-white font-bold text-sm">Premium</p>
                    <span className="text-pink-400 text-[11px] font-semibold">OFFRE -70%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#A3A3A3] text-sm line-through mr-2">{(9.97 / 0.3).toFixed(2)}€</span>
                    <span className="text-white text-2xl font-bold">9.97€</span>
                    <span className="text-[#A3A3A3] text-xs">/mois</span>
                  </div>
                </div>
                <p className="text-[#A3A3A3] text-[11px] mt-1">50 crédits/mois &bull; Mémoire avancée</p>
              </button>

              {/* Pro */}
              <button
                onClick={() => handleSelectPlan('pro')}
                className="w-full border border-[#2A2A2A] rounded-xl p-3 text-left transition-all hover:border-[#3BB9FF]"
                style={{ background: '#252525' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">Pro</p>
                    <span className="text-pink-400 text-[11px] font-semibold">OFFRE -70%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#A3A3A3] text-sm line-through mr-2">{(29.97 / 0.3).toFixed(2)}€</span>
                    <span className="text-white text-2xl font-bold">29.97€</span>
                    <span className="text-[#A3A3A3] text-xs">/mois</span>
                  </div>
                </div>
                <p className="text-[#A3A3A3] text-[11px] mt-1">200 crédits/mois &bull; Support VIP</p>
              </button>

              <p className="text-[#A3A3A3] text-[10px] text-center">
                Annulez l'abonnement à tout moment
              </p>
            </div>
          )}

          {/* ÉTAPE : PayPal */}
          {step === 'paypal' && selectedPlan && (
            <div>
              <p className="text-[#A3A3A3] text-center mb-4 text-sm">
                {CREDIT_CONFIG.plans[selectedPlan].name} - {CREDIT_CONFIG.plans[selectedPlan].monthlyCredits} crédits/mois - {CREDIT_CONFIG.plans[selectedPlan].priceMonthly}€/mois
              </p>

              <div className="relative">
                {processingPayment && (
                  <div className="absolute inset-0 bg-[#1A1A1A]/80 rounded-xl flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-[#3BB9FF] animate-spin" />
                  </div>
                )}
                <div ref={paypalButtonRef} className="min-h-[50px]"></div>
              </div>

              <p className="text-center text-[#A3A3A3] text-[10px] mt-3">
                Paiement sécurisé par PayPal
              </p>

              <button
                onClick={() => {
                  setSelectedPlan(null);
                  paypalRendered.current = false;
                  setStep('plans');
                }}
                className="w-full mt-3 py-2 text-[#A3A3A3] hover:text-white transition-colors text-sm"
              >
                ← Retour
              </button>
            </div>
          )}

          {/* ÉTAPE : Succès */}
          {step === 'success' && (
            <div className="text-center py-4">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Paiement réussi !</h3>
              <p className="text-green-300 text-sm">Vos crédits ont été ajoutés. Rechargement...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
