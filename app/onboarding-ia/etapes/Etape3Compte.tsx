"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

interface Etape3CompteProps {
  data: any;
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function Etape3Compte({ data, onUpdate, onNext, onBack, isLoading, setIsLoading }: Etape3CompteProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreatingAccount(true);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      if (data.userId) {
        localStorage.setItem('userId', data.userId.toString());
        setAccountCreated(true);
        // Attendre un peu pour montrer le succès
        setTimeout(() => {
          onNext();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsCreatingAccount(false);
      setIsLoading(false);
    }
  };

  if (accountCreated) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Compte créé avec succès !</h2>
            <p className="text-gray-600">Redirection vers la finalisation...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Crée ton{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              compte
            </span>
          </h2>
          <p className="text-gray-600">
            Pour sauvegarder ton double IA et y accéder plus tard, crée un compte gratuit
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                placeholder="Jean Dupont"
              />
            </div>
          </div>

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
            <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={isCreatingAccount || isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isCreatingAccount ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Création du compte...
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
            >
              ← Retour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
