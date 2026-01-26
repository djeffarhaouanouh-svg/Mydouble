"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Lock, ArrowRight, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  messagesCount: number;
  improvementLevel: number;
  voiceId?: string | null;
  avatarUrl?: string | null;
  birthMonth?: number | null;
  birthDay?: number | null;
}

// Composant formulaire d'inscription
function InscriptionForm({ redirectTo, onSuccess }: { redirectTo: string; onSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

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
      } catch (parseError) {
        // Si la réponse n'est pas du JSON valide
        throw new Error('Erreur de communication avec le serveur. Vérifiez votre connexion.');
      }

      if (!response.ok) {
        // Afficher le message d'erreur détaillé du serveur
        const errorMessage = data.error || data.message || 'Une erreur est survenue';
        throw new Error(errorMessage);
      }

      if (data.userId) {
        localStorage.setItem('userId', data.userId.toString());
        if (data.userName) localStorage.setItem('userName', data.userName);
        if (data.userEmail) localStorage.setItem('userEmail', data.userEmail);
      }

      onSuccess();
    } catch (err: any) {
      // Gérer les erreurs réseau
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Erreur de connexion. Vérifiez votre connexion internet et que le serveur est démarré.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      }
      console.error('Erreur inscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-8 border border-[#2A2A2A]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">
              {isLogin ? 'Connexion' : 'Inscription'}
            </h1>
            <p className="text-[#A3A3A3]">
              {isLogin
                ? 'Connecte-toi pour accéder à ton compte'
                : 'Crée ton compte pour accéder à ton profil'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[#A3A3A3] mb-1">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#252525] border border-[#2A2A2A] rounded-lg text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF] focus:border-transparent"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#A3A3A3] mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#252525] border border-[#2A2A2A] rounded-lg text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF] focus:border-transparent"
                  placeholder="jean@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A3A3A3] mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#252525] border border-[#2A2A2A] rounded-lg text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF] focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-[#3BB9FF] text-[#0F0F0F] font-semibold hover:bg-[#2FA9F2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0F0F0F] border-t-transparent rounded-full animate-spin"></div>
                  {isLogin ? 'Connexion...' : 'Inscription...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Se connecter' : "S'inscrire"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-[#3BB9FF] hover:underline"
            >
              {isLogin
                ? "Pas encore de compte ? S'inscrire"
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ComptePage() {
  const router = useRouter();
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showInscription, setShowInscription] = useState(true); // Bloquer par défaut jusqu'à vérification

  useEffect(() => {
    loadAccount();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    router.push('/');
  };

  const loadAccount = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      // Vérifier si le userId est valide (doit être un nombre, pas user_ ou temp_)
      if (!userId || 
          userId.startsWith('user_') || 
          userId.startsWith('temp_') ||
          isNaN(Number(userId))) {
        // Si pas de userId valide, afficher le formulaire d'inscription
        setShowInscription(true);
        setIsLoading(false);
        return;
      }

      // Utilisateur connecté avec un compte valide, autoriser l'accès
      setShowInscription(false);

      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      const user = data.user || data; // Support des deux formats
      
      setAccount({
        id: user.id?.toString() || userId,
        name: user.name || 'Invité',
        email: user.email || '',
        createdAt: user.createdAt || new Date().toISOString(),
        messagesCount: user.messagesCount || 0,
        improvementLevel: user.improvementLevel || 0,
        voiceId: user.voiceId || null,
        avatarUrl: user.avatarUrl || null,
        birthMonth: user.birthMonth || null,
        birthDay: user.birthDay || null,
      });
    } catch (error) {
      console.error('Erreur:', error);
      // En cas d'erreur, utiliser des données par défaut
      const defaultAccount: UserAccount = {
        id: 'guest',
        name: 'Invité',
        email: 'guest@example.com',
        createdAt: new Date().toISOString(),
        messagesCount: 0,
        improvementLevel: 0,
        avatarUrl: null,
      };
      setAccount(defaultAccount);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1] || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3BB9FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#A3A3A3]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (showInscription) {
    return <InscriptionForm redirectTo="/compte" onSuccess={() => {
      setShowInscription(false);
      loadAccount();
    }} />;
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A3A3A3]">Compte introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0F0F0F] text-white pt-6 pb-24">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          {/* Titre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold">
              Mon <span className="text-[#3BB9FF]">Profil</span>
            </h1>
          </motion.div>

          {/* Informations utilisateur */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 md:space-y-6 w-full"
          >
            {/* Card Informations personnelles */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 md:p-8 mx-auto w-full">
              <div className="flex items-center gap-3 md:gap-6 mb-6 md:mb-8">
                {account.avatarUrl ? (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#3BB9FF]">
                    <img
                      src={account.avatarUrl}
                      alt={account.name ? account.name.split(' ')[0] : 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-[#124B6B] to-[#3BB9FF] flex items-center justify-center text-2xl md:text-3xl font-bold text-white">
                    {account.name ? account.name.split(' ')[0]?.[0]?.toUpperCase() || "U" : "U"}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-2xl mb-1 text-white">
                    {account.name ? account.name.split(' ')[0] : 'Invité'}
                  </h2>
                  <p className="text-[#A3A3A3]">{account.email}</p>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6 pt-4 md:pt-6 border-t border-[#2A2A2A]">
                {/* Prénom */}
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#252525] flex items-center justify-center">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-[#3BB9FF]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#A3A3A3] mb-1">Prénom</p>
                    <p className="text-lg font-semibold text-white">
                      {account.name ? account.name.split(' ')[0] : 'Invité'}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#252525] flex items-center justify-center">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-[#2FA9F2]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#A3A3A3] mb-1">Email</p>
                    <p className="text-lg font-semibold text-white">{account.email}</p>
                  </div>
                </div>

                {/* Date de naissance */}
                {account.birthMonth && account.birthDay && (
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#252525] flex items-center justify-center">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-[#A9E8FF]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#A3A3A3] mb-1">Date de naissance</p>
                      <p className="text-lg font-semibold text-white">
                        {account.birthDay} {getMonthName(account.birthMonth)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Date de création */}
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#252525] flex items-center justify-center">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-[#A9E8FF]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#A3A3A3] mb-1">Membre depuis</p>
                    <p className="text-lg font-semibold text-white">{formatDate(account.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-3">
              <Link
                href="/settings"
                className="flex items-center justify-center gap-3 px-4 py-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl hover:border-[#3BB9FF] transition-colors font-semibold text-white w-full"
              >
                <Settings className="w-5 h-5" />
                <span>Paramètres</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl hover:border-red-500/50 transition-colors text-red-400 font-semibold"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-[65px] bg-[#1A1A1A] border-t border-t-[#3BB9FF] border-b border-[#2A2A2A] z-50 flex justify-around items-center pb-[env(safe-area-inset-bottom)]">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors px-3 py-1.5">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-[11px]">Accueil</span>
        </Link>
        <Link href="/messages" className="flex flex-col items-center gap-1 text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors px-3 py-2">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
          <span className="text-[11px]">Messages</span>
        </Link>
        <Link href="/avatar-fx" className="flex flex-col items-center gap-1 text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors px-3 py-2">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          <span className="text-[11px]">AvatarFX</span>
        </Link>
        <Link href="/compte" className="flex flex-col items-center gap-1 text-[#3BB9FF] px-3 py-2">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span className="text-[11px]">Profil</span>
        </Link>
      </nav>
    </>
  );
}
