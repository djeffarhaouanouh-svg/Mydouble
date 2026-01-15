"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { X, User, Mail, Lock, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Trait, Enneagram, Advice, Diagnostic } from "@/lib/types";

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
  
  // Calculer le jour de l'année (1-365)
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 0; i < month - 1; i++) {
    dayOfYear += daysInMonth[i];
  }
  
  // Dates de début de chaque signe (jour de l'année)
  // Capricorne: 22 déc (356) - 19 jan (19)
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return 'capricorne';
  }
  // Verseau: 20 jan (20) - 18 fév (49)
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return 'verseau';
  }
  // Poissons: 19 fév (50) - 20 mars (79)
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return 'poissons';
  }
  // Bélier: 21 mars (80) - 19 avr (109)
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return 'belier';
  }
  // Taureau: 20 avr (110) - 20 mai (140)
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return 'taureau';
  }
  // Gémeaux: 21 mai (141) - 20 juin (171)
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return 'gemeaux';
  }
  // Cancer: 21 juin (172) - 22 juil (203)
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return 'cancer';
  }
  // Lion: 23 juil (204) - 22 août (234)
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return 'lion';
  }
  // Vierge: 23 août (235) - 22 sept (265)
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return 'vierge';
  }
  // Balance: 23 sept (266) - 22 oct (295)
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return 'balance';
  }
  // Scorpion: 23 oct (296) - 21 nov (325)
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return 'scorpion';
  }
  // Sagittaire: 22 nov (326) - 21 déc (355)
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return 'sagittaire';
  }
  
  return null;
}

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

// Textes pour "Ton partenaire idéal" selon l'Ennéatype
const partnerIdealTexts: Record<number, { description: string; avoid: string }> = {
  1: {
    description: "Tu as besoin de quelqu'un de stable, honnête et respectueux de tes valeurs. Tu t'épanouis avec une personne qui t'aide à lâcher prise et qui te rappelle que l'amour ❤️ ne se mérite pas par la perfection, mais par l'authenticité.",
    avoid: "les personnes trop désorganisées ou qui manquent de sérieux."
  },
  2: {
    description: "Tu as besoin de quelqu'un qui reconnaît tout l'amour que tu donnes et qui sait aussi prendre soin de toi ❤️. Tu t'épanouis avec une personne attentionnée, reconnaissante et capable de t'aimer autant que tu aimes.",
    avoid: "les personnes trop froides ou qui prennent sans jamais donner."
  },
  3: {
    description: "Tu as besoin de quelqu'un qui croit en toi et soutient tes ambitions. Tu t'épanouis avec une personne qui t'encourage sans te mettre la pression, et qui t'offre un amour sincère ❤️, pas seulement basé sur la réussite.",
    avoid: "les personnes jalouses ou qui cherchent à te rabaisser."
  },
  4: {
    description: "Tu as besoin de quelqu'un qui comprend ta sensibilité et respecte ton monde intérieur. Tu t'épanouis avec une personne profonde, sincère, qui te montre que l'amour ❤️ peut être intense sans être douloureux.",
    avoid: "les personnes superficielles ou émotionnellement fermées."
  },
  5: {
    description: "Tu as besoin de quelqu'un qui respecte ton besoin d'espace tout en t'invitant doucement à t'ouvrir. Tu t'épanouis avec une personne patiente, rassurante, qui t'offre un amour calme ❤️ et sécurisant.",
    avoid: "les personnes trop envahissantes ou dépendantes."
  },
  6: {
    description: "Tu as besoin de quelqu'un de fiable, rassurant et cohérent. Tu t'épanouis avec une personne qui t'apporte sécurité émotionnelle et qui te prouve par ses actes que son amour ❤️ est sincère.",
    avoid: "les personnes imprévisibles ou instables."
  },
  7: {
    description: "Tu as besoin de quelqu'un qui partage ton goût pour la liberté et l'aventure, tout en t'aidant à t'ancrer. Tu t'épanouis avec une personne positive, curieuse, qui vit l'amour ❤️ comme une expérience joyeuse et profonde.",
    avoid: "les personnes trop rigides ou négatives."
  },
  8: {
    description: "Tu as besoin de quelqu'un de fort et sincère, qui ne te craint pas mais te respecte. Tu t'épanouis avec une personne loyale, capable de voir derrière ta carapace et d'accéder à ton vrai cœur ❤️.",
    avoid: "les personnes manipulatrices ou trop soumises."
  },
  9: {
    description: "Tu as besoin de quelqu'un qui t'aide à t'affirmer sans te brusquer. Tu t'épanouis avec une personne bienveillante, motivante, qui te montre que ton amour ❤️ compte autant que celui des autres.",
    avoid: "les personnes trop dominantes ou conflictuelles."
  }
};

