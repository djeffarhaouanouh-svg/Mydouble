"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, LogOut, Settings, MessageSquare, Lock, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? 'Connexion' : 'Inscription'}
            </h1>
            <p className="text-gray-600">
              {isLogin 
                ? 'Connecte-toi pour accéder à ton compte' 
                : 'Crée ton compte pour accéder à ton profil'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                  placeholder="jean@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
              className="text-sm text-[#e31fc1] hover:underline"
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

  const handleLogout = () => {
    localStorage.removeItem('userId');
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#e31fc1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
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
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Compte introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Mon{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              Compte
            </span>
          </h1>
          <p className="text-gray-600">Gère tes informations personnelles</p>
        </motion.div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Colonne gauche - Informations utilisateur */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 space-y-6"
          >
            {/* Card Informations personnelles */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="flex items-center gap-6 mb-8">
                {account.avatarUrl ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#e31fc1]">
                    <img 
                      src={account.avatarUrl} 
                      alt={account.name ? account.name.split(' ')[0] : 'Avatar'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center text-3xl font-bold text-white">
                    {account.name ? account.name.split(' ')[0]?.[0]?.toUpperCase() || "U" : "U"}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-2xl mb-1 text-[#1d1d1f]">
                    {account.name ? account.name.split(' ')[0] : 'Invité'}
                  </h2>
                  <p className="text-gray-600">{account.email}</p>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-gray-200">
                {/* Prénom */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                    <User className="w-6 h-6 text-[#e31fc1]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Prénom</p>
                    <p className="text-lg font-semibold text-[#1d1d1f]">
                      {account.name ? account.name.split(' ')[0] : 'Invité'}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#ff6b9d]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-[#1d1d1f]">{account.email}</p>
                  </div>
                </div>

                {/* Date de création */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#ffc0cb]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Membre depuis</p>
                    <p className="text-lg font-semibold text-[#1d1d1f]">{formatDate(account.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Statistiques */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 text-[#1d1d1f]">Statistiques</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <MessageSquare className="w-6 h-6 text-[#e31fc1]" />
                    <span className="text-gray-600">Messages échangés</span>
                  </div>
                  <span className="font-bold text-xl text-[#1d1d1f]">{account.messagesCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Niveau d'amélioration</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#e31fc1] to-[#ffc0cb]"
                        style={{ width: `${account.improvementLevel || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#e31fc1] w-12 text-right">
                      {account.improvementLevel || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Voix clonée</span>
                  <span className="font-semibold">
                    {account.voiceId ? (
                      <span className="text-green-600">✓ Activée</span>
                    ) : (
                      <span className="text-gray-500">✗ Non activée</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Colonne droite - Actions rapides */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <Link
              href="/messages"
              className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] rounded-xl hover:scale-105 transition-transform font-semibold text-white"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Parler avec mon double</span>
            </Link>

            <Link
              href="/carte"
              className="flex items-center gap-3 px-4 py-4 bg-white border border-gray-200 rounded-xl hover:border-[#e31fc1] transition-colors font-semibold text-[#1d1d1f]"
            >
              <User className="w-5 h-5" />
              <span>Ma carte de personnalité</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-4 bg-white border border-gray-200 rounded-xl hover:border-[#e31fc1] transition-colors font-semibold text-[#1d1d1f]"
            >
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 bg-white border border-gray-200 rounded-xl hover:border-red-500/50 transition-colors text-red-500 font-semibold"
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
