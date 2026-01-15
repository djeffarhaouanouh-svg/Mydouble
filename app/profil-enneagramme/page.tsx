"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import type { Enneagram } from "@/lib/types";

// Textes pré-définis pour chaque type d'ennéagramme
const enneagramTexts: Record<number, { defauts: string; enfance: string }> = {
  1: {
    defauts: "Les défauts typiques de ce type incluent une tendance à l'autocritique excessive, à la rigidité et au perfectionnisme. Le type 1 peut avoir du mal à se détendre et à accepter l'imperfection, chez lui comme chez les autres.",
    enfance: "Le type 1 se développe souvent dans un environnement où l'on valorise fortement les règles, la morale et le sens du devoir. L'enfant apprend tôt qu'il doit être \"sage\" et irréprochable pour être aimé et reconnu."
  },
  2: {
    defauts: "Le type 2 peut devenir dépendant du regard des autres, se sacrifier excessivement et avoir du mal à poser des limites. Il risque aussi d'attendre inconsciemment de la reconnaissance en échange de son aide.",
    enfance: "Souvent, l'enfant apprend qu'il reçoit de l'amour surtout lorsqu'il s'occupe des autres. Il développe alors une stratégie basée sur le don de soi pour se sentir indispensable et aimé."
  },
  3: {
    defauts: "Les défauts typiques de ce type incluent une tendance à se définir uniquement par la réussite, à cacher ses émotions et à rechercher la validation extérieure. Le type 3 peut perdre contact avec sa vraie identité.",
    enfance: "Le type 3 grandit souvent dans un contexte où la réussite est fortement valorisée. Il comprend très tôt qu'il est aimé pour ce qu'il accomplit, pas forcément pour ce qu'il est."
  },
  4: {
    defauts: "Le type 4 peut s'enfermer dans la comparaison, le sentiment de manque et la mélancolie. Il a parfois tendance à dramatiser ses émotions et à se sentir incompris.",
    enfance: "Souvent, l'enfant a le sentiment d'être différent ou mis à l'écart. Il développe une identité basée sur l'originalité et la profondeur émotionnelle pour donner du sens à ce sentiment de décalage."
  },
  5: {
    defauts: "Le type 5 peut devenir distant, trop dans l'analyse et éviter l'implication émotionnelle. Il a parfois du mal à demander de l'aide et à se sentir en sécurité dans la relation.",
    enfance: "L'enfant apprend souvent à se replier sur lui-même pour se protéger. Il développe l'idée que comprendre le monde est plus sûr que s'y exposer émotionnellement."
  },
  6: {
    defauts: "Le type 6 peut être envahi par le doute, l'anxiété et la méfiance. Il oscille souvent entre besoin de sécurité et peur de l'autorité.",
    enfance: "Le type 6 se développe fréquemment dans un climat d'incertitude ou d'instabilité. L'enfant apprend à anticiper les dangers et à chercher des figures rassurantes pour se sentir en sécurité."
  },
  7: {
    defauts: "Le type 7 a tendance à fuir la frustration, éviter les émotions difficiles et se disperser. Il peut avoir du mal à rester engagé quand les choses deviennent inconfortables.",
    enfance: "L'enfant apprend à se protéger de la souffrance en cherchant constamment le plaisir et la nouveauté. Il développe une stratégie basée sur l'optimisme pour ne pas ressentir le manque."
  },
  8: {
    defauts: "Le type 8 peut devenir excessivement dominant, impulsif et dans le contrôle. Il a parfois du mal à montrer sa vulnérabilité et à faire confiance.",
    enfance: "Souvent confronté tôt à l'injustice ou à la dureté, l'enfant apprend à être fort pour survivre. Il développe une posture de protection et de puissance pour ne plus jamais être vulnérable."
  },
  9: {
    defauts: "Le type 9 peut s'oublier lui-même, éviter les conflits et avoir du mal à affirmer ses besoins. Il risque de tomber dans la passivité et l'inaction.",
    enfance: "L'enfant comprend que rester calme et ne pas faire de vagues est un moyen d'obtenir la paix. Il développe une stratégie d'effacement pour maintenir l'harmonie autour de lui."
  }
};

// Fonction pour nettoyer le nom du type (supprimer les références au wing)
const cleanEnneagramName = (name: string): string => {
  if (!name) return name;
  // Supprimer les références au wing dans le nom (ex: "Le Médiateur-Perfectionniste" -> "Le Médiateur")
  return name.split('-')[0]?.trim() || name;
};

