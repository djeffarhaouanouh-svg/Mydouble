"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function ProfilEmotionnelPage() {
  const [anpsScores, setAnpsScores] = useState<{
    seeking: number;
    fear: number;
    care: number;
    play: number;
    anger: number;
    sadness: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    loadAnpsScores();
  }, []);

  const loadAnpsScores = async () => {
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

      if (double?.anpsScores) {
        setAnpsScores(double.anpsScores);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du profil ANPS:', error);
      setLoading(false);
    }
  };

  // Punchlines dynamiques pour ANPS
  const getAnpsPunchline = () => {
    if (!anpsScores) return "Complete le quiz ANPS pour decouvrir ton profil emotionnel.";
    const { seeking, care, play, anger, fear, sadness } = anpsScores;

    const scores = [
      { name: 'seeking', value: seeking },
      { name: 'care', value: care },
      { name: 'play', value: play }
    ];
    const dominant = scores.sort((a, b) => b.value - a.value)[0];

    const lowAnger = anger <= 35;
    const lowSadness = sadness <= 40;
    const lowAngerAndSadness = lowAnger && lowSadness;
    const highPlay = play >= 75;
    const lowSeeking = seeking <= 40;
    const highCare = care >= 75;
    const highSeeking = seeking >= 75;
    const lowFear = fear <= 35;
    const highFear = fear >= 55;
    const highAnger = anger >= 55;
    const highSadness = sadness >= 55;

    if (lowAngerAndSadness && highPlay) {
      return `Tu as un profil emotionnel unique ! Tu evites les tensions (colere ET tristesse faibles), mais tu deviens carrement drole et animateur dans les bons contextes.`;
    }

    if (highCare && highPlay && lowAnger) {
      return `Tu combines une grande empathie avec un esprit joueur. Tu sais prendre soin des autres tout en apportant de la legerete et de la joie autour de toi.`;
    }

    if (highSeeking && lowFear) {
      return `Tu es portee par une forte motivation exploratoire et tu n'as pas peur de te lancer. Ta curiosite te pousse a decouvrir sans te laisser freiner par l'apprehension.`;
    }

    if (highCare && lowAngerAndSadness) {
      return `Tu as une belle capacite d'empathie tout en gardant une stabilite emotionnelle. Tu prends soin des autres sans te laisser submerger par les tensions.`;
    }

    if (lowSeeking && lowAnger && lowSadness) {
      return `Tu es quelqu'un de content avec ce que tu as, pas en recherche active permanente. Tu apprecies la stabilite et sais profiter du moment present.`;
    }

    if (highFear && highCare) {
      return `Ton empathie se combine avec une vigilance naturelle. Tu prends soin des autres tout en restant attentive aux risques, ce qui fait de toi une personne protectrice.`;
    }

    if (highAnger && highSeeking) {
      return `Tu combines une forte motivation avec une capacite d'affirmation. Tu sais ce que tu veux et tu n'hesites pas a te battre pour l'obtenir.`;
    }

    if (highSadness && highCare) {
      return `Ta sensibilite emotionnelle nourrit ton empathie profonde. Tu ressens fortement les choses, ce qui te permet de vraiment comprendre les autres.`;
    }

    if (highPlay && lowSeeking) {
      return `Tu trouves ta joie dans l'instant present plutot que dans la quete perpetuelle. Tu sais t'amuser et profiter sans avoir besoin de chercher toujours plus.`;
    }

    if (dominant.name === 'play' && dominant.value >= 70) {
      const bonus = lowAnger ? " Ta faible reactivite a la colere te permet de garder cette legerete meme dans les moments tendus." : "";
      return `Le jeu et la legerete sont au coeur de ton fonctionnement emotionnel. Tu apportes naturellement de la joie et sais detendre l'atmosphere.${bonus}`;
    }

    if (dominant.name === 'care' && dominant.value >= 70) {
      const bonus = highFear ? " Ta vigilance naturelle renforce ton instinct protecteur." : "";
      return `L'empathie et le soin des autres sont centraux dans ton profil. Tu as un instinct protecteur naturel et une grande sensibilite aux besoins d'autrui.${bonus}`;
    }

    if (dominant.name === 'seeking' && dominant.value >= 70) {
      const bonus = lowFear ? " Ton faible niveau de peur te permet d'explorer sans hesitation." : "";
      return `Ta curiosite et ta motivation exploratoire te definissent. Tu es constamment en quete de nouvelles experiences et decouvertes.${bonus}`;
    }

    const stability = (anger <= 45 && fear <= 45 && sadness <= 45)
      ? " Tes systemes de vigilance (colere, peur, tristesse) sont bien regules."
      : "";
    return `Ton profil emotionnel est equilibre, avec une bonne harmonie entre exploration, attachement et jeu.${stability}`;
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
            <div className="text-5xl mb-4">💖</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Ton profil émotionnel</h1>
            <p className="text-gray-600 italic">Modèle ANPS (Affective Neuroscience)</p>
          </div>
        </motion.div>

        {/* Profil ANPS */}
        {anpsScores ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
          >
            <div className="space-y-6">
              <div className="stat" data-value={anpsScores.seeking}>
                <span className="label text-base">🔥 SEEKING</span>
                <div className="bar">
                  <div className="fill grad-orange" style={{width: `${anpsScores.seeking}%`}}></div>
                </div>
                <span className="score text-base">{anpsScores.seeking}%</span>
              </div>

              <div className="stat" data-value={anpsScores.care}>
                <span className="label text-base">💗 CARE</span>
                <div className="bar">
                  <div className="fill grad-pink" style={{width: `${anpsScores.care}%`}}></div>
                </div>
                <span className="score text-base">{anpsScores.care}%</span>
              </div>

              <div className="stat" data-value={anpsScores.play}>
                <span className="label text-base">😄 PLAY</span>
                <div className="bar">
                  <div className="fill grad-green" style={{width: `${anpsScores.play}%`}}></div>
                </div>
                <span className="score text-base">{anpsScores.play}%</span>
              </div>

              <div className="stat" data-value={anpsScores.anger}>
                <span className="label text-base">😠 ANGER</span>
                <div className="bar">
                  <div className="fill grad-yellow" style={{width: `${anpsScores.anger}%`}}></div>
                </div>
                <span className="score text-base">{anpsScores.anger}%</span>
              </div>

              <div className="stat" data-value={anpsScores.fear}>
                <span className="label text-base">😨 FEAR</span>
                <div className="bar">
                  <div className="fill grad-blue" style={{width: `${anpsScores.fear}%`}}></div>
                </div>
                <span className="score text-base">{anpsScores.fear}%</span>
              </div>

              <div className="stat" data-value={anpsScores.sadness}>
                <span className="label text-base">😢 SADNESS</span>
                <div className="bar">
                  <div className="fill grad-purple" style={{width: `${anpsScores.sadness}%`}}></div>
                </div>
                <span className="score text-base">{anpsScores.sadness}%</span>
              </div>

              <div className="pt-6 border-t-2 border-gray-200">
                <p className="punchline text-base leading-relaxed">
                  {getAnpsPunchline()}
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
              Complete le quiz ANPS pour decouvrir ton profil emotionnel.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
