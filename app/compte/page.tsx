"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, LogOut, Settings, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  messagesCount: number;
  improvementLevel: number;
  voiceId?: string;
}

export default function ComptePage() {
  const router = useRouter();
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        // Si pas de userId, utiliser des données par défaut
        const defaultAccount: UserAccount = {
          id: 'guest',
          name: 'Invité',
          email: 'guest@example.com',
          createdAt: new Date().toISOString(),
          messagesCount: 0,
          improvementLevel: 0,
        };
        setAccount(defaultAccount);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      setAccount({
        id: data.id,
        name: data.name,
        email: data.email,
        createdAt: data.createdAt,
        messagesCount: data.messagesCount || 0,
        improvementLevel: data.improvementLevel || 0,
        voiceId: data.voiceId,
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#e31fc1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Compte introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-12 pb-24">
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
          <p className="text-gray-400">Gère tes informations personnelles</p>
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
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center text-3xl font-bold">
                  {account.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="font-bold text-2xl mb-1">{account.name}</h2>
                  <p className="text-gray-400">{account.email}</p>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-gray-800">
                {/* Nom */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#e31fc1]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Nom</p>
                    <p className="text-lg font-semibold">{account.name}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#ff6b9d]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Email</p>
                    <p className="text-lg font-semibold">{account.email}</p>
                  </div>
                </div>

                {/* Date de création */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#ffc0cb]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Membre depuis</p>
                    <p className="text-lg font-semibold">{formatDate(account.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Statistiques */}
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6">Statistiques</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <MessageSquare className="w-6 h-6 text-[#e31fc1]" />
                    <span className="text-gray-400">Messages échangés</span>
                  </div>
                  <span className="font-bold text-xl">{account.messagesCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Niveau d'amélioration</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-3 bg-gray-800 rounded-full overflow-hidden">
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
                  <span className="text-gray-400">Voix clonée</span>
                  <span className="font-semibold">
                    {account.voiceId ? (
                      <span className="text-green-400">✓ Activée</span>
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
              href="/mon-double-ia"
              className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] rounded-xl hover:scale-105 transition-transform font-semibold"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Parler avec mon double</span>
            </Link>

            <Link
              href="/carte"
              className="flex items-center gap-3 px-4 py-4 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors font-semibold"
            >
              <User className="w-5 h-5" />
              <span>Ma carte de personnalité</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-4 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors font-semibold"
            >
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 bg-gray-900 border border-gray-800 rounded-xl hover:bg-red-900/20 hover:border-red-500/50 transition-colors text-red-400 font-semibold"
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
