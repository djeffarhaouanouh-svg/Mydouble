"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Calendar, Lock, ArrowRight, Settings, LogOut, Users, UserPlus, MessageSquare, Edit2, X, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditDisplay } from "@/components/ui/CreditDisplay";

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
                  Nom de profil
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

interface Creation {
  id: number;
  name?: string;
  photoUrl?: string;
  voiceId?: string;
  personality?: {
    ethnicite?: string;
    age?: string;
    couleurYeux?: string;
    coiffure?: string;
    couleurCheveux?: string;
    typeCorps?: string;
    taillePoitrine?: string;
    vetements?: string;
  };
  characterName?: string;
  createdAt: string;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  ethnicite: "Ethnicité",
  age: "Âge",
  couleurYeux: "Couleur des yeux",
  coiffure: "Coiffure",
  couleurCheveux: "Couleur de cheveux",
  typeCorps: "Type de corps",
  taillePoitrine: "Taille de poitrine",
  vetements: "Vêtements",
};

export default function ComptePage() {
  const router = useRouter();
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creations, setCreations] = useState<{
    characters: Creation[];
    voices: Creation[];
    roleplays: Creation[];
  }>({
    characters: [],
    voices: [],
    roleplays: [],
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAvatarFXMenu, setShowAvatarFXMenu] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Creation | null>(null);

  const [showInscription, setShowInscription] = useState(true); // Bloquer par défaut jusqu'à vérification

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    if (account && account.id !== 'guest') {
      loadCreations();
    }
  }, [account]);

  // Fermer le menu AvatarFX si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menuContainer = document.querySelector('.avatar-fx-menu-container');
      if (showAvatarFXMenu && menuContainer && !menuContainer.contains(target)) {
        setShowAvatarFXMenu(false);
      }
    };

    if (showAvatarFXMenu) {
      // Petit délai pour éviter que le clic sur le bouton ferme immédiatement le menu
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAvatarFXMenu]);

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
      // En cas d'erreur API, utiliser les données du localStorage comme fallback
      const cachedUserId = localStorage.getItem('userId');
      const cachedName = localStorage.getItem('userName');
      const cachedEmail = localStorage.getItem('userEmail');

      if (cachedName || cachedEmail) {
        // Utiliser les données en cache du localStorage
        setAccount({
          id: cachedUserId || 'cached',
          name: cachedName || 'Utilisateur',
          email: cachedEmail || '',
          createdAt: new Date().toISOString(),
          messagesCount: 0,
          improvementLevel: 0,
          avatarUrl: null,
        });
      } else {
        // Aucune donnée en cache, afficher le formulaire d'inscription
        setShowInscription(true);
      }
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

  const loadCreations = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId || userId.startsWith('user_') || userId.startsWith('temp_') || isNaN(Number(userId))) {
        return;
      }

      const response = await fetch(`/api/user/creations?userId=${userId}`);
      if (!response.ok) return;
      
      const data = await response.json();
      setCreations({
        characters: data.characters || [],
        voices: data.voices || [],
        roleplays: data.roleplays || [],
      });
    } catch (error) {
      console.error('Erreur lors du chargement des créations:', error);
    }
  };

  const formatCreationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleEditClick = () => {
    if (!account) return;
    setEditFormData({
      name: account.name || '',
      email: account.email || '',
    });
    setIsEditingProfile(true);
    setSaveError(null);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Validation des champs
      if (!editFormData.name || editFormData.name.trim() === '') {
        throw new Error('Le nom est requis');
      }

      if (!editFormData.email || editFormData.email.trim() === '') {
        throw new Error('L\'email est requis');
      }

      // Validation du format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editFormData.email)) {
        throw new Error('Format d\'email invalide');
      }

      const userId = localStorage.getItem('userId');
      if (!userId || userId.startsWith('user_') || userId.startsWith('temp_') || isNaN(Number(userId))) {
        throw new Error('Utilisateur non connecté');
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: editFormData.name,
          email: editFormData.email,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Erreur lors de la mise à jour';
        try {
          const data = await response.json();
          errorMessage = data.error || data.message || errorMessage;
          if (data.details) {
            errorMessage += `: ${data.details}`;
          }
        } catch (e) {
          // Si la réponse n'est pas du JSON, utiliser le statut
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Mettre à jour le localStorage avec le nouvel email
      if (editFormData.email) {
        localStorage.setItem('userEmail', editFormData.email);
      }
      if (editFormData.name) {
        localStorage.setItem('userName', editFormData.name);
      }

      // Recharger les données du compte
      await loadAccount();
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
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
              <div className="flex items-center justify-between gap-2 md:gap-6 mb-6 md:mb-8">
                <div className="flex items-center gap-3 md:gap-6 min-w-0">
                  {account.avatarUrl ? (
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#3BB9FF] flex-shrink-0">
                      <img
                        src={account.avatarUrl}
                        alt={account.name ? account.name.split(' ')[0] : 'Avatar'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-[#124B6B] to-[#3BB9FF] flex items-center justify-center text-xl md:text-3xl font-bold text-white flex-shrink-0">
                      {account.name ? account.name.split(' ')[0]?.[0]?.toUpperCase() || "U" : "U"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-bold text-xl md:text-2xl text-white">
                      {account.name ? account.name.split(' ')[0] : 'Invité'}
                    </h2>
                    <p className="text-[#A3A3A3] text-sm md:text-base truncate">{account.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#3BB9FF] hover:bg-[#2FA9F2] text-white rounded-md transition-colors text-[11px] md:text-sm font-medium flex-shrink-0"
                >
                  <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Modifier</span>
                </button>
              </div>

              <div className="space-y-4 md:space-y-6 pt-4 md:pt-6 border-t border-[#2A2A2A]">
                {/* Nom de profil */}
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#252525] flex items-center justify-center">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-[#3BB9FF]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#A3A3A3] mb-1">Nom de profil</p>
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

            {/* Crédits */}
            <CreditDisplay showUpgrade={true} />

            {/* Modal d'édition du profil */}
            <AnimatePresence>
              {isEditingProfile && (
                <>
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsEditingProfile(false)}
                    className="fixed inset-0 bg-black/60 z-50"
                  />
                  
                  {/* Modal */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Modifier le profil</h2>
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className="p-2 hover:bg-[#252525] rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-[#A3A3A3]" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Nom */}
                        <div>
                          <label className="block text-sm font-medium text-[#A3A3A3] mb-2">
                            Nom complet
                          </label>
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[#252525] border border-[#2A2A2A] rounded-lg text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF] focus:border-transparent"
                            placeholder="Votre nom"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#A3A3A3] mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[#252525] border border-[#2A2A2A] rounded-lg text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF] focus:border-transparent"
                            placeholder="votre@email.com"
                            required
                          />
                        </div>

                        {saveError && (
                          <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {saveError}
                          </div>
                        )}

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => setIsEditingProfile(false)}
                            className="flex-1 px-4 py-2.5 bg-[#252525] hover:bg-[#2F2F2F] text-white rounded-lg transition-colors font-medium"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="flex-1 px-4 py-2.5 bg-[#3BB9FF] hover:bg-[#2FA9F2] text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Enregistrement...
                              </>
                            ) : (
                              'Enregistrer'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Section Créations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* Bouton Personnages */}
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-3 md:p-4">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'characters' ? null : 'characters')}
                  className={`flex items-center justify-between w-full p-3 md:p-4 rounded-xl transition-all duration-300 ${
                    expandedSection === 'characters'
                      ? 'bg-[#252525] border-2 border-[#3BB9FF]'
                      : 'hover:bg-[#252525]'
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center transition-colors ${
                      expandedSection === 'characters'
                        ? 'bg-[#3BB9FF]'
                        : 'bg-[#252525]'
                    }`}>
                      <Users className={`w-6 h-6 md:w-7 md:h-7 ${
                        expandedSection === 'characters' ? 'text-white' : 'text-[#3BB9FF]'
                      }`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base md:text-lg font-bold text-white">Personnages</h3>
                      <p className="text-xs md:text-sm text-[#A3A3A3]">{creations.characters.length} créé{creations.characters.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 text-[#A3A3A3] transition-transform ${expandedSection === 'characters' ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Section déroulante pour Personnages */}
              {expandedSection === 'characters' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 md:p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Personnages créés</h4>
                    {creations.characters.length > 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="grid grid-cols-2 md:grid-cols-3 gap-3"
                      >
                        {creations.characters.map((char, index) => (
                          <motion.div
                            key={char.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                            onClick={() => setSelectedCharacter(char)}
                            className="bg-[#252525] rounded-xl p-3 border border-[#2A2A2A] hover:border-[#3BB9FF] transition-colors cursor-pointer"
                          >
                            {char.photoUrl ? (
                              <img
                                src={char.photoUrl}
                                alt={char.name || 'Personnage'}
                                className="w-full h-24 object-cover rounded-lg mb-2"
                              />
                            ) : (
                              <div className="w-full h-24 bg-gradient-to-br from-[#124B6B] to-[#3BB9FF] rounded-lg mb-2 flex items-center justify-center text-2xl">
                                👤
                              </div>
                            )}
                            <p className="text-sm font-semibold text-white truncate">{char.name || 'Sans nom'}</p>
                            <p className="text-xs text-[#A3A3A3]">{formatCreationDate(char.createdAt)}</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="text-[#A3A3A3] text-sm text-center py-4"
                      >
                        Aucun personnage créé
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}

                          </motion.div>

            {/* Overlay détails personnage */}
            <AnimatePresence>
              {selectedCharacter && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedCharacter(null)}
                    className="fixed inset-0 bg-black/80 z-50"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                  >
                    <div
                      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header avec bouton fermer */}
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">{selectedCharacter.name}</h2>
                        <button
                          onClick={() => setSelectedCharacter(null)}
                          className="p-2 hover:bg-[#252525] rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-[#A3A3A3]" />
                        </button>
                      </div>

                      {/* Photo */}
                      <div className="flex justify-center mb-4">
                        <div className="w-40 h-40 rounded-xl overflow-hidden bg-[#252525] border-2 border-[#3BB9FF]">
                          {selectedCharacter.photoUrl ? (
                            <img
                              src={selectedCharacter.photoUrl}
                              alt={selectedCharacter.name || 'Personnage'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">
                              👤
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Date de création */}
                      <p className="text-center text-[#A3A3A3] text-sm mb-4">
                        Créé le {formatCreationDate(selectedCharacter.createdAt)}
                      </p>

                      {/* Caractéristiques */}
                      {selectedCharacter.personality && Object.keys(selectedCharacter.personality).length > 0 && (
                        <div className="bg-[#252525] rounded-xl p-4 mb-4">
                          <h3 className="text-sm font-semibold text-[#3BB9FF] mb-3">Caractéristiques</h3>
                          <div className="space-y-2">
                            {Object.entries(selectedCharacter.personality).map(([key, value]) => {
                              if (!value) return null;
                              return (
                                <div key={key} className="flex justify-between items-center py-1.5 border-b border-[#333] last:border-0">
                                  <span className="text-[#A3A3A3] text-sm">{ATTRIBUTE_LABELS[key] || key}</span>
                                  <span className="text-white text-sm font-medium">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Bouton Discuter */}
                      <Link
                        href={`/chat-video?characterId=${selectedCharacter.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3BB9FF] hover:bg-[#2FA9F2] text-white rounded-xl transition-colors font-semibold"
                      >
                        <MessageSquare className="w-5 h-5" />
                        Discuter avec {selectedCharacter.name}
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

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

      {/* Bottom Navigation - même style que page.tsx */}
      <nav className="fixed bottom-0 left-0 right-0 h-[58px] bg-[#1A1A1A] border-t border-t-[#3BB9FF] border-b border-[#2A2A2A] z-50 flex justify-around items-center py-[6px] pb-[max(6px,env(safe-area-inset-bottom))]">
        <Link href="/" className="flex flex-col items-center gap-[3px] text-[11px] text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors px-[11px] py-[5px]">
          <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span>Accueil</span>
        </Link>
        <Link href="/messages" className="flex flex-col items-center gap-[3px] text-[11px] text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors px-[11px] py-[5px]">
          <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
          <span>Messages</span>
        </Link>
        <div className="relative avatar-fx-menu-container">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAvatarFXMenu(!showAvatarFXMenu);
            }}
            className={`flex flex-col items-center gap-[3px] text-[11px] transition-colors px-[11px] py-[5px] ${
              showAvatarFXMenu ? 'text-[#3BB9FF]' : 'text-[#A3A3A3] hover:text-[#3BB9FF]'
            }`}
          >
            <Wand2 className="w-[22px] h-[22px] fill-current" />
            <span>Créer</span>
          </button>
          
          {/* Menu déroulant */}
          {showAvatarFXMenu && (
            <>
              {/* Overlay pour fermer le menu */}
              <div 
                className="fixed inset-0 z-[100]"
                onClick={() => setShowAvatarFXMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, x: 76 }}
                animate={{ opacity: 1, y: 0, x: 76 }}
                exit={{ opacity: 0, y: 10, x: 76 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute bottom-full right-0 mb-2 w-56 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden z-[101]"
              >
              <div className="py-2">
                <Link
                  href="/avatar-fx"
                  onClick={() => setShowAvatarFXMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#252525] transition-colors text-white"
                >
                  <UserPlus className="w-5 h-5 text-[#3BB9FF]" />
                  <span className="text-sm">Personnage <span className="text-[#3BB9FF]" style={{ textShadow: '0 0 8px rgba(59, 185, 255, 0.8), 0 0 12px rgba(59, 185, 255, 0.5)' }}>FX</span></span>
                </Link>
              </div>
            </motion.div>
          </>
          )}
        </div>
        <Link href="/compte" className="flex flex-col items-center gap-[3px] text-[11px] text-[#3BB9FF] px-[11px] py-[5px]">
          <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span>Profil</span>
        </Link>
      </nav>
    </>
  );
}
