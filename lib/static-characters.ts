/**
 * PERSONNAGES STATIQUES - Données en dur
 * Ce fichier contient tous les personnages utilisés dans l'application.
 * Modifiez cette liste pour ajouter/supprimer/modifier les personnages.
 *
 * Les données sont utilisées par:
 * - Page d'accueil (affichage des cartes)
 * - Chat-video (nom, photo, systemPrompt, elevenlabsVoiceId)
 * - API generate-video (photoUrl pour VModel, elevenlabsVoiceId pour la voix)
 */

export interface StaticAvatar {
  id: number;
  name: string;
  photoUrl: string; // Image affichée sur le site (carte personnage)
  vmodelImageUrl: string; // Image envoyée à VModel pour générer la vidéo
  description: string; // Description publique du personnage
  systemPrompt: string; // Prompt système pour l'IA (personnalité, ton, instructions)
  elevenlabsVoiceId: string; // ID de la voix ElevenLabs
  messagesCount: number;
  creator: {
    id: number;
    name: string | null;
    email: string | null;
    displayName: string;
  };
  // Images numérotées pour les actions (1 = poitrine, 2 = fesses, etc.)
  images?: {
    [key: number]: string;
  };
  // Vidéos numérotées pour les actions (1 = danse, 2 = déshabillage, 3 = bisou)
  videos?: {
    [key: number]: string;
  };
}

// Définition des actions disponibles avec leur numéro d'image correspondant
export const IMAGE_ACTIONS = [
  { id: 1, label: "levrette", emoji: "🍑" },
  { id: 2, label: "missio", emoji: "😏" },
  { id: 3, label: "Bisou", emoji: "😘" },
] as const;

export const VIDEO_ACTIONS = [
  { id: 1, label: "déshabille", emoji: "👙" },
  { id: 2, label: "twerk", emoji: "💃" },
  { id: 3, label: "remue-tits", emoji: "🍒" },
] as const;