// Fonction pour nettoyer la description (supprimer les références aux ailes)
const cleanEnneagramDescription = (desc: string): string => {
  if (!desc) return desc;
  // Supprimer les références aux ailes dans le texte
  return desc
    .replace(/ton aile \d+ [^\.]+\./gi, '')
    .replace(/ton aile \d+/gi, '')
    .replace(/l'aile \d+ [^\.]+\./gi, '')
    .replace(/l'aile \d+/gi, '')
    .replace(/aile \d+ [^\.]+\./gi, '')
    .replace(/aile \d+/gi, '')
    .replace(/mais ton aile/gi, '')
    .replace(/mais l'aile/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function ProfilEnneagrammePage() {
  const [enneaProfile, setEnneaProfile] = useState<Enneagram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnneagramProfile();
  }, []);

  const loadEnneagramProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      // Vérifier si le userId est valide
      if (!userId || 
          userId.startsWith('user_') || 
          userId.startsWith('temp_') ||
          isNaN(Number(userId))) {
        setLoading(false);
        return;
      }

      // Charger le double IA avec son diagnostic
      const response = await fetch(`/api/double-ia/get?userId=${userId}`);
      
      if (response.status === 404 || !response.ok) {
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      const double = data.double;

      if (!double?.diagnostic?.enneagram) {
        setLoading(false);
        return;
      }

      const enneagram = double.diagnostic.enneagram;
      const enneagramType = typeof enneagram.type === 'string' ? parseInt(enneagram.type, 10) : Number(enneagram.type);
      
      // Remplir les champs defauts et enfance s'ils manquent
      const predefinedTexts = enneagramType && enneagramTexts[enneagramType] 
        ? enneagramTexts[enneagramType] 
        : { defauts: '', enfance: '' };
      
      const normalizedEnneagram = {
        ...enneagram,
        type: enneagramType,
        defauts: enneagram.defauts || predefinedTexts.defauts,
        enfance: enneagram.enfance || predefinedTexts.enfance,
      };
      
      setEnneaProfile(normalizedEnneagram);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du profil ennéagramme:', error);
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

  if (!enneaProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔮</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Profil Ennéagramme</h1>
          <p className="text-gray-600 mb-6">
            Tu n'as pas encore de profil ennéagramme. Crée ton double IA pour découvrir ton type de personnalité.
          </p>
          <Link 
            href="/carte"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la carte
          </Link>
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
            <div className="text-5xl mb-4">🔮</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Ton Profil Ennéagramme</h1>
            <p className="text-gray-600 italic">Découvre ton type de personnalité profond</p>
          </div>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
        >
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed text-center">
            L'ennéagramme est un système qui identifie 9 types de personnalité basés sur tes motivations profondes, tes peurs et tes compulsions inconscientes. Contrairement aux traits de surface, il révèle le "pourquoi" derrière tes comportements.
          </p>
        </motion.div>

        {/* Type d'ennéagramme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Type {enneaProfile.type} : {cleanEnneagramName(enneaProfile.name)}
            </h2>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Pourquoi ce profil te correspond</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex gap-5 items-start">
              <div className="text-4xl">🎯</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Type {enneaProfile.type} : {cleanEnneagramName(enneaProfile.name)}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {cleanEnneagramDescription(enneaProfile.desc)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Défauts du type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl shadow-2xl p-6 md:p-8 mb-6 border-2 border-red-300"
        >
          <div className="flex gap-4 items-start">
            <div className="text-3xl">⚠️</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Défauts du type {enneaProfile.type}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {enneaProfile.defauts || "Les défauts typiques de ce type d'ennéagramme incluent des tendances à se perdre dans certains comportements compulsifs. Chaque type a ses propres pièges et défis à surmonter pour atteindre un équilibre personnel."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Construction pendant l'enfance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-2xl p-6 md:p-8 mb-6 border-2 border-blue-300"
        >
          <div className="flex gap-4 items-start">
            <div className="text-3xl">🌱</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Comment se construit le type {enneaProfile.type} pendant l'enfance
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {enneaProfile.enfance || "Chaque type d'ennéagramme se développe à travers des expériences et dynamiques familiales spécifiques pendant l'enfance. Ces expériences façonnent les stratégies d'adaptation et les mécanismes de défense qui deviennent caractéristiques de chaque type."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
