"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function ProfilPersonnalitePage() {
  const [bigFiveScores, setBigFiveScores] = useState<{
    ouverture: number;
    conscienciosite: number;
    extraversion: number;
    agreabilite: number;
    sensibilite: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    loadBigFiveScores();
  }, []);

  const loadBigFiveScores = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      if (!userId || 
          userId.startsWith('user_') || 
          userId.startsWith('temp_') ||
          isNaN(Number(userId))) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/double-ia/get?userId=${userId}`);
      
      if (response.status === 404 || !response.ok) {
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      const double = data.double;

      if (double?.bigFiveScores) {
        setBigFiveScores(double.bigFiveScores);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du profil Big Five:', error);
      setLoading(false);
    }
  };

  // Punchlines dynamiques pour Big Five
  const getBigFivePunchline = () => {
    if (!bigFiveScores) return "Complete le quiz Big Five pour decouvrir ton profil de personnalite.";
    const { ouverture, conscienciosite, extraversion, agreabilite, sensibilite } = bigFiveScores;

    const dominated = [];
    const insights = [];

    if (ouverture >= 75) {
      dominated.push("curieuse et ouverte aux nouvelles experiences");
      insights.push("Ta grande ouverture d'esprit te pousse vers la creativite et l'exploration intellectuelle.");
    } else if (ouverture >= 60) {
      insights.push("Tu sais equilibrer tradition et nouveaute dans ta vie.");
    } else if (ouverture < 40) {
      insights.push("Tu privilegies le concret et les approches eprouvees.");
    }

    if (conscienciosite >= 75) {
      dominated.push("organisee et fiable");
      insights.push("Ton sens de l'organisation et ta discipline sont des atouts majeurs.");
    } else if (conscienciosite >= 60) {
      insights.push("Tu trouves un bon equilibre entre structure et flexibilite.");
    } else if (conscienciosite < 40) {
      insights.push("Tu preferes la spontaneite aux planifications rigides.");
    }

    if (extraversion >= 75) {
      dominated.push("sociable et energique");
      insights.push("Les interactions sociales te ressourcent et te motivent.");
    } else if (extraversion >= 60) {
      insights.push("Tu apprecies autant les moments sociaux que les temps calmes.");
    } else if (extraversion < 40) {
      dominated.push("introvertie et reflechie");
      insights.push("Tu te ressources dans la solitude et la reflexion profonde.");
    }

    if (agreabilite >= 75) {
      dominated.push("empathique et cooperative");
      insights.push("Ton empathie naturelle facilite tes relations et inspire confiance.");
    } else if (agreabilite >= 60) {
      insights.push("Tu sais cooperer tout en preservant tes interets.");
    } else if (agreabilite < 40) {
      insights.push("Tu privilegies l'objectivite et l'esprit critique dans tes jugements.");
    }

    if (sensibilite >= 70) {
      insights.push("Ta sensibilite emotionnelle te rend receptive aux nuances de ton environnement.");
    } else if (sensibilite >= 50) {
      insights.push("Tu geres bien tes emotions tout en restant connectee a tes ressentis.");
    } else if (sensibilite < 35) {
      dominated.push("stable emotionnellement");
      insights.push("Ta stabilite emotionnelle te permet de rester sereine face aux defis.");
    }

    if (dominated.length === 0) {
      return "Ton profil est harmonieusement equilibre, sans extreme marque. " + (insights[0] || "");
    }

    const mainTraits = dominated.slice(0, 2).join(" et ");
    const mainInsight = insights[0] || "";

    return `Tu es une personne ${mainTraits}. ${mainInsight}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de ton profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Bouton retour */}
        <Link 
          href="/carte"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à la carte
        </Link>

        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
        >
          <div className="text-center">
            <div className="text-5xl mb-4">🧠</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Ton profil de personnalité</h1>
            <p className="text-gray-600 italic">Modèle Big Five (OCEAN)</p>
          </div>
        </motion.div>

        {/* Profil Big Five */}
        {bigFiveScores ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
          >
            <div className="space-y-6">
              <div className="stat" data-value={bigFiveScores.ouverture}>
                <span className="label text-base">🌟 Ouverture</span>
                <div className="bar">
                  <div className="fill grad-purple" style={{width: `${bigFiveScores.ouverture}%`}}></div>
                </div>
                <span className="score text-base">{bigFiveScores.ouverture}%</span>
              </div>

              <div className="stat" data-value={bigFiveScores.conscienciosite}>
                <span className="label text-base">🧩 Conscienciosite</span>
                <div className="bar">
                  <div className="fill grad-blue" style={{width: `${bigFiveScores.conscienciosite}%`}}></div>
                </div>
                <span className="score text-base">{bigFiveScores.conscienciosite}%</span>
              </div>

              <div className="stat" data-value={bigFiveScores.extraversion}>
                <span className="label text-base">💬 Extraversion</span>
                <div className="bar">
                  <div className="fill grad-pink" style={{width: `${bigFiveScores.extraversion}%`}}></div>
                </div>
                <span className="score text-base">{bigFiveScores.extraversion}%</span>
              </div>

              <div className="stat" data-value={bigFiveScores.agreabilite}>
                <span className="label text-base">🤝 Agreabilite</span>
                <div className="bar">
                  <div className="fill grad-green" style={{width: `${bigFiveScores.agreabilite}%`}}></div>
                </div>
                <span className="score text-base">{bigFiveScores.agreabilite}%</span>
              </div>

              <div className="stat" data-value={bigFiveScores.sensibilite}>
                <span className="label text-base">🌊 Sensibilite emotionnelle</span>
                <div className="bar">
                  <div className="fill grad-yellow" style={{width: `${bigFiveScores.sensibilite}%`}}></div>
                </div>
                <span className="score text-base">{bigFiveScores.sensibilite}%</span>
              </div>

              <div className="pt-6 border-t-2 border-gray-200">
                <p className="punchline text-base leading-relaxed">
                  {getBigFivePunchline()}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 text-center"
          >
            <p className="text-gray-600 text-lg">
              Complete le quiz Big Five pour decouvrir ton profil de personnalite.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