export default function CartePage() {
  const [messagesCount, setMessagesCount] = useState(0);
  const [overlayCard, setOverlayCard] = useState<'traits' | 'enneagram' | 'zodiac' | 'partner' | 'bigfive' | 'anps' | 'mbti' | null>(null);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [enneaProfile, setEnneaProfile] = useState<Enneagram | null>(null);
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasDoubleIA, setHasDoubleIA] = useState(false);
  const [selectedEnneagramPoint, setSelectedEnneagramPoint] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthDay, setBirthDay] = useState<number | null>(null);
  const [userFirstName, setUserFirstName] = useState<string>('');

  // State pour les profils psychologiques
  const [bigFiveScores, setBigFiveScores] = useState<{
    ouverture: number;
    conscienciosite: number;
    extraversion: number;
    agreabilite: number;
    sensibilite: number;
  } | null>(null);

  const [anpsScores, setAnpsScores] = useState<{
    seeking: number;
    fear: number;
    care: number;
    play: number;
    anger: number;
    sadness: number;
  } | null>(null);

  const [mbtiType, setMbtiType] = useState<string | null>(null);

  const [showInscription, setShowInscription] = useState(true); // Bloquer par défaut jusqu'à vérification

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

  // Génère un summary basé sur tous les traits dominants
  const generateTraitsSummary = (traitsList: { name: string; score: number }[]): string => {
    if (!traitsList || traitsList.length === 0) return "";

    // Trier par score décroissant
    const sortedTraits = [...traitsList].sort((a, b) => b.score - a.score);
    const allTraits = sortedTraits.map(t => t.name.toLowerCase());

    // Construire le texte avec tous les traits
    if (allTraits.length >= 4) {
      const firstTwo = allTraits.slice(0, 2).join(" et ");
      const rest = allTraits.slice(2).join(", ");
      return `Un profil ${firstTwo}, avec une belle dose de ${rest}.`;
    } else if (allTraits.length >= 2) {
      return `Un profil ${allTraits.join(" et ")}.`;
    }
    return `Un profil ${allTraits[0]} avec une personnalité riche et nuancée.`;
  };

  // Punchlines dynamiques pour Big Five (modèle OCEAN)
  const getBigFivePunchline = () => {
    if (!bigFiveScores) return "Complete le quiz Big Five pour decouvrir ton profil de personnalite.";
    const { ouverture, conscienciosite, extraversion, agreabilite, sensibilite } = bigFiveScores;

    // Analyse des dimensions principales
    const dominated = [];
    const insights = [];

    // Ouverture à l'expérience
    if (ouverture >= 75) {
      dominated.push("curieuse et ouverte aux nouvelles experiences");
      insights.push("Ta grande ouverture d'esprit te pousse vers la creativite et l'exploration intellectuelle.");
    } else if (ouverture >= 60) {
      insights.push("Tu sais equilibrer tradition et nouveaute dans ta vie.");
    } else if (ouverture < 40) {
      insights.push("Tu privilegies le concret et les approches eprouvees.");
    }

    // Conscienciosité
    if (conscienciosite >= 75) {
      dominated.push("organisee et fiable");
      insights.push("Ton sens de l'organisation et ta discipline sont des atouts majeurs.");
    } else if (conscienciosite >= 60) {
      insights.push("Tu trouves un bon equilibre entre structure et flexibilite.");
    } else if (conscienciosite < 40) {
      insights.push("Tu preferes la spontaneite aux planifications rigides.");
    }

    // Extraversion
    if (extraversion >= 75) {
      dominated.push("sociable et energique");
      insights.push("Les interactions sociales te ressourcent et te motivent.");
    } else if (extraversion >= 60) {
      insights.push("Tu apprecies autant les moments sociaux que les temps calmes.");
    } else if (extraversion < 40) {
      dominated.push("introvertie et reflechie");
      insights.push("Tu te ressources dans la solitude et la reflexion profonde.");
    }

    // Agréabilité
    if (agreabilite >= 75) {
      dominated.push("empathique et cooperative");
      insights.push("Ton empathie naturelle facilite tes relations et inspire confiance.");
    } else if (agreabilite >= 60) {
      insights.push("Tu sais cooperer tout en preservant tes interets.");
    } else if (agreabilite < 40) {
      insights.push("Tu privilegies l'objectivite et l'esprit critique dans tes jugements.");
    }

    // Sensibilité émotionnelle (Névrosisme inversé)
    if (sensibilite >= 70) {
      insights.push("Ta sensibilite emotionnelle te rend receptive aux nuances de ton environnement.");
    } else if (sensibilite >= 50) {
      insights.push("Tu geres bien tes emotions tout en restant connectee a tes ressentis.");
    } else if (sensibilite < 35) {
      dominated.push("stable emotionnellement");
      insights.push("Ta stabilite emotionnelle te permet de rester sereine face aux defis.");
    }

    // Construction du texte final
    if (dominated.length === 0) {
      return "Ton profil est harmonieusement equilibre, sans extreme marque. " + (insights[0] || "");
    }

    const mainTraits = dominated.slice(0, 2).join(" et ");
    const mainInsight = insights[0] || "";

    return `Tu es une personne ${mainTraits}. ${mainInsight}`;
  };

  // Punchlines dynamiques pour ANPS (Affective Neuroscience - Jaak Panksepp)
  const getAnpsPunchline = () => {
    if (!anpsScores) return "Complete le quiz ANPS pour decouvrir ton profil emotionnel.";
    const { seeking, care, play, anger, fear, sadness } = anpsScores;

    // Trouver le trait dominant (le plus haut parmi les positifs)
    const scores = [
      { name: 'seeking', value: seeking },
      { name: 'care', value: care },
      { name: 'play', value: play }
    ];
    const dominant = scores.sort((a, b) => b.value - a.value)[0];

    // Analyse des combinaisons de traits
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

    // Profils combinés (ordre de priorité)
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

    // Analyse basée sur le trait dominant
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

    // Profil équilibré
    const stability = (anger <= 45 && fear <= 45 && sadness <= 45)
      ? " Tes systemes de vigilance (colere, peur, tristesse) sont bien regules."
      : "";
    return `Ton profil emotionnel est equilibre, avec une bonne harmonie entre exploration, attachement et jeu.${stability}`;
  };

  // Fonction pour obtenir le contenu du partenaire idéal selon l'Ennéatype
  const getPartnerIdealContent = () => {
    if (!enneaProfile || !enneaProfile.type) {
      return {
        description: "Tu as besoin de quelqu'un qui te donne beaucoup d'amour et qui te comprend vraiment. Avec ta personnalité entreprenante, tu t'épanouis davantage avec une personne qui te soutient dans tes projets et qui croit en toi.",
        avoid: "certaines énergies peuvent être plus difficiles pour toi, notamment les Bélier et les Poissons."
      };
    }
    const enneagramType = typeof enneaProfile.type === 'string' ? parseInt(enneaProfile.type, 10) : Number(enneaProfile.type);
    return partnerIdealTexts[enneagramType] || {
      description: "Tu as besoin de quelqu'un qui te donne beaucoup d'amour et qui te comprend vraiment. Avec ta personnalité entreprenante, tu t'épanouis davantage avec une personne qui te soutient dans tes projets et qui croit en toi.",
      avoid: "certaines énergies peuvent être plus difficiles pour toi, notamment les Bélier et les Poissons."
    };
  };

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

  useEffect(() => {
    loadUserProfile();
    loadDiagnostic();
    loadMessagesCount();
    
    // Recharger le diagnostic toutes les 30 secondes pour voir les mises à jour
    const interval = setInterval(() => {
      loadDiagnostic();
      loadMessagesCount();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  const loadUserProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      if (!userId || 
          userId.startsWith('user_') || 
          userId.startsWith('temp_') ||
          isNaN(Number(userId))) {
        return;
      }

      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const user = data.user || data;
      
      if (user?.name) {
        // Extraire le prénom (premier mot du nom complet)
        const firstName = user.name.split(' ')[0];
        setUserFirstName(firstName);
      }
      
      // Charger la date de naissance
      if (user?.birthMonth !== null && user?.birthMonth !== undefined && 
          user?.birthDay !== null && user?.birthDay !== undefined) {
        setBirthMonth(Number(user.birthMonth));
        setBirthDay(Number(user.birthDay));
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  // Fonction pour formater la date de naissance
  const formatBirthDate = (month: number | null, day: number | null): string => {
    if (!month || !day) return '';
    
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                       'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    
    return `${day} ${monthNames[month - 1]}`;
  };

  const loadDiagnostic = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      // Vérifier si le userId est valide (doit être un nombre, pas user_ ou temp_)
      if (!userId || 
          userId.startsWith('user_') || 
          userId.startsWith('temp_') ||
          isNaN(Number(userId))) {
        setShowInscription(true);
        setLoading(false);
        return;
      }

      // Utilisateur connecté avec un compte valide, autoriser l'accès
      setShowInscription(false);

      // Charger le double IA avec son diagnostic
      const response = await fetch(`/api/double-ia/get?userId=${userId}`);
      
      if (response.status === 404) {
        // Pas de double IA créé - réinitialiser tout à vide
        setHasDoubleIA(false);
        setTraits([]);
        setEnneaProfile(null);
        setAdvice([]);
        setSummary("");
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }
      
      const data = await response.json();
      const double = data.double;

      if (!double) {
        // Pas de double IA
        setHasDoubleIA(false);
        setTraits([]);
        setEnneaProfile(null);
        setAdvice([]);
        setSummary("");
        setLoading(false);
        return;
      }

      setHasDoubleIA(true);

      // Charger les scores des quiz
      if (double.bigFiveScores) {
        setBigFiveScores(double.bigFiveScores);
      } else {
        setBigFiveScores(null);
      }
      if (double.anpsScores) {
        setAnpsScores(double.anpsScores);
      } else {
        setAnpsScores(null);
      }
      if (double.mbtiType) {
        setMbtiType(double.mbtiType);
      } else {
        setMbtiType(null);
      }

      // Couleurs pour les traits dominants (rotation cyclique)
      const traitColors = [
        { gradient: 'grad-blue', colorClass: 'text-blue-600' },
        { gradient: 'grad-pink', colorClass: 'text-pink-500' },
        { gradient: 'grad-orange', colorClass: 'text-orange-500' },
        { gradient: 'grad-green', colorClass: 'text-green-500' },
        { gradient: 'grad-purple', colorClass: 'text-purple-500' },
        { gradient: 'grad-yellow', colorClass: 'text-yellow-600' },
      ];

      // Charger les traits dominants - prioriser traitsDominants (mis à jour par refresh-profile)
      if (double.traitsDominants && Array.isArray(double.traitsDominants) && double.traitsDominants.length > 0) {
        // Convertir le format {trait, score} vers {name, score, gradient, colorClass}
        const formattedTraits = double.traitsDominants.map((t: { trait: string; score: number }, index: number) => ({
          name: t.trait,
          score: t.score,
          gradient: traitColors[index % traitColors.length].gradient,
          colorClass: traitColors[index % traitColors.length].colorClass,
        }));
        setTraits(formattedTraits);
        // Générer un summary basé sur les traits actuels
        setSummary(generateTraitsSummary(double.traitsDominants.map((t: { trait: string; score: number }) => ({ name: t.trait, score: t.score }))));
      } else if (double?.diagnostic) {
        const diagnostic = double.diagnostic as Diagnostic;
        if (diagnostic.traits && diagnostic.traits.length > 0) {
          setTraits(diagnostic.traits);
        } else {
          setTraits([]);
        }
      } else {
        setTraits([]);
      }

      if (double?.diagnostic) {
        const diagnostic = double.diagnostic as Diagnostic;
        if (diagnostic.enneagram) {
          // S'assurer que type est un nombre
          const enneagram = diagnostic.enneagram;
          const enneagramType = typeof enneagram.type === 'string' ? parseInt(enneagram.type, 10) : Number(enneagram.type);
          
          // Remplir les champs defauts et enfance s'ils manquent, en utilisant les textes pré-définis
          const predefinedTexts = enneagramType && enneagramTexts[enneagramType] 
            ? enneagramTexts[enneagramType] 
            : { defauts: '', enfance: '' };
          
          const normalizedEnneagram = {
            ...enneagram,
            type: enneagramType,
            defauts: enneagram.defauts || predefinedTexts.defauts,
            enfance: enneagram.enfance || predefinedTexts.enfance,
          };
          console.log('[CARTE] Ennéagramme chargé:', normalizedEnneagram);
          console.log('[CARTE] Type:', normalizedEnneagram.type, 'Type:', typeof normalizedEnneagram.type);
          setEnneaProfile(normalizedEnneagram);
        } else {
          setEnneaProfile(null);
        }
        if (diagnostic.advice && diagnostic.advice.length > 0) {
          setAdvice(diagnostic.advice);
        } else {
          setAdvice([]);
        }
        if (diagnostic.summary) {
          setSummary(diagnostic.summary);
        } else {
          setSummary("");
        }
      } else {
        // Double IA existe mais pas encore de diagnostic (pas de messages)
        // Note: les traits sont déjà gérés plus haut avec traitsDominants
        setEnneaProfile(null);
        setAdvice([]);
        setSummary("");
      }
    } catch (error) {
      console.error('Erreur lors du chargement du diagnostic:', error);
      // Réinitialiser à vide en cas d'erreur
      setHasDoubleIA(false);
      setTraits([]);
      setEnneaProfile(null);
      setAdvice([]);
      setSummary("");
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesCount = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return;
      }

      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      const user = data.user || data;
      setMessagesCount(user?.messagesCount || 0);
      
      // Charger la date de naissance
      if (user?.birthMonth !== null && user?.birthMonth !== undefined && 
          user?.birthDay !== null && user?.birthDay !== undefined) {
        setBirthMonth(Number(user.birthMonth));
        setBirthDay(Number(user.birthDay));
        console.log('Date de naissance chargée:', { month: user.birthMonth, day: user.birthDay });
      } else {
        console.log('Date de naissance non trouvée dans le profil:', user);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const statRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayStatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bigFiveOverlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const anpsOverlayRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Effet pour fermer la bulle en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedEnneagramPoint) {
        const target = event.target as HTMLElement;
        // Ne pas fermer si on clique sur un cercle de l'ennéagramme
        if (!target.closest('.ennea-circle') && !target.closest('.absolute.bg-white.rounded-xl')) {
          setSelectedEnneagramPoint(null);
        }
      }
    };

    if (selectedEnneagramPoint) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedEnneagramPoint]);

  // Fermer la bulle quand l'overlay se ferme
  useEffect(() => {
    if (!overlayCard) {
      setSelectedEnneagramPoint(null);
    }
  }, [overlayCard]);

  // Fonction pour nettoyer les descriptions des références aux ailes
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

  // Fonction pour nettoyer le nom du type (supprimer les références au wing)
  const cleanEnneagramName = (name: string): string => {
    if (!name) return name;
    // Supprimer les références au wing dans le nom (ex: "Le Médiateur-Perfectionniste" -> "Le Médiateur")
    return name.split('-')[0]?.trim() || name;
  };

  // Fonction pour obtenir la couleur d'un type d'ennéagramme
  const getEnneagramTypeColor = (type: number): string => {
    const colors: Record<number, string> = {
      1: '#f56565',
      2: '#ed8936',
      3: '#ffa834',
      4: '#f6d365',
      5: '#d946ef',
      6: '#06b6d4',
      7: '#10b981',
      8: '#3b82f6',
      9: '#8b5cf6'
    };
    return colors[type] || '#667eea';
  };

  // Fonction pour obtenir les informations d'un type d'ennéagramme
  const getEnneagramTypeInfo = (type: number) => {
    const types: Record<number, { name: string; description: string }> = {
      1: {
        name: "Le Perfectionniste",
        description: "Les personnes de type 1 sont idéalistes, rationnelles, organisées et perfectionnistes. Elles cherchent à améliorer le monde et ont un fort sens du bien et du mal."
      },
      2: {
        name: "L'Aidant",
        description: "Les personnes de type 2 sont chaleureuses, généreuses et attentionnées. Elles aiment aider les autres et ont besoin de se sentir appréciées et aimées."
      },
      3: {
        name: "Le Battant",
        description: "Les personnes de type 3 sont ambitieuses, compétitives et orientées vers le succès. Elles sont motivées par l'accomplissement et veulent être admirées."
      },
      4: {
        name: "L'Individualiste",
        description: "Les personnes de type 4 sont créatives, expressives et émotionnelles. Elles cherchent à être uniques et authentiques, et sont souvent introspectives."
      },
      5: {
        name: "L'Investigateur",
        description: "Les personnes de type 5 sont analytiques, indépendantes et intellectuelles. Elles aiment comprendre le monde et ont besoin de temps seul pour réfléchir."
      },
      6: {
        name: "Le Loyaliste",
        description: "Les personnes de type 6 sont loyales, responsables et anxieuses. Elles cherchent la sécurité et le soutien, et peuvent être très dévouées à leur groupe."
      },
      7: {
        name: "L'Enthousiaste",
        description: "Les personnes de type 7 sont spontanées, optimistes et aventureuses. Elles aiment explorer de nouvelles possibilités et éviter la douleur ou l'ennui."
      },
      8: {
        name: "Le Challenger",
        description: "Les personnes de type 8 sont confiantes, assertives et protectrices. Elles sont des leaders naturels qui aiment prendre le contrôle et défendre les faibles."
      },
      9: {
        name: "Le Pacificateur",
        description: "Les personnes de type 9 sont paisibles, accommodantes et réceptives. Elles cherchent l'harmonie et évitent les conflits, préférant la stabilité."
      }
    };
    return types[type] || { name: "Type inconnu", description: "Information non disponible" };
  };

  // Fonction pour obtenir la position d'un point de l'ennéagramme (en pourcentage)
  const getEnneagramPointPosition = (type: number) => {
    // Coordonnées dans le viewBox 400x400
    const positions: Record<number, { x: number; y: number; anchor: 'left' | 'right' | 'top' | 'bottom' }> = {
      9: { x: 200, y: 50, anchor: 'bottom' },   // En haut
      1: { x: 329.9, y: 79.5, anchor: 'left' }, // En haut à droite
      2: { x: 350, y: 200, anchor: 'left' },     // À droite
      3: { x: 329.9, y: 320.5, anchor: 'left' }, // En bas à droite
      4: { x: 260, y: 360, anchor: 'top' },     // En bas à droite
      5: { x: 140, y: 360, anchor: 'top' },      // En bas à gauche
      6: { x: 70.1, y: 320.5, anchor: 'right' }, // En bas à gauche
      7: { x: 50, y: 200, anchor: 'right' },     // À gauche
      8: { x: 70.1, y: 79.5, anchor: 'right' }  // En haut à gauche
    };
    return positions[type] || { x: 200, y: 200, anchor: 'bottom' };
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const statElement = entry.target as HTMLElement;
            const value = statElement.dataset.value;
            const bar = statElement.querySelector(".fill") as HTMLElement;
            const score = statElement.querySelector(".score") as HTMLElement;

            if (bar && value) {
              // Animation fluide de la barre
              bar.style.transition = "width 0.8s ease-out";
              bar.style.width = value + "%";
            }

            if (score) {
              score.classList.add("score-animate");
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Utiliser setTimeout pour s'assurer que les refs sont attachées
    const timeoutId = setTimeout(() => {
      statRefs.current.forEach((ref) => {
        if (ref) {
          observer.observe(ref);
          // Toujours déclencher l'animation après un court délai
          const value = ref.dataset.value;
          const bar = ref.querySelector(".fill") as HTMLElement;
          if (bar && value) {
            // S'assurer que la barre commence à 0%
            bar.style.width = "0%";
            // Forcer un reflow pour que l'animation fonctionne
            void bar.offsetWidth;
            // Déclencher l'animation
            setTimeout(() => {
              bar.style.transition = "width 1.2s cubic-bezier(.22,1,.36,1)";
              bar.style.width = value + "%";
            }, 200);
          }
        }
      });
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      statRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, [traits, loading]);

  // Effet pour animer les stats dans l'overlay
  useEffect(() => {
    const animateStats = (refs: { current: (HTMLDivElement | null)[] }) => {
      let animationApplied = false;
      
      const applyStyles = () => {
        if (animationApplied) return;
        animationApplied = true;
        
        refs.current.forEach((ref) => {
          if (ref) {
            const value = ref.dataset.value;
            const bar = ref.querySelector(".fill") as HTMLElement;
            const score = ref.querySelector(".score") as HTMLElement;

            if (bar && value) {
              bar.style.width = "0%";
              bar.style.transition = "none";
              void bar.offsetWidth;
              requestAnimationFrame(() => {
                bar.style.transition = "width 1.2s cubic-bezier(.22,1,.36,1)";
                bar.style.width = value + "%";
                bar.style.display = "block";
                bar.style.opacity = "1";
              });
            }

            if (score) {
              score.classList.add("score-animate");
            }
          }
        });
      };

      requestAnimationFrame(() => {
        setTimeout(applyStyles, 100);
      });
    };

    const resetStats = (refs: { current: (HTMLDivElement | null)[] }) => {
      refs.current.forEach((ref) => {
        if (ref) {
          const bar = ref.querySelector(".fill") as HTMLElement;
          if (bar) {
            bar.style.width = "0%";
            bar.style.transition = "none";
          }
        }
      });
    };

    if (overlayCard === 'traits') {
      animateStats(overlayStatRefs);
    } else if (overlayCard === 'bigfive') {
      animateStats(bigFiveOverlayRefs);
    } else if (overlayCard === 'anps') {
      animateStats(anpsOverlayRefs);
    } else {
      resetStats(overlayStatRefs);
      resetStats(bigFiveOverlayRefs);
      resetStats(anpsOverlayRefs);
    }
  }, [overlayCard]);

  // Composant formulaire d'inscription
  const InscriptionForm = ({ redirectTo, onSuccess }: { redirectTo: string; onSuccess: () => void }) => {
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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Une erreur est survenue');
        }

        if (data.userId) {
          localStorage.setItem('userId', data.userId.toString());
        }

        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {isLogin ? 'Connexion' : 'Inscription'}
              </h1>
              <p className="text-gray-600">
                {isLogin 
                  ? 'Connecte-toi pour voir ta carte de personnalité' 
                  : 'Crée ton compte pour découvrir ta carte de personnalité'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>
              )}

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
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                className="text-sm text-[#e31fc1] hover:underline"
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
  };

  if (showInscription) {
    return <InscriptionForm redirectTo="/carte" onSuccess={() => {
      setShowInscription(false);
      loadDiagnostic();
      loadMessagesCount();
    }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#e31fc1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de ta carte...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'a pas encore créé de double IA ou n'a pas de diagnostic
  if (!hasDoubleIA || traits.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 text-gray-900 pt-12 pb-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center"
          >
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] rounded-full flex items-center justify-center">
                <span className="text-4xl">🎯</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                Crée ton Double IA
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                {!hasDoubleIA 
                  ? "Tu n'as pas encore créé ton double IA. Pour voir ta carte de personnalité unique, commence par créer ton double en 3 étapes simples !"
                  : "Continue à parler avec ton double IA pour générer ta carte de personnalité. Plus tu échanges de messages, plus ta carte sera précise !"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!hasDoubleIA && (
                <Link
                  href="/onboarding-ia"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                >
                  <span>Créer mon Double IA</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link
                href="/messages"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-[#e31fc1] text-[#e31fc1] font-semibold rounded-xl hover:bg-purple-50 transition-colors"
              >
                <span>{!hasDoubleIA ? "Voir les messages" : "Parler avec mon Double IA"}</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 text-gray-900 pt-12 pb-24">
      <div className="max-w-6xl mx-auto px-2 md:px-6">
        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:bg-white md:rounded-3xl md:shadow-2xl md:p-5 md:p-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold mb-2 text-black"
            >
              Bonjour{" "}
              {userFirstName ? (
                <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                  {userFirstName}
                </span>
              ) : (
                "Personnalité Unique"
              )}
            </motion.h1>
            <div className="max-w-xs md:max-w-md mx-auto mt-6 md:mt-2">
              <div className="w-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 max-w-[90%] h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(Math.min((messagesCount / 100) * 100, 80), 5)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"
                    />
                  </div>
                  <span className="text-pink-600 font-semibold text-sm whitespace-nowrap">
                    {Math.max(5, Math.min(Math.round((messagesCount / 100) * 100), 80))}%
                  </span>
                </div>
                <p className="text-red-600 text-xs text-center">
                  Continue à parler avec ton double, pour plus de précision !
                </p>
              </div>
            </div>
          </div>

          {/* Mobile: Cards side by side, Desktop: side by side */}
          <div className="mt-12 md:mt-16 mb-6 md:mb-6 px-2 md:px-0">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-8 items-stretch mx-auto md:mx-auto" style={{ maxWidth: 'fit-content' }}>
              {/* Stats Card - Compact on mobile */}
              <div className="relative h-full flex flex-col">
                <div 
                  className="stats-card md:h-auto h-full flex flex-col flex-1 !my-0 md:!my-[30px] cursor-pointer !p-6 md:!p-[24px] !max-w-none"
                  onClick={() => setOverlayCard('traits')}
                  style={{ maxWidth: 'none', width: '100%' }}
                >
                  <h2 className="title text-sm md:text-xl font-bold md:justify-center">
                    🏆 Traits dominants
                  </h2>

                  {traits.map((trait, index) => (
                    <div
                      key={trait.name}
                      className="stat"
                      data-value={trait.score}
                      ref={(el) => {
                        statRefs.current[index] = el;
                      }}
                    >
                      <span className="label text-sm md:text-base">{trait.name}</span>
                      <div className="bar">
                        <div className={`fill ${trait.gradient}`}></div>
                      </div>
                      <span className={`score ${trait.colorClass} text-sm md:text-base`}>{trait.score}%</span>
                    </div>
                  ))}

                  <p className="punchline text-xs md:text-sm hidden md:block">
                    {summary}
                  </p>
                </div>
              </div>

              {/* Enneagram Section */}
              {enneaProfile && (
              <div className="relative h-full flex flex-col">
                <div 
                  className="stats-card md:h-auto h-full flex flex-col flex-1 !my-0 md:!my-[30px] cursor-pointer !p-3 md:!p-[18px] hidden md:flex items-center justify-center !mx-0"
                  onClick={() => setOverlayCard('enneagram')}
                  style={{
                    background: `linear-gradient(135deg, ${getEnneagramTypeColor(enneaProfile.type)}80 0%, ${getEnneagramTypeColor(enneaProfile.type)}70 30%, ${getEnneagramTypeColor(enneaProfile.type)}60 60%, ${getEnneagramTypeColor(enneaProfile.type)}60 100%)`,
                    boxShadow: `0 20px 40px rgba(0,0,0,.08), 0 8px 16px rgba(0,0,0,.06), 0 0 0 1px rgba(255,255,255,.6) inset`
                  }}
                >
                  <div 
                    className="text-9xl font-bold"
                    style={{ color: getEnneagramTypeColor(enneaProfile.type) }}
                  >
                    {enneaProfile.type}
                  </div>
                </div>
                {/* Mobile: Compact view */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setOverlayCard('enneagram')}
                  className="block md:hidden w-full h-full rounded-[18px] px-3 pt-4 pb-2 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${getEnneagramTypeColor(enneaProfile.type)}80 0%, ${getEnneagramTypeColor(enneaProfile.type)}70 30%, ${getEnneagramTypeColor(enneaProfile.type)}60 60%, ${getEnneagramTypeColor(enneaProfile.type)}60 100%)`,
                    boxShadow: `0 16px 32px ${getEnneagramTypeColor(enneaProfile.type)}35, 0 6px 12px ${getEnneagramTypeColor(enneaProfile.type)}25, inset 0 1px 0 rgba(255,255,255,0.6)`,
                    minHeight: '150px'
                  }}
                >
                  <div 
                    className="text-7xl font-bold"
                    style={{ color: getEnneagramTypeColor(enneaProfile.type) }}
                  >
                    {enneaProfile.type}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>

          {/* Signe astrologique */}
          {(() => {
            // Debug
            console.log('Affichage carte astro - birthMonth:', birthMonth, 'birthDay:', birthDay);
            
            if (!birthMonth || !birthDay) {
              return null;
            }
            
            const signKey = getZodiacSign(birthMonth, birthDay);
            const sign = signKey ? zodiacSigns[signKey] : null;
            
            if (!sign) {
              console.log('Signe astrologique non trouvé pour:', { month: birthMonth, day: birthDay, signKey });
              return null;
            }
            
            return (
              <div className="flex justify-between items-start gap-3 md:justify-center md:items-stretch md:gap-8 mt-6 md:mt-8 mb-6 px-2 md:px-0 md:ml-[10%]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setOverlayCard('zodiac')}
                  className="flex-1 md:flex-none md:w-full md:max-w-[240px] rounded-[18px] px-3 pt-4 pb-2 md:px-5 md:pt-5 md:pb-5 cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #f7e8ff, #f3f6ff)',
                    boxShadow: '0 16px 32px rgba(0,0,0,0.08), 0 6px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  <div 
                    className="w-[40px] h-[40px] md:w-[56px] md:h-[56px] rounded-xl mx-auto flex items-center justify-center text-[24px] md:text-[32px] text-white mb-2 md:mb-2.5"
                    style={{
                      background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                      boxShadow: '0 8px 20px rgba(124,58,237,0.3), 0 4px 8px rgba(124,58,237,0.2)'
                    }}
                  >
                    {sign.icon}
                  </div>
                  <div className="mt-2 md:mt-2.5 font-semibold text-gray-900 text-[13px] md:text-[15px] text-center">
                    {sign.name}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-1.5 leading-relaxed text-center">
                    {birthMonth && birthDay ? formatBirthDate(birthMonth, birthDay) : sign.range}
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1.5 md:mt-2 leading-relaxed text-center" style={{ lineHeight: '1.5' }}>
                    {sign.desc}
                  </p>
                </motion.div>
                <div className="partner-card-responsive cursor-pointer md:!w-[280px]" onClick={() => setOverlayCard('partner')}>
                  <div className="icon">👫</div>
                  <h3>Ton partenaire idéal</h3>
                  <p>
                    {getPartnerIdealContent().description}
                  </p>
                  <p className="avoid">
                    <strong>À éviter :</strong> {getPartnerIdealContent().avoid}
                  </p>
                </div>
              </div>
            );
          })()}

        {/* Section 2: Ton Profil Ennéagramme */}
        {enneaProfile && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 mb-0"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-xl p-4 shadow-md border border-purple-100">
            <div className="flex items-center gap-3">
              {/* Icône */}
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400/20 blur-xl rounded-full"></div>
                <div className="relative text-2xl">🔮</div>
              </div>
              
              {/* Texte */}
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-800">
                  Ton Profil Ennéagramme
                </h2>
              </div>
              
              {/* Bouton */}
              <Link href="/profil-enneagramme">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Voir détails
                </motion.button>
              </Link>
            </div>
            
            {/* Ligne décorative en bas */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"></div>
          </div>
        </motion.div>
        )}

        {/* Section Astro */}
        {(() => {
          if (!birthMonth || !birthDay) {
            return null;
          }
          
          const signKey = getZodiacSign(birthMonth, birthDay);
          const sign = signKey ? zodiacSigns[signKey] : null;
          
          if (!sign) {
            return null;
          }
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-3 mb-0"
            >
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-xl p-4 shadow-md border border-purple-100">
                <div className="flex items-center gap-3">
                  {/* Icône */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-400/20 blur-xl rounded-full"></div>
                    <div className="relative text-2xl">{sign.icon}</div>
                  </div>
                  
                  {/* Texte */}
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-gray-800">
                      Mon Signe Astrologique
                    </h2>
                  </div>
                  
                  {/* Bouton */}
                  <Link href="/signe-astrologique">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      Voir détails
                    </motion.button>
                  </Link>
                </div>
                
                {/* Ligne décorative en bas */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"></div>
              </div>
            </motion.div>
          );
        })()}

        {/* Section 3: Conseils Personnalisés */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 mb-8"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-xl p-4 shadow-md border border-purple-100">
            <div className="flex items-center gap-3">
              {/* Icône */}
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400/20 blur-xl rounded-full"></div>
                <div className="relative text-2xl">🎯</div>
              </div>
              
              {/* Texte */}
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-800">
                  Conseils personnalisés
                </h2>
              </div>
              
              {/* Bouton */}
              <Link href="/conseils-personnalises">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Voir détails
                </motion.button>
              </Link>
            </div>
            
            {/* Ligne décorative en bas */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"></div>
          </div>
        </motion.div>

      {/* Big Five and ANPS Cards */}
      <div className="mt-12 md:mt-16 mb-6 md:mb-6 px-2 md:px-0">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-8 items-stretch">
          {/* BIG FIVE CARD */}
          <div className="relative h-full flex flex-col">
            <div
              className="stats-card md:h-auto h-full flex flex-col flex-1 !my-0 md:!my-[30px] cursor-pointer !p-3 md:!p-[18px]"
              onClick={() => setOverlayCard('bigfive')}
            >
              <h2 className="title text-base md:text-xl font-bold md:justify-center">
                🧠 Ton profil de personnalite
              </h2>

              <div className="stat" data-value={bigFiveScores?.ouverture ?? 50}>
                <span className="label text-sm md:text-base">🌟 Ouverture</span>
                <div className="bar">
                  <div className="fill grad-purple" style={{width: `${bigFiveScores?.ouverture ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{bigFiveScores?.ouverture ?? 50}%</span>
              </div>

              <div className="stat" data-value={bigFiveScores?.conscienciosite ?? 50}>
                <span className="label text-sm md:text-base">🧩 Conscienciosite</span>
                <div className="bar">
                  <div className="fill grad-blue" style={{width: `${bigFiveScores?.conscienciosite ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{bigFiveScores?.conscienciosite ?? 50}%</span>
              </div>

              <div className="stat" data-value={bigFiveScores?.extraversion ?? 50}>
                <span className="label text-sm md:text-base">💬 Extraversion</span>
                <div className="bar">
                  <div className="fill grad-pink" style={{width: `${bigFiveScores?.extraversion ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{bigFiveScores?.extraversion ?? 50}%</span>
              </div>

              <div className="stat" data-value={bigFiveScores?.agreabilite ?? 50}>
                <span className="label text-sm md:text-base">🤝 Agreabilite</span>
                <div className="bar">
                  <div className="fill grad-green" style={{width: `${bigFiveScores?.agreabilite ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{bigFiveScores?.agreabilite ?? 50}%</span>
              </div>

              <div className="stat" data-value={bigFiveScores?.sensibilite ?? 50}>
                <span className="label text-sm md:text-base">🌊 Sensibilite emotionnelle</span>
                <div className="bar">
                  <div className="fill grad-yellow" style={{width: `${bigFiveScores?.sensibilite ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{bigFiveScores?.sensibilite ?? 50}%</span>
              </div>

              <p className="punchline text-xs md:text-sm">
                {getBigFivePunchline()}
              </p>
            </div>
          </div>

          {/* ANPS CARD */}
          <div className="relative h-full flex flex-col">
            <div
              className="stats-card md:h-auto h-full flex flex-col flex-1 !my-0 md:!my-[30px] cursor-pointer !p-3 md:!p-[18px]"
              onClick={() => setOverlayCard('anps')}
            >
              <h2 className="title text-base md:text-xl font-bold md:justify-center">
                💖 Ton profil emotionnel
              </h2>

              <div className="stat" data-value={anpsScores?.seeking ?? 50}>
                <span className="label text-sm md:text-base">🔥 SEEKING</span>
                <div className="bar">
                  <div className="fill grad-orange" style={{width: `${anpsScores?.seeking ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{anpsScores?.seeking ?? 50}%</span>
              </div>

              <div className="stat" data-value={anpsScores?.care ?? 50}>
                <span className="label text-sm md:text-base">💗 CARE</span>
                <div className="bar">
                  <div className="fill grad-pink" style={{width: `${anpsScores?.care ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{anpsScores?.care ?? 50}%</span>
              </div>

              <div className="stat" data-value={anpsScores?.play ?? 50}>
                <span className="label text-sm md:text-base">😄 PLAY</span>
                <div className="bar">
                  <div className="fill grad-green" style={{width: `${anpsScores?.play ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{anpsScores?.play ?? 50}%</span>
              </div>

              <div className="stat" data-value={anpsScores?.anger ?? 50}>
                <span className="label text-sm md:text-base">😠 ANGER</span>
                <div className="bar">
                  <div className="fill grad-yellow" style={{width: `${anpsScores?.anger ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{anpsScores?.anger ?? 50}%</span>
              </div>

              <div className="stat" data-value={anpsScores?.fear ?? 50}>
                <span className="label text-sm md:text-base">😨 FEAR</span>
                <div className="bar">
                  <div className="fill grad-blue" style={{width: `${anpsScores?.fear ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{anpsScores?.fear ?? 50}%</span>
              </div>

              <div className="stat" data-value={anpsScores?.sadness ?? 50}>
                <span className="label text-sm md:text-base">😢 SADNESS</span>
                <div className="bar">
                  <div className="fill grad-purple" style={{width: `${anpsScores?.sadness ?? 50}%`}}></div>
                </div>
                <span className="score text-sm md:text-base">{anpsScores?.sadness ?? 50}%</span>
              </div>

              <p className="punchline text-xs md:text-sm">
                {getAnpsPunchline()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MBTI CARD */}
      <div className="mt-12 md:mt-16 mb-6 md:mb-6 px-2 md:px-0">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[360px] mx-auto">
          <div className="relative h-full flex flex-col w-full">
            <div
              className="stats-card md:h-auto h-full flex flex-col flex-1 !my-0 md:!my-[30px] cursor-pointer !p-3 md:!p-[18px]"
              onClick={() => setOverlayCard('mbti')}
            >
              <h2 className="title text-base md:text-xl font-bold md:justify-center">
                🧠 Ton profil MBTI
              </h2>
              <p className="text-xs md:text-sm opacity-70 text-center mb-3">
                16 personnalites - resume + forces + axes
              </p>
              <div className="mbti-badge mx-auto mb-3">
                <div className="mbti-type">{mbtiType ?? "----"}</div>
                <div className="mbti-nick">{getMbtiName(mbtiType)}</div>
              </div>
              <p className="punchline text-xs md:text-sm">
                {mbtiType ? `Tu es de type ${mbtiType} - ${getMbtiName(mbtiType)}.` : "Complete le quiz MBTI pour decouvrir ton type de personnalite."}
              </p>
            </div>
          </div>
        </div>
      </div>
        </motion.div>

        {/* Overlay pour les cartes */}
      <AnimatePresence>
        {overlayCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setOverlayCard(null)}
          >
            {/* Carte au centre (60% de l'écran) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative ${
                overlayCard === 'mbti' ? 'w-[75vw] max-w-3xl' : 
                overlayCard === 'enneagram' ? 'w-[65vw] max-w-2xl' : 
                overlayCard === 'zodiac' ? 'w-[55vw] max-w-lg' :
                'w-[60vw] max-w-2xl'
              } max-h-[90vh] overflow-visible`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`max-h-[90vh] ${overlayCard === 'mbti' ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}>
              {overlayCard === 'traits' && (
                <div className="stats-card relative !p-[18px] md:!p-[28px_18px]">
                  <button
                    onClick={() => setOverlayCard(null)}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="title text-xl font-bold justify-center">
                    🏆 Traits dominants
                  </h2>
                  {traits.map((trait, index) => (
                    <div
                      key={trait.name}
                      className="stat"
                      data-value={trait.score}
                      ref={(el) => {
                        overlayStatRefs.current[index] = el;
                      }}
                    >
                      <span className="label">{trait.name}</span>
                      <div className="bar">
                        <div 
                          className={`fill ${trait.gradient}`}
                          style={{ width: "0%" }}
                        ></div>
                      </div>
                      <span className={`score ${trait.colorClass}`}>{trait.score}%</span>
                    </div>
                  ))}
                  <p className="punchline">
                    {summary}
                  </p>
                </div>
              )}

              {overlayCard === 'enneagram' && enneaProfile && (
                <div className="ennea-card-container w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="ennea-card relative" style={{ overflow: 'visible' }}>
                    <button
                      onClick={() => setOverlayCard(null)}
                      className="absolute -top-2 -right-2 z-30 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="ennea-card-content">
                      <div className="ennea-header">
                        <div className="ennea-icon">🔮</div>
                        <h1 className="text-base">Ennéagramme</h1>
                      </div>
                      <div className="ennea-type-badge">
                        <div className="ennea-type-title text-xs">
                          Type <span className="ennea-type-number">{enneaProfile.type}</span> • <span className="ennea-type-name">{cleanEnneagramName(enneaProfile.name)}</span>
                        </div>
                      </div>
                      <p className="ennea-description text-[10px]">
                        {cleanEnneagramDescription(enneaProfile.desc)}
                      </p>
                      <div className="enneagram-container">
                        <svg viewBox="0 0 400 400">
                          <defs>
                            <linearGradient id="lineGradientOverlay" x1={"0%"} y1={"0%"} x2={"100%"} y2={"100%"}>
                              <stop offset={"0%"} style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                              <stop offset={"100%"} style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                            </linearGradient>
                            {/* Filtres de glow pour tous les types (overlay) */}
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <filter key={`glow${num}Overlay`} id={`glow${num}Overlay`} x={"-50%"} y={"-50%"} width={"200%"} height={"200%"}>
                                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            ))}
                            {/* Gradients de glow pour tous les types (overlay) */}
                            <radialGradient id="glowGradient1Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#f56565', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#f56565', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#f56565', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient2Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#ed8936', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#ed8936', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#ed8936', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient3Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#ffa834', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#ffa834', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#ffa834', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient4Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#f6d365', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#f6d365', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#f6d365', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient5Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#d946ef', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#d946ef', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#d946ef', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient6Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#06b6d4', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient7Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#10b981', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#10b981', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient8Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#3b82f6', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient9Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0 }} />
                            </radialGradient>
                          </defs>
                          <circle cx="200" cy="200" r="150" fill="none" stroke="#e2e8f0" strokeWidth="2"/>
                          <path d="M 200 50 L 329.9 320.5 L 70.1 320.5 Z" stroke="#667eea" strokeWidth="5" fill="none" opacity="1"/>
                          <path d="M 329.9 79.5 L 329.9 320.5 M 329.9 320.5 L 70.1 320.5 M 70.1 320.5 L 70.1 79.5 M 70.1 79.5 L 200 50 M 200 50 L 329.9 79.5" stroke="#667eea" strokeWidth="5" fill="none" opacity="1"/>
                          {/* Cercles de glow dynamiques pour le type (overlay) */}
                          {enneaProfile.type === 9 && <circle cx="200" cy="50" r="39" fill="#8b5cf6" opacity="0.7"/>}
                          {enneaProfile.type === 1 && <circle cx="329.9" cy="79.5" r="39" fill="#f56565" opacity="0.7"/>}
                          {enneaProfile.type === 2 && <circle cx="350" cy="200" r="39" fill="#ed8936" opacity="0.7"/>}
                          {enneaProfile.type === 3 && <circle cx="329.9" cy="320.5" r="39" fill="#ffa834" opacity="0.7"/>}
                          {enneaProfile.type === 4 && <circle cx="260" cy="360" r="39" fill="#f6d365" opacity="0.7"/>}
                          {enneaProfile.type === 5 && <circle cx="140" cy="360" r="39" fill="#d946ef" opacity="0.7"/>}
                          {enneaProfile.type === 6 && <circle cx="70.1" cy="320.5" r="39" fill="#06b6d4" opacity="0.7"/>}
                          {enneaProfile.type === 7 && <circle cx="50" cy="200" r="39" fill="#10b981" opacity="0.7"/>}
                          {enneaProfile.type === 8 && <circle cx="70.1" cy="79.5" r="39" fill="#3b82f6" opacity="0.7"/>}
                          
                          {/* Contours jaunes pour le type (overlay) */}
                          {enneaProfile.type === 9 && (
                            <circle cx="200" cy="50" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 1 && (
                            <circle cx="329.9" cy="79.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 2 && (
                            <circle cx="350" cy="200" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 3 && (
                            <circle cx="329.9" cy="320.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 4 && (
                            <circle cx="260" cy="360" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 5 && (
                            <circle cx="140" cy="360" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 6 && (
                            <circle cx="70.1" cy="320.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 7 && (
                            <circle cx="50" cy="200" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 8 && (
                            <circle cx="70.1" cy="79.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 9 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="9"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(9); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-9" cx="200" cy="50" r={enneaProfile.type === 9 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="200" y="50" style={{ fontSize: enneaProfile.type === 9 ? '30px' : '24px' }}>9</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 1 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="1"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(1); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-1" cx="329.9" cy="79.5" r={enneaProfile.type === 1 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="329.9" y="79.5" style={{ fontSize: enneaProfile.type === 1 ? '30px' : '24px' }}>1</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 2 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="2"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(2); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-2" cx="350" cy="200" r={enneaProfile.type === 2 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="350" y="200" style={{ fontSize: enneaProfile.type === 2 ? '30px' : '24px' }}>2</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 3 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="3"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(3); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-3" cx="329.9" cy="320.5" r={enneaProfile.type === 3 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="329.9" y="320.5" style={{ fontSize: enneaProfile.type === 3 ? '30px' : '24px' }}>3</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 4 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="4"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(4); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-4" cx="260" cy="360" r={enneaProfile.type === 4 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="260" y="360" style={{ fontSize: enneaProfile.type === 4 ? '30px' : '24px' }}>4</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 5 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="5"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(5); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-5" cx="140" cy="360" r={enneaProfile.type === 5 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="140" y="360" style={{ fontSize: enneaProfile.type === 5 ? '30px' : '24px' }}>5</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 6 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="6"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(6); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-6" cx="70.1" cy="320.5" r={enneaProfile.type === 6 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="70.1" y="320.5" style={{ fontSize: enneaProfile.type === 6 ? '30px' : '24px' }}>6</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 7 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="7"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(7); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-7" cx="50" cy="200" r={enneaProfile.type === 7 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="50" y="200" style={{ fontSize: enneaProfile.type === 7 ? '30px' : '24px' }}>7</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 8 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="8"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(8); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-8" cx="70.1" cy="79.5" r={enneaProfile.type === 8 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="70.1" y="79.5" style={{ fontSize: enneaProfile.type === 8 ? '30px' : '24px' }}>8</text>
                          </g>
                        </svg>
                        {/* Bulle d'information pour les points cliqués (overlay uniquement) */}
                        {selectedEnneagramPoint && overlayCard === 'enneagram' && (() => {
                          const pos = getEnneagramPointPosition(selectedEnneagramPoint);
                          const xPercent = (pos.x / 400) * 100;
                          const yPercent = (pos.y / 400) * 100;
                          
                          // Calculer la position de la bulle selon l'ancre
                          let top = 'auto';
                          let bottom = 'auto';
                          let left = 'auto';
                          let right = 'auto';
                          let transform = '';
                          let arrowClass = '';
                          
                          if (pos.anchor === 'bottom') {
                            top = `${yPercent}%`;
                            left = `${xPercent}%`;
                            transform = 'translate(-50%, calc(-100% - 15px))';
                            arrowClass = 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full';
                          } else if (pos.anchor === 'left') {
                            top = `${yPercent}%`;
                            left = `${xPercent}%`;
                            transform = 'translate(calc(-100% - 15px), -50%)';
                            arrowClass = 'left-0 top-1/2 -translate-y-1/2 -translate-x-full';
                          } else if (pos.anchor === 'right') {
                            top = `${yPercent}%`;
                            right = `${(400 - pos.x) / 400 * 100}%`;
                            transform = 'translate(0, -50%)';
                            arrowClass = 'right-0 top-1/2 -translate-y-1/2 translate-x-full';
                          } else if (pos.anchor === 'top') {
                            bottom = `${(400 - pos.y) / 400 * 100}%`;
                            left = `${xPercent}%`;
                            transform = 'translate(-50%, 0)';
                            arrowClass = 'top-0 left-1/2 -translate-x-1/2 -translate-y-full';
                          }
                          
                          return (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="absolute bg-white rounded-xl shadow-2xl p-4 z-[60] max-w-[300px] border-2 border-purple-200"
                              style={{
                                top,
                                bottom,
                                left,
                                right,
                                transform,
                                maxHeight: '220px',
                                overflowY: 'auto',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Flèche pointant vers le point */}
                              <div className={`absolute ${arrowClass} w-0 h-0`}>
                                {pos.anchor === 'bottom' && (
                                  <div 
                                    className="border-8 border-transparent" 
                                    style={{ borderTopColor: '#e9d5ff' }}
                                  ></div>
                                )}
                                {pos.anchor === 'left' && (
                                  <div 
                                    className="border-8 border-transparent" 
                                    style={{ borderLeftColor: '#e9d5ff' }}
                                  ></div>
                                )}
                                {pos.anchor === 'right' && (
                                  <div 
                                    className="border-8 border-transparent" 
                                    style={{ borderRightColor: '#e9d5ff' }}
                                  ></div>
                                )}
                                {pos.anchor === 'top' && (
                                  <div 
                                    className="border-8 border-transparent" 
                                    style={{ borderBottomColor: '#e9d5ff' }}
                                  ></div>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedEnneagramPoint(null)}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 z-10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <h3 className="font-bold text-base mb-2 pr-6 text-purple-600">
                                Type {selectedEnneagramPoint}: {getEnneagramTypeInfo(selectedEnneagramPoint).name}
                              </h3>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {getEnneagramTypeInfo(selectedEnneagramPoint).description}
                              </p>
                            </motion.div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {overlayCard === 'zodiac' && birthMonth && birthDay && (() => {
                const signKey = getZodiacSign(birthMonth, birthDay);
                const sign = signKey ? zodiacSigns[signKey] : null;
                
                if (!sign) return null;
                
                return (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="rounded-3xl shadow-2xl p-6 relative max-w-md mx-auto"
                    style={{
                      background: 'linear-gradient(135deg, #f7e8ff, #f3f6ff)',
                    }}
                  >
                    <button
                      onClick={() => setOverlayCard(null)}
                      className="absolute -top-2 -right-2 z-30 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center text-center">
                      {signKey === 'poissons' ? (
                        <motion.div 
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                          className="w-[120px] h-[120px] rounded-xl mx-auto mb-3 overflow-hidden relative"
                          style={{
                            boxShadow: '0 8px 20px rgba(124,58,237,0.3), 0 4px 8px rgba(124,58,237,0.2)'
                          }}
                        >
                          <Image
                            src="/astro-poisson.png"
                            alt="Poissons"
                            width={120}
                            height={120}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </motion.div>
                      ) : (
                        <motion.div 
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                          className="w-[50px] h-[50px] rounded-xl mx-auto flex items-center justify-center text-[32px] text-white mb-3"
                          style={{
                            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                            boxShadow: '0 8px 20px rgba(124,58,237,0.3), 0 4px 8px rgba(124,58,237,0.2)'
                          }}
                        >
                          {sign.icon}
                        </motion.div>
                      )}
                      <motion.h2 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="text-lg font-bold text-gray-900 mb-1"
                      >
                        {sign.name}
                      </motion.h2>
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="text-xs text-gray-500 mb-2"
                      >
                        {birthMonth && birthDay ? formatBirthDate(birthMonth, birthDay) : sign.range}
                      </motion.div>
                      <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="text-sm text-gray-600 leading-relaxed" 
                        style={{ lineHeight: '1.5' }}
                      >
                        {sign.desc}
                      </motion.p>
                    </div>
                  </motion.div>
                );
              })()}

              {overlayCard === 'partner' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="rounded-3xl shadow-2xl p-6 relative max-w-sm mx-auto"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b9d, #ffc0cb)',
                  }}
                >
                  <button
                    onClick={() => setOverlayCard(null)}
                    className="absolute -top-2 -right-2 z-30 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center text-center">
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                      className="w-[64px] h-[64px] rounded-xl mx-auto flex items-center justify-center text-[36px] bg-white mb-3"
                      style={{
                        boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
                      }}
                    >
                      👫
                    </motion.div>
                    <motion.h2 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="text-xl font-bold mb-3"
                      style={{ color: '#3b0a1e' }}
                    >
                      Ton partenaire idéal
                    </motion.h2>
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      className="text-sm leading-relaxed mb-4" 
                      style={{ color: '#3b0a1e', lineHeight: '1.5' }}
                    >
                      {getPartnerIdealContent().description}
                    </motion.p>
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="w-full rounded-xl p-3"
                      style={{
                        background: 'rgba(255,255,255,0.6)'
                      }}
                    >
                      <p className="text-xs font-semibold mb-1.5" style={{ color: '#3b0a1e' }}>
                        <strong>À éviter :</strong>
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: '#3b0a1e' }}>
                        {getPartnerIdealContent().avoid}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {overlayCard === 'bigfive' && (
                <div className="stats-card relative !p-[18px] md:!p-[28px_18px]">
                  <button
                    onClick={() => setOverlayCard(null)}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="title text-xl font-bold justify-center">
                    🧠 Ton profil de personnalite
                  </h2>

                  <div
                    className="stat"
                    data-value={bigFiveScores?.ouverture ?? 50}
                    ref={(el) => { bigFiveOverlayRefs.current[0] = el; }}
                  >
                    <span className="label">🌟 Ouverture</span>
                    <div className="bar">
                      <div className="fill grad-purple" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{bigFiveScores?.ouverture ?? 50}%</span>
                  </div>

                  <div
                    className="stat"
                    data-value={bigFiveScores?.conscienciosite ?? 50}
                    ref={(el) => { bigFiveOverlayRefs.current[1] = el; }}
                  >
                    <span className="label">🧩 Conscienciosite</span>
                    <div className="bar">
                      <div className="fill grad-blue" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{bigFiveScores?.conscienciosite ?? 50}%</span>
                  </div>

                  <div
                    className="stat"
                    data-value={bigFiveScores?.extraversion ?? 50}
                    ref={(el) => { bigFiveOverlayRefs.current[2] = el; }}
                  >
                    <span className="label">💬 Extraversion</span>
                    <div className="bar">
                      <div className="fill grad-pink" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{bigFiveScores?.extraversion ?? 50}%</span>
                  </div>

                  <div
                    className="stat"
                    data-value={bigFiveScores?.agreabilite ?? 50}
                    ref={(el) => { bigFiveOverlayRefs.current[3] = el; }}
                  >
                    <span className="label">🤝 Agreabilite</span>
                    <div className="bar">
                      <div className="fill grad-green" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{bigFiveScores?.agreabilite ?? 50}%</span>
                  </div>

                  <div
                    className="stat"
                    data-value={bigFiveScores?.sensibilite ?? 50}
                    ref={(el) => { bigFiveOverlayRefs.current[4] = el; }}
                  >
                    <span className="label">🌊 Sensibilite emotionnelle</span>
                    <div className="bar">
                      <div className="fill grad-yellow" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{bigFiveScores?.sensibilite ?? 50}%</span>
                  </div>

                  <p className="punchline">
                    {getBigFivePunchline()}
                  </p>
                </div>
              )}

              {overlayCard === 'anps' && (
                <div className="stats-card relative !p-[18px] md:!p-[28px_18px]">
                  <button
                    onClick={() => setOverlayCard(null)}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="title text-xl font-bold justify-center">
                    💖 Ton profil emotionnel
                  </h2>

                  <div
                    className="stat"
                    data-value={anpsScores?.seeking ?? 50}
                    ref={(el) => { anpsOverlayRefs.current[0] = el; }}
                  >
                    <span className="label">🔥 SEEKING</span>
                    <div className="bar">
                      <div className="fill grad-orange" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{anpsScores?.seeking ?? 50}%</span>
                  </div>

                  <div
                    className="stat"
                    data-value={anpsScores?.care ?? 50}
                    ref={(el) => { anpsOverlayRefs.current[1] = el; }}
                  >
                    <span className="label">💗 CARE</span>
                    <div className="bar">
                      <div className="fill grad-pink" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{anpsScores?.care ?? 50}%</span>
                  </div>

                  <div
                    className="stat"
                    data-value={anpsScores?.play ?? 50}
                    ref={(el) => { anpsOverlayRefs.current[2] = el; }}
                  >
                    <span className="label">😄 PLAY</span>
                    <div className="bar">
                      <div className="fill grad-green" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{anpsScores?.play ?? 50}%</span>
                  </div>

                  <div
                    className="stat"
                    data-value={anpsScores?.anger ?? 50}
                    ref={(el) => { anpsOverlayRefs.current[3] = el; }}
                  >
                    <span className="label">😠 ANGER</span>
                    <div className="bar">
                      <div className="fill grad-yellow" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{anpsScores?.anger ?? 50}%</span>
                  </div>

                  <div
                    className="stat"
                    data-value={anpsScores?.fear ?? 50}
                    ref={(el) => { anpsOverlayRefs.current[4] = el; }}
                  >
                    <span className="label">😨 FEAR</span>
                    <div className="bar">
                      <div className="fill grad-blue" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{anpsScores?.fear ?? 50}%</span>
                  </div>

                  <div
                    className="stat"
                    data-value={anpsScores?.sadness ?? 50}
                    ref={(el) => { anpsOverlayRefs.current[5] = el; }}
                  >
                    <span className="label">😢 SADNESS</span>
                    <div className="bar">
                      <div className="fill grad-purple" style={{ width: "0%" }}></div>
                    </div>
                    <span className="score">{anpsScores?.sadness ?? 50}%</span>
                  </div>

                  <p className="punchline">
                    {getAnpsPunchline()}
                  </p>
                </div>
              )}

              {overlayCard === 'mbti' && (
                <div className="mbti-card relative w-full" style={{ overflow: 'visible' }}>
                  <button
                    onClick={() => setOverlayCard(null)}
                    className="absolute -top-2 -right-2 z-30 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="mbti-top">
                    <div>
                      <h2 className="mbti-title">🧠 Ton profil MBTI</h2>
                      <p className="mbti-subtitle">16 personnalites - resume + forces + axes</p>
                    </div>
                    <div className="mbti-badge" aria-label="Type MBTI">
                      <div className="mbti-type">{mbtiType ?? "----"}</div>
                      <div className="mbti-nick">{getMbtiName(mbtiType)}</div>
                    </div>
                  </div>

                  {mbtiType ? (
                    <>
                      <div className="mbti-dims">
                        {[0, 1, 2, 3].map((index) => {
                          const dim = getMbtiDimension(mbtiType, index);
                          return dim ? (
                            <div className="dim" key={index}>
                              <span className="dim-letter">{dim.letter}</span>
                              <div className="dim-text">
                                <div className="dim-name">{dim.name}</div>
                                <div className="dim-desc">{dim.desc}</div>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>

                      <div className="mbti-section">
                        <h3>Resume</h3>
                        <p>
                          Tu es de type {mbtiType} - {getMbtiName(mbtiType)}. Decouvre tes forces et tes axes d'amelioration.
                        </p>
                      </div>

                      <div className="mbti-section mbti-tip">
                        <h3>Conseil</h3>
                        <p>
                          Exploite tes forces naturelles tout en travaillant sur tes points d'attention pour atteindre ton plein potentiel.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="mbti-section">
                      <p className="text-center text-gray-500 py-8">
                        Complete le quiz MBTI pour decouvrir ton type de personnalite parmi les 16 types.
                      </p>
                    </div>
                  )}
                </div>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