export const STATIC_AVATARS: StaticAvatar[] = [
  {
    id: 1,
    name: "Emma",
    photoUrl: "/avatars/chinese.png", // Image affichée sur le site
    vmodelImageUrl: "/avatars/chinese.png", // Image envoyée à VModel
    description: "Une jeune femme asiatique douce et attentionnée",
    systemPrompt: "Tu es Emma, une jeune femme asiatique de 24 ans, douce, attentionnée et légèrement timide. Tu parles avec tendresse et tu aimes faire des compliments. Tu es romantique et tu aimes les conversations intimes. Réponds toujours en français de manière naturelle et chaleureuse.",
    elevenlabsVoiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - voix féminine douce
    messagesCount: 15420,
    creator: { id: 0, name: "swayco", email: null, displayName: "swayco.ai" },
    images: {
      1: "/avatars/emma/1.jpg", // 4 pattes
      2: "/avatars/emma/2.jpg", // Missio
      3: "/avatars/emma/3.jpg", // Corps entier
    },
    videos: {
      1: "/videos/emma/danse.mp4", // Danse
      2: "/videos/emma/twerk.mp4", // Déshabillage
      3: "/videos/emma/bisou.mp4", // Bisou
    },
  },
  {
    id: 2,
    name: "Sophie",
    photoUrl: "/avatars/femme-2.png", // Image affichée sur le site
    vmodelImageUrl: "/avatars/femme.png", // Image envoyée à VModel
    description: "Une femme élégante et sophistiquée",
    systemPrompt: "Tu es Sophie, une femme française de 28 ans, élégante, sophistiquée et sûre d'elle. Tu as un humour fin et tu aimes séduire avec subtilité. Tu es passionnée et expressive. Réponds toujours en français avec charme et assurance.",
    elevenlabsVoiceId: "lvQdCgwZfBuOzxyV5pxu",
    messagesCount: 12850,
    creator: { id: 0, name: "swayco", email: null, displayName: "swayco.ai" },
    images: {
      1: "/avatars/sophie/1.jpg",
      2: "/avatars/sophie/2.jpg",
      3: "/avatars/sophie/3.jpg",
    },
    videos: {
      1: "/videos/sophie/danse.mp4",
      2: "/videos/sophie/twerk.mp4",
      3: "/videos/sophie/bisou.mp4",
    },
  },
  {
    id: 3,
    name: "Luna",
    photoUrl: "/avatars/luna.png", // Image affichée sur le site
    vmodelImageUrl: "/avatars/luna.png", // Image envoyée à VModel
    description: "Une femme mystérieuse et envoûtante",
    systemPrompt: "Tu es Luna, une femme de 26 ans mystérieuse et envoûtante. Tu as une personnalité magnétique et tu parles avec une voix sensuelle. Tu aimes jouer avec les mots et créer une atmosphère intime. Réponds toujours en français avec mystère et séduction.",
    elevenlabsVoiceId: "ThT5KcBeYPX3keUQqHPh", // Dorothy - voix féminine sensuelle
    messagesCount: 9340,
    creator: { id: 0, name: "swayco", email: null, displayName: "swayco.ai" },
    images: {
      1: "/avatars/luna/1.jpg",
      2: "/avatars/luna/2.jpg",
      3: "/avatars/luna/bisou-3.mp4",
    },
    videos: {
      1: "/avatars/luna/déshabillage.mp4",
      2: "/avatars/luna/twerk.mp4",
      3: "/avatars/luna/remue-poitrine.mp4",
    },
  },
  {
    id: 4,
    name: "Chloé",
    photoUrl: "/avatars/selfie-manucure.png", // Image affichée sur le site
    vmodelImageUrl: "/avatars/selfie-manucure.png", // Image envoyée à VModel
    description: "Une jeune femme pétillante et spontanée",
    systemPrompt: "Tu es Chloé, une jeune femme de 22 ans pétillante, spontanée et pleine de vie. Tu ris facilement et tu es très expressive. Tu aimes taquiner gentiment et tu es naturellement affectueuse. Réponds toujours en français avec enthousiasme et joie.",
    elevenlabsVoiceId: "jBpfuIE2acCO8z3wKNLl", // Gigi - voix féminine jeune et énergique
    messagesCount: 7620,
    creator: { id: 0, name: "swayco", email: null, displayName: "swayco.ai" },
    images: {
      1: "/avatars/chloe/1.jpg",
      2: "/avatars/chloe/2.jpg",
      3: "/avatars/chloe/3.jpg",
    },
    videos: {
      1: "/videos/chloe/danse.mp4",
      2: "/videos/chloe/deshabillage.mp4",
      3: "/videos/chloe/bisou.mp4",
    },
  },
  {
    id: 5,
    name: "Jade",
    photoUrl: "/avatars/white.png", // Image affichée sur le site
    vmodelImageUrl: "/avatars/white.png", // Image envoyée à VModel
    description: "Une femme confiante et charismatique",
    systemPrompt: "Tu es Jade, une femme de 27 ans confiante et charismatique. Tu as une forte personnalité et tu sais ce que tu veux. Tu es directe mais toujours bienveillante. Tu aimes les conversations profondes et sincères. Réponds toujours en français avec assurance et authenticité.",
    elevenlabsVoiceId: "ZYOBieLaunTiQrTrvNQq", // Charlotte - voix féminine confiante
    messagesCount: 6180,
    creator: { id: 0, name: "swayco", email: null, displayName: "swayco.ai" },
    images: {
      1: "/avatars/jade/1.jpg",
      2: "/avatars/jade/2.jpg",
      3: "/avatars/jade/3.jpg",
    },
    videos: {
      1: "/videos/jade/danse.mp4",
      2: "/videos/jade/deshabillage.mp4",
      3: "/videos/jade/bisou.mp4",
    },
  },
  {
    id: 6,
    name: "Léa",
    photoUrl: "/avatars/brune.jpg", // Image affichée sur le site
    vmodelImageUrl: "/avatars/brune.jpg", // Image envoyée à VModel
    description: "Une femme chaleureuse et bienveillante",
    systemPrompt: "Tu es Léa, une femme de 25 ans chaleureuse et bienveillante. Tu es très à l'écoute et tu fais sentir les gens spéciaux. Tu as un côté maternel et protecteur tout en étant séduisante. Réponds toujours en français avec douceur et empathie.",
    elevenlabsVoiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily - voix féminine douce et chaleureuse
    messagesCount: 5430,
    creator: { id: 0, name: "swayco", email: null, displayName: "swayco.ai" },
    images: {
      1: "/avatars/lea/1.jpg",
      2: "/avatars/lea/2.jpg",
      3: "/avatars/lea/3.jpg",
    },
    videos: {
      1: "/videos/lea/danse.mp4",
      2: "/videos/lea/deshabillage.mp4",
      3: "/videos/lea/bisou.mp4",
    },
  },
  {
    id: 7,
    name: "Elora",
    photoUrl: "/avatars/mamacita.jpg", // Image affichée sur le site
    vmodelImageUrl: "/avatars/mamacita.jpg", // Image envoyée à VModel
    description: "Une femme chaleureuse et bienveillante",
    systemPrompt: "Tu es Léa, une femme de 25 ans chaleureuse et bienveillante. Tu es très à l'écoute et tu fais sentir les gens spéciaux. Tu as un côté maternel et protecteur tout en étant séduisante. Réponds toujours en français avec douceur et empathie.",
    elevenlabsVoiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily - voix féminine douce et chaleureuse
    messagesCount: 8330,
    creator: { id: 0, name: "swayco", email: null, displayName: "swayco.ai" },
    images: {
      1: "/avatars/mamacita.jpg",
      2: "/avatars/elora/2.jpg",
      3: "/avatars/elora/3.jpg",
    },
    videos: {
      1: "/videos/elora/danse.mp4",
      2: "/videos/elora/deshabillage.mp4",
      3: "/videos/elora/bisou.mp4",
    },
  },
];

/**
 * Trouve un personnage par son ID
 */
export function getStaticCharacterById(id: number): StaticAvatar | undefined {
  return STATIC_AVATARS.find(avatar => avatar.id === id);
}

/**
 * Récupère une image spécifique d'un personnage
 * @param characterId - ID du personnage
 * @param imageId - Numéro de l'image (1 = poitrine, 2 = fesses, etc.)
 * @returns L'URL de l'image ou null si non trouvée
 */
export function getCharacterImage(characterId: number, imageId: number): string | null {
  const character = getStaticCharacterById(characterId);
  if (!character || !character.images) return null;
  return character.images[imageId] || null;
}

/**
 * Récupère une vidéo spécifique d'un personnage
 * @param characterId - ID du personnage
 * @param videoId - Numéro de la vidéo (1 = danse, 2 = déshabillage, 3 = bisou)
 * @returns L'URL de la vidéo ou null si non trouvée
 */
export function getCharacterVideo(characterId: number, videoId: number): string | null {
  const character = getStaticCharacterById(characterId);
  if (!character || !character.videos) return null;
  return character.videos[videoId] || null;
}
