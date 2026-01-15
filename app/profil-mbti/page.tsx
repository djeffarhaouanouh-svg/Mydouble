"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

// Noms des types MBTI
const mbtiNames: Record<string, string> = {
  'ENFP': "L'Inspirateur", 'INFP': "Le Mediateur", 'ENFJ': "Le Protagoniste",
  'INFJ': "L'Avocat", 'ENTP': "Le Debatteur", 'INTP': "Le Logicien",
  'ENTJ': "Le Commandant", 'INTJ': "L'Architecte", 'ESFP': "L'Amuseur",
  'ISFP': "L'Aventurier", 'ESTP': "L'Entrepreneur", 'ISTP': "Le Virtuose",
  'ESFJ': "Le Consul", 'ISFJ': "Le Defenseur", 'ESTJ': "L'Executif",
  'ISTJ': "Le Logisticien"
};

const getMbtiName = (type: string | null) => type ? mbtiNames[type] || "Inconnu" : "Non defini";

// Dimensions MBTI
const mbtiDimensions: Record<string, { letter: string; name: string; desc: string }> = {
  'E': { letter: 'E', name: 'Extraverti', desc: "Tu prends de l'energie dans les echanges." },
  'I': { letter: 'I', name: 'Introverti', desc: "Tu te ressources dans la solitude et la reflexion." },
  'S': { letter: 'S', name: 'Sensoriel', desc: "Tu te bases sur les faits concrets et l'experience." },
  'N': { letter: 'N', name: 'Intuitif', desc: "Tu penses en idees et en possibilites." },
  'T': { letter: 'T', name: 'Pensee', desc: "Tu decides avec la logique et l'analyse." },
  'F': { letter: 'F', name: 'Sentiment', desc: "Tu decides avec l'impact humain en tete." },
  'J': { letter: 'J', name: 'Jugement', desc: "Tu preferes la structure et l'organisation." },
  'P': { letter: 'P', name: 'Perception', desc: "Tu preferes la flexibilite aux plans figes." }
};

const getMbtiDimension = (type: string | null, index: number) => {
  if (!type || type.length !== 4) return null;
  const letter = type[index];
  return mbtiDimensions[letter] || null;
};

export default function ProfilMbtiPage() {
  const [mbtiType, setMbtiType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMbtiType();
  }, []);

  const loadMbtiType = async () => {
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

      if (double?.mbtiType) {
        setMbtiType(double.mbtiType);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du profil MBTI:', error);
      setLoading(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Ton profil MBTI</h1>
            <p className="text-gray-600 italic">16 personnalités - résumé + forces + axes</p>
          </div>
        </motion.div>

        {/* Profil MBTI */}
        {mbtiType ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
          >
            <div className="text-center mb-8">
              <div className="mbti-badge mx-auto mb-4">
                <div className="mbti-type text-6xl">{mbtiType}</div>
                <div className="mbti-nick text-2xl">{getMbtiName(mbtiType)}</div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Tes 4 dimensions</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((index) => {
                    const dim = getMbtiDimension(mbtiType, index);
                    if (!dim) return null;
                    return (
                      <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border-2 border-gray-200">
                        <div className="text-3xl font-bold text-purple-600 mb-2">{dim.letter}</div>
                        <h3 className="font-semibold text-gray-800 mb-1">{dim.name}</h3>
                        <p className="text-sm text-gray-600">{dim.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t-2 border-gray-200">
                <p className="text-gray-600 leading-relaxed text-lg">
                  Tu es de type {mbtiType} - {getMbtiName(mbtiType)}. Découvre tes forces et tes axes d'amélioration.
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
              Complete le quiz MBTI pour decouvrir ton type de personnalite parmi les 16 types.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
