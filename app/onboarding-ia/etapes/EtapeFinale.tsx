"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface EtapeFinaleProps {
  data: any;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function EtapeFinale({ data, onBack, isLoading, setIsLoading }: EtapeFinaleProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doubleId, setDoubleId] = useState<number | null>(null);

  const steps = [
    { label: "Assemblage des règles de style", progress: 25 },
    { label: "Configuration de la personnalité", progress: 50 },
    { label: "Intégration de la voix", progress: 75 },
    { label: "Création du prompt système", progress: 90 },
    { label: "Finalisation de ton double IA", progress: 100 },
  ];

  const createDouble = async () => {
    setCreating(true);
    setIsLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("Tu dois être connecté");
      }

      // Simuler la progression
      for (const step of steps) {
        setCurrentStep(step.label);
        setProgress(step.progress);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Appel API pour créer le double
      const response = await fetch("/api/double-ia/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          styleRules: data.styleRules,
          personality: data.personality,
          voiceId: data.voiceId,
          voiceName: data.voiceName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      const result = await response.json();
      setDoubleId(result.doubleId);

      // Rediriger vers le chat après 2 secondes
      setTimeout(() => {
        router.push(`/mon-double-ia/chat?id=${result.doubleId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setCreating(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        {!creating && !doubleId && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center"
              >
                <Sparkles className="w-10 h-10 text-black" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3">
                Tout est prêt !
              </h2>
              <p className="text-gray-600 text-lg">
                On a tout ce qu'il faut pour créer ton double IA
              </p>
            </div>

            {/* Récapitulatif */}
            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-lg bg-gray-100/50 border border-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-black mb-1">Style d'écriture</p>
                    <p className="text-sm text-gray-600">
                      {data.styleScreenshots?.length || 0} captures analysées
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-100/50 border border-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-black mb-1">Personnalité</p>
                    <p className="text-sm text-gray-600">
                      Profil de personnalité créé
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-100/50 border border-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-black mb-1">Voix clonée</p>
                    <p className="text-sm text-gray-600">
                      {data.voiceSamples?.length || 0} échantillons vocaux
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="mb-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-300">
                💡 Ton double IA sera créé en quelques secondes. Tu pourras ensuite discuter avec lui,
                le partager et le personnaliser davantage depuis ton dashboard.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={onBack}
                disabled={isLoading}
                className="px-6 py-3 rounded-lg border border-gray-700 text-black font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                ← Retour
              </button>
              <button
                onClick={createDouble}
                disabled={isLoading}
                className="flex-1 py-4 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black text-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Créer mon double IA ✨
              </button>
            </div>
          </>
        )}

        {creating && !doubleId && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <Loader2 className="w-full h-full text-[#e31fc1]" />
            </motion.div>

            <p className="text-xl font-semibold text-black mb-2">{currentStep}</p>

            <div className="max-w-md mx-auto mt-6">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {doubleId && (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-black" />
            </motion.div>

            <h2 className="text-3xl font-bold mb-3">
              🎉 Ton double IA est créé !
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Redirection vers ton dashboard...
            </p>

            <div className="inline-flex items-center gap-2 text-[#e31fc1]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-semibold">Chargement</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-semibold mb-1">Erreur</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={createDouble}
              className="mt-4 w-full py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
