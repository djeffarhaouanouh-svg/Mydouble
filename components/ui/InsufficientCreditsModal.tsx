'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Coins, X, Crown, Zap, Check, Loader2, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
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

type ModalStep = 'register' | 'plans' | 'paypal' | 'success';

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
  const [step, setStep] = useState<ModalStep>('plans');
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  // Registration form state
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Déterminer l'étape initiale selon l'état de connexion
  useEffect(() => {
    if (isOpen) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId && !storedUserId.startsWith('user_') && !storedUserId.startsWith('temp_')) {
        setUserId(storedUserId);
        setStep('plans');
        loadUserPlan(storedUserId);
      } else {
        setUserId(null);
        setStep('register');
      }
    }
  }, [isOpen]);

  // Reset state quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlan(null);
      setPaymentSuccess(false);
      setStep('plans');
      setFormData({ name: '', email: '', password: '' });
      setFormError(null);
      setIsLogin(false);
      setShowPassword(false);
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

  // Synchroniser les messages anonymes en localStorage vers la DB
  const syncAnonymousMessages = async (newUserId: string) => {
    try {
      const conversations: { characterId: string | null; storyId: string | null; messages: any[] }[] = [];

      // Parcourir toutes les clés localStorage pour trouver les messages anonymes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('anonMessages_')) continue;

        const stored = localStorage.getItem(key);
        if (!stored) continue;

        let msgs;
        try { msgs = JSON.parse(stored); } catch { continue; }
        if (!Array.isArray(msgs) || msgs.length === 0) continue;

        let characterId: string | null = null;
        let storyId: string | null = null;

        if (key.startsWith('anonMessages_char_')) {
          characterId = key.replace('anonMessages_char_', '');
        } else if (key.startsWith('anonMessages_story_')) {
          storyId = key.replace('anonMessages_story_', '');
        }

        conversations.push({
          characterId,
          storyId,
          messages: msgs.map((m: any) => ({
            role: m.role,
            content: m.content,
            audioUrl: m.audioUrl || null,
            videoUrl: m.videoUrl || null,
          })),
        });
      }

      if (conversations.length === 0) return;

      await fetch('/api/messages/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUserId, conversations }),
      });

      // Nettoyer les messages anonymes du localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('anonMessages_')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.error('Erreur sync messages anonymes:', error);
    }
  };

  // Inscription / Connexion
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Erreur de communication avec le serveur.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      // Sauvegarder dans localStorage
      if (data.userId) {
        localStorage.setItem('userId', data.userId.toString());
        if (data.userName) localStorage.setItem('userName', data.userName);
        if (data.userEmail) localStorage.setItem('userEmail', data.userEmail);
        setUserId(data.userId.toString());
        loadUserPlan(data.userId.toString());

        // Synchroniser les messages anonymes vers la base de données
        syncAnonymousMessages(data.userId.toString());

        setStep('plans');
      }
    } catch (err: any) {
      setFormError(err.message || 'Une erreur est survenue');
    } finally {
      setFormLoading(false);
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
              setStep('success');

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
    if (selectedPlan && selectedPlan !== 'free' && userId && !paypalRendered.current && isOpen && step === 'paypal') {
      renderPayPalButton(selectedPlan);
    }
  }, [selectedPlan, userId, isOpen, step]);

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === currentPlan) return;
    if (plan === 'free') return;

    paypalRendered.current = false;
    setSelectedPlan(plan);
    setStep('paypal');
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
                  <span className="font-semibold">
                    {step === 'register' ? 'Inscription requise' : 'Crédits insuffisants'}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-[#252525] rounded transition-colors"
                >
                  <X className="w-5 h-5 text-[#A3A3A3]" />
                </button>
              </div>

              {/* ==================== ÉTAPE : INSCRIPTION ==================== */}
              {step === 'register' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-[#A3A3A3] mb-5">
                    {isLogin
                      ? 'Connectez-vous pour obtenir plus de crédits et continuer à générer des vidéos.'
                      : 'Vos crédits gratuits sont épuisés. Créez un compte gratuit pour obtenir 3 crédits bonus + 5 crédits par mois !'}
                  </p>

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-[#A3A3A3] mb-1.5">
                          Nom de profil
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                          <input
                            type="text"
                            required={!isLogin}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#252525] border border-[#3A3A3A] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF]/50 focus:border-[#3BB9FF] text-sm"
                            placeholder="Jean Dupont"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#A3A3A3] mb-1.5">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#252525] border border-[#3A3A3A] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF]/50 focus:border-[#3BB9FF] text-sm"
                          placeholder="jean@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#A3A3A3] mb-1.5">
                        Mot de passe
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-10 pr-10 py-2.5 bg-[#252525] border border-[#3A3A3A] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF]/50 focus:border-[#3BB9FF] text-sm"
                          placeholder="••••••••"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {formError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-300 px-3 py-2 rounded-xl text-sm"
                      >
                        {formError}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3BB9FF] to-[#2FA9F2] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isLogin ? 'Connexion...' : 'Inscription...'}
                        </>
                      ) : (
                        <>
                          {isLogin ? 'Se connecter' : "S'inscrire"}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setFormError(null);
                        setFormData({ name: '', email: '', password: '' });
                      }}
                      className="text-sm text-[#A3A3A3] hover:text-white transition-colors underline"
                    >
                      {isLogin
                        ? "Pas encore de compte ? S'inscrire"
                        : 'Déjà un compte ? Se connecter'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ==================== ÉTAPE : PLANS ==================== */}
              {step === 'plans' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Message */}
                  <p className="text-[#A3A3A3] mb-4">
                    Vous n'avez pas assez de crédits. Choisissez un abonnement pour continuer.
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

                  {/* Plans Grid */}
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

                          {isCurrentPlan ? (
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
                </motion.div>
              )}

              {/* ==================== ÉTAPE : PAYPAL ==================== */}
              {step === 'paypal' && selectedPlan && (
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
                      setStep('plans');
                    }}
                    className="w-full mt-3 py-2 text-[#A3A3A3] hover:text-white transition-colors text-sm"
                  >
                    ← Retour aux plans
                  </button>
                </motion.div>
              )}

              {/* ==================== ÉTAPE : SUCCÈS ==================== */}
              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 text-center"
                >
                  <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Paiement réussi !</h3>
                  <p className="text-green-300 text-sm">Vos crédits ont été ajoutés. Rechargement...</p>
                </motion.div>
              )}

              {/* Close button */}
              {step !== 'success' && (
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
