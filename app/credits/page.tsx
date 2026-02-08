'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Loader2, Coins, Sparkles, Zap, Crown, Lock } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window {
    paypal?: any;
  }
}

// Packs de crédits à l'unité
const CREDIT_PACKS = [
  {
    id: 'pack_10',
    credits: 10,
    price: 2.97,
    pricePerCredit: 0.30,
    icon: Coins,
    color: 'from-blue-500 to-cyan-500',
    popular: false,
  },
  {
    id: 'pack_30',
    credits: 30,
    price: 7.97,
    pricePerCredit: 0.27,
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    popular: true,
    savings: '10%',
  },
  {
    id: 'pack_60',
    credits: 60,
    price: 14.97,
    pricePerCredit: 0.25,
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
    popular: false,
    savings: '17%',
  },
  {
    id: 'pack_150',
    credits: 150,
    price: 34.97,
    pricePerCredit: 0.23,
    icon: Crown,
    color: 'from-emerald-500 to-teal-500',
    popular: false,
    savings: '22%',
  },
];

export default function CreditsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPack, setSelectedPack] = useState<typeof CREDIT_PACKS[0] | null>(null);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [isPaidSubscriber, setIsPaidSubscriber] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && !storedUserId.startsWith('user_') && !storedUserId.startsWith('temp_')) {
      setUserId(storedUserId);
      loadUserData(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      const [creditsRes, profileRes] = await Promise.all([
        fetch(`/api/credits?userId=${uid}`),
        fetch(`/api/user/profile?userId=${uid}`),
      ]);

      const creditsData = await creditsRes.json();
      if (creditsData.success) {
        setCurrentCredits(creditsData.balance || 0);
      }

      const profileData = await profileRes.json();
      if (profileData.plan && profileData.plan !== 'free' && profileData.subscriptionStatus === 'active') {
        setIsPaidSubscriber(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPayPalButton = (pack: typeof CREDIT_PACKS[0]) => {
    if (!userId || paypalRendered.current) return;

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
                  value: pack.price.toFixed(2),
                  currency_code: 'EUR'
                },
                description: `MyDouble - ${pack.credits} crédits`
              }]
            });
          },
          onApprove: async (_data: any, actions: any) => {
            setProcessingPayment(true);
            try {
              const captureData = await actions.order.capture();

              // Ajouter les crédits au compte
              const response = await fetch('/api/credits/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  orderId: captureData.id,
                  credits: pack.credits,
                  amount: pack.price,
                }),
              });

              const result = await response.json();

              if (result.success) {
                setPurchasedCredits(pack.credits);
                setCurrentCredits(result.newBalance || currentCredits + pack.credits);
                setPaymentSuccess(true);
              }
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
    if (selectedPack && userId && !paypalRendered.current) {
      renderPayPalButton(selectedPack);
    }
  }, [selectedPack, userId]);

  const handleSelectPack = (pack: typeof CREDIT_PACKS[0]) => {
    paypalRendered.current = false;
    setSelectedPack(pack);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3BB9FF] animate-spin" />
      </div>
    );
  }

  if (userId && !isPaidSubscriber) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Réservé aux abonnés
          </h2>
          <p className="text-[#A3A3A3] mb-6">
            L'achat de crédits est réservé aux membres avec un abonnement Premium ou Pro actif.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/tarification"
              className="inline-block bg-[#3BB9FF] text-white px-8 py-3 rounded-full hover:bg-[#2FA9F2] font-semibold transition-colors"
            >
              Voir les abonnements
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 text-[#A3A3A3] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#3BB9FF] hover:text-[#2FA9F2] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Acheter des <span className="text-[#3BB9FF]">Crédits</span>
          </h1>
          <p className="text-[#A3A3A3] text-lg mb-4">
            Achetez des crédits à l'unité, sans abonnement
          </p>

          {/* Solde actuel */}
          {userId && (
            <div className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-6 py-3">
              <Coins className="w-5 h-5 text-[#3BB9FF]" />
              <span className="text-white font-semibold">Solde actuel :</span>
              <span className="text-[#3BB9FF] font-bold text-xl">{currentCredits}</span>
              <span className="text-[#A3A3A3]">crédits</span>
            </div>
          )}
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
            <p className="text-green-300 mb-2">
              {purchasedCredits} crédits ont été ajoutés à votre compte
            </p>
            <p className="text-white text-lg mb-4">
              Nouveau solde : <span className="text-[#3BB9FF] font-bold">{currentCredits}</span> crédits
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat-video"
                className="inline-block bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600 font-semibold"
              >
                Commencer à créer
              </Link>
              <button
                onClick={() => {
                  setPaymentSuccess(false);
                  setSelectedPack(null);
                  paypalRendered.current = false;
                }}
                className="inline-block bg-[#252525] text-white px-8 py-3 rounded-full hover:bg-[#2F2F2F] font-semibold"
              >
                Acheter plus
              </button>
            </div>
          </motion.div>
        )}

        {/* Packs Grid */}
        {!paymentSuccess && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {CREDIT_PACKS.map((pack, index) => {
              const Icon = pack.icon;
              const isSelected = selectedPack?.id === pack.id;

              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-[#1A1A1A] border rounded-2xl p-5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#3BB9FF] ring-2 ring-[#3BB9FF]/20'
                      : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                  }`}
                  onClick={() => handleSelectPack(pack)}
                >
                  {/* Badge populaire */}
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Populaire
                    </div>
                  )}

                  {/* Économie */}
                  {pack.savings && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{pack.savings}
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pack.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Credits */}
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-3xl font-bold text-white">{pack.credits}</span>
                    </div>
                    <p className="text-[#A3A3A3] text-sm">crédits</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-4">
                    <span className="text-2xl font-bold text-[#3BB9FF]">{pack.price}€</span>
                    <p className="text-[#6B7280] text-xs mt-1">
                      {pack.pricePerCredit.toFixed(2)}€ / crédit
                    </p>
                  </div>

                  {/* Button */}
                  <button
                    className={`w-full py-2.5 rounded-xl font-semibold transition-all text-sm ${
                      isSelected
                        ? 'bg-[#3BB9FF] text-white'
                        : 'bg-[#252525] text-white hover:bg-[#2F2F2F]'
                    }`}
                  >
                    {isSelected ? 'Sélectionné' : 'Choisir'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* PayPal Section */}
        {selectedPack && userId && !paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white text-center mb-4">
              Finaliser votre achat
            </h3>
            <div className="bg-[#252525] rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[#A3A3A3]">Pack sélectionné</span>
                <span className="text-white font-semibold">{selectedPack.credits} crédits</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[#A3A3A3]">Total</span>
                <span className="text-[#3BB9FF] font-bold text-xl">{selectedPack.price}€</span>
              </div>
            </div>

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
                setSelectedPack(null);
                paypalRendered.current = false;
              }}
              className="w-full mt-4 py-2 text-[#A3A3A3] hover:text-white transition-colors text-sm"
            >
              Annuler
            </button>
          </motion.div>
        )}

        {/* Non connecté */}
        {!userId && !paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 text-center"
          >
            <Coins className="w-16 h-16 text-[#3BB9FF] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Connectez-vous pour acheter
            </h3>
            <p className="text-[#A3A3A3] mb-6">
              Vous devez être connecté pour acheter des crédits
            </p>
            <Link
              href="/connexion"
              className="inline-block bg-[#3BB9FF] text-white px-8 py-3 rounded-full hover:bg-[#2FA9F2] font-semibold"
            >
              Se connecter
            </Link>
          </motion.div>
        )}

        {/* Info */}
        <div className="text-center text-[#A3A3A3] text-sm mt-8 space-y-2">
          <p>1 crédit = 1 vidéo générée</p>
          <p>Les crédits n'expirent jamais</p>
          <Link href="/tarification" className="text-[#3BB9FF] hover:underline block mt-4">
            Vous préférez un abonnement ? Voir nos plans
          </Link>
        </div>
      </div>
    </div>
  );
}
