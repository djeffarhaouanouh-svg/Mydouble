"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

// Signes astrologiques avec leurs dates
const zodiacSigns: Record<string, { icon: string; name: string; desc: string; range: string }> = {
  belier: { icon: '♈', name: 'Bélier', desc: 'Connu pour son énergie et sa passion, le Bélier est un leader naturel et plein d\'enthousiasme.', range: '21 mars – 19 avr' },
  taureau: { icon: '♉', name: 'Taureau', desc: 'Symbolisant la stabilité et la persévérance, le Taureau est synonyme de loyauté et de fiabilité.', range: '20 avr – 20 mai' },
  gemeaux: { icon: '♊', name: 'Gémeaux', desc: 'Curieux et adaptables, les Gémeaux sont caractérisés par une grande sociabilité et un esprit vif.', range: '21 mai – 20 juin' },
  cancer: { icon: '♋', name: 'Cancer', desc: 'Représenté par le crabe, le Cancer est associé à l\'émotion, la protection et une forte intuition.', range: '21 juin – 22 juil' },
  lion: { icon: '♌', name: 'Lion', desc: 'Le Lion évoque la grandeur, le courage et une nature royale et généreuse.', range: '23 juil – 22 août' },
  vierge: { icon: '♍', name: 'Vierge', desc: 'Détails et analyse sont les forces de la Vierge, connue pour son sens pratique et son perfectionnisme.', range: '23 août – 22 sept' },
  balance: { icon: '♎', name: 'Balance', desc: 'Symbole d\'équilibre et de justice, la Balance cherche l\'harmonie et la paix dans ses relations.', range: '23 sept – 22 oct' },
  scorpion: { icon: '♏', name: 'Scorpion', desc: 'Passion et mystère définissent le Scorpion, un signe intense et magnétique.', range: '23 oct – 21 nov' },
  sagittaire: { icon: '♐', name: 'Sagittaire', desc: 'Connu pour son amour de l\'aventure, le Sagittaire est en quête de liberté et de connaissances.', range: '22 nov – 21 déc' },
  capricorne: { icon: '♑', name: 'Capricorne', desc: 'Ambition et efficacité définissent le Capricorne, reconnu pour sa discipline et son sens du devoir.', range: '22 déc – 19 jan' },
  verseau: { icon: '♒', name: 'Verseau', desc: 'Créatif et avant-gardiste, le Verseau est associé à l\'innovation et à une vision humanitaire.', range: '20 jan – 18 fév' },
  poissons: { icon: '♓', name: 'Poissons', desc: 'Intuitif et rêveur, le Poissons est connecté aux émotions et à la spiritualité.', range: '19 fév – 20 mars' },
};

// Fonction pour calculer le signe astrologique
function getZodiacSign(month: number, day: number): string | null {
  if (!month || !day) return null;
  
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return 'capricorne';
  }
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return 'verseau';
  }
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return 'poissons';
  }
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return 'belier';
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return 'taureau';
  }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return 'gemeaux';
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return 'cancer';
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return 'lion';
  }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return 'vierge';
  }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return 'balance';
  }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return 'scorpion';
  }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return 'sagittaire';
  }
  
  return null;
}

// Fonction pour formater la date de naissance
const formatBirthDate = (month: number | null, day: number | null): string => {
  if (!month || !day) return '';
  
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                     'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  return `${day} ${monthNames[month - 1]}`;
};

export default function SigneAstrologiquePage() {
  const [sign, setSign] = useState<{ icon: string; name: string; desc: string; range: string } | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthDay, setBirthDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      if (!userId || 
          userId.startsWith('user_') || 
          userId.startsWith('temp_') ||
          isNaN(Number(userId))) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      const user = data.user || data;
      
      if (user?.birthMonth !== null && user?.birthMonth !== undefined && 
          user?.birthDay !== null && user?.birthDay !== undefined) {
        const month = Number(user.birthMonth);
        const day = Number(user.birthDay);
        setBirthMonth(month);
        setBirthDay(day);
        
        const signKey = getZodiacSign(month, day);
        const zodiacSign = signKey ? zodiacSigns[signKey] : null;
        setSign(zodiacSign);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de ton signe astrologique...</p>
        </div>
      </div>
    );
  }

  if (!sign || !birthMonth || !birthDay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Signe Astrologique</h1>
          <p className="text-gray-600 mb-6">
            Tu n'as pas encore renseigné ta date de naissance. Ajoute-la dans ton profil pour découvrir ton signe astrologique.
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
            <div 
              className="w-24 h-24 mx-auto mb-4 rounded-xl flex items-center justify-center text-5xl text-white"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                boxShadow: '0 8px 20px rgba(124,58,237,0.3), 0 4px 8px rgba(124,58,237,0.2)'
              }}
            >
              {sign.icon}
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{sign.name}</h1>
            <p className="text-gray-600">
              {formatBirthDate(birthMonth, birthDay)} • {sign.range}
            </p>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">À propos du {sign.name}</h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            {sign.desc}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
