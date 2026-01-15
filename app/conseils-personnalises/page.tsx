"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import type { Advice } from "@/lib/types";

export default function ConseilsPersonnalisesPage() {
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdvice();
  }, []);

  const loadAdvice = async () => {
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

      if (double?.diagnostic?.advice && double.diagnostic.advice.length > 0) {
        setAdvice(double.diagnostic.advice);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des conseils:', error);
      setLoading(false);
    }
  };

  // Conseils par défaut si aucun conseil n'est disponible
  const defaultAdvice = [
    {
      number: "1",
      title: "Cultive ton impatience productive",
      content:
        "Ton besoin de résultats rapides n'est pas un défaut, c'est un moteur. Utilise-le : découpe tes gros projets en micro-victoires quotidiennes. Ça te garde motivé et tu avances 10x plus vite.",
    },
    {
      number: "2",
      title: "Documente tes raccourcis",
      content:
        "Tu trouves constamment des solutions élégantes. Note-les : crée-toi une bibliothèque personnelle de \"patterns qui marchent\". Dans 6 mois, tu auras un arsenal de stratégies éprouvées.",
    },
    {
      number: "3",
      title: "Protège tes phases de deep work",
      content:
        "Ta force = focus intense sur l'essentiel. Blindage nécessaire : bloque 2-3h par jour en mode \"zéro interruption\". C'est là que tu produis ta meilleure work.",
    },
    {
      number: "💡",
      title: "Ton superpower caché",
      content:
        "Tu transformes la complexité en simplicité. Quand les autres voient un problème compliqué, tu vois 3 étapes claires. Monétise ça : les gens paieraient cher pour cette clarté. Enseigne, consulte, crée du contenu qui simplifie.",
      highlight: true,
    },
  ];

  const adviceList = advice.length > 0 ? advice : defaultAdvice;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de tes conseils...</p>
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
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Conseils personnalisés</h1>
            <p className="text-gray-600 italic">Comment amplifier tes forces naturelles</p>
          </div>
        </motion.div>

        {/* Liste des conseils */}
        <div className="space-y-5 mb-6">
          {adviceList.map((adviceItem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`flex gap-4 p-5 rounded-2xl border-2 transition-all ${
                adviceItem.highlight
                  ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-300 hover:border-amber-400 shadow-lg"
                  : "bg-white border-gray-200 hover:border-purple-400 hover:shadow-lg"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0 ${
                  adviceItem.highlight
                    ? "bg-gradient-to-r from-amber-500 to-orange-600"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600"
                }`}
              >
                {adviceItem.number}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{adviceItem.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{adviceItem.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 text-center"
        >
          <p className="text-red-600 mb-6 text-lg">💡 Continue à parler avec ton double pour améliorer sa précision !</p>
          <Link
            href="/messages"
            className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:scale-105 hover:shadow-xl transition-all"
          >
            Parler avec mon Double
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
