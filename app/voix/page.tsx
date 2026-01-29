"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Play, Pause, Loader2, Volume2, Check } from "lucide-react";
import { motion } from "framer-motion";

// Voix ElevenLabs disponibles
const AVAILABLE_VOICES = [
  {
    id: "EmZGlxI7QPvCEMOkFhB9",
    name: "Mia",
    description: "Voix féminine douce et naturelle",
    gender: "female",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    description: "Voix féminine professionnelle",
    gender: "female",
  },
  {
    id: "N2lVS1w4EtoT3dr4eOWO",
    name: "Callum",
    description: "Voix masculine britannique",
    gender: "male",
  },
  {
    id: "TX3LPaxmHKxFdv7VOQHJ",
    name: "Liam",
    description: "Voix masculine jeune et dynamique",
    gender: "male",
  },
  {
    id: "XB0fDUnXU5powFXDhCwa",
    name: "Charlotte",
    description: "Voix féminine élégante",
    gender: "female",
  },
  {
    id: "pFZP5JQG7iQjIQuC4Bku",
    name: "Lily",
    description: "Voix féminine chaleureuse",
    gender: "female",
  },
];

interface PendingCharacter {
  name: string;
  description: string | null;
  photoBase64: string | null;
  userId: string;
}

function VoixPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get('characterId');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingCharacter, setPendingCharacter] = useState<PendingCharacter | null>(null);
  const [isNewCharacter, setIsNewCharacter] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Charger les données du personnage en attente
  useEffect(() => {
    const stored = localStorage.getItem('pendingCharacter');
    if (stored) {
      try {
        const data = JSON.parse(stored) as PendingCharacter;
        setPendingCharacter(data);
        setIsNewCharacter(true);
      } catch {
        // Données invalides
      }
    } else if (!characterId) {
      // Pas de données et pas de characterId, rediriger vers avatar-fx
      setError('Aucun personnage à configurer. Veuillez d\'abord créer un personnage.');
    }
  }, [characterId]);

  // Gérer la visibilité du header au scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Jouer un aperçu de la voix ElevenLabs
  const playVoicePreview = async (voiceId: string) => {
    // Si on clique sur la même voix qui joue, on l'arrête
    if (playingVoiceId === voiceId && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    // Arrêter l'audio en cours
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setLoadingVoiceId(voiceId);
    setError(null);

    try {
      // Appeler l'API ElevenLabs pour générer un aperçu
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId,
          text: "Bonjour, je suis votre assistant vocal. Comment puis-je vous aider aujourd'hui?",
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération de l\'aperçu');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setPlayingVoiceId(null);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setPlayingVoiceId(null);
        setError('Erreur lors de la lecture audio');
      };

      await audioRef.current.play();
      setPlayingVoiceId(voiceId);
    } catch (err) {
      console.error('Erreur aperçu voix:', err);
      setError('Impossible de jouer l\'aperçu de la voix');
    } finally {
      setLoadingVoiceId(null);
    }
  };

  // Sélectionner une voix
  const selectVoice = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
  };

  // Sauvegarder la voix sélectionnée
  const saveSelectedVoice = async () => {
    if (!selectedVoiceId) return;

    setSaving(true);
    setError(null);

    try {
      if (isNewCharacter && pendingCharacter) {
        // Créer le nouveau personnage avec la voix
        const formData = new FormData();
        formData.append('name', pendingCharacter.name);
        formData.append('userId', pendingCharacter.userId);

        if (pendingCharacter.description) {
          formData.append('description', pendingCharacter.description);
        }

        if (pendingCharacter.photoBase64) {
          // Convertir le base64 en File
          try {
            const response = await fetch(pendingCharacter.photoBase64);
            const blob = await response.blob();
            const file = new File([blob], 'character-photo.png', { type: blob.type || 'image/png' });
            formData.append('photo', file);
          } catch {
            console.warn('Impossible de convertir la photo, utilisation de la photo par défaut');
          }
        }

        // Créer le personnage
        const createResponse = await fetch('/api/characters', {
          method: 'POST',
          body: formData,
        });

        if (!createResponse.ok) {
          const data = await createResponse.json();
          throw new Error(data.error || 'Erreur lors de la création du personnage');
        }

        const createData = await createResponse.json();
        const newCharacterId = createData.character?.id;

        if (!newCharacterId) {
          throw new Error('Erreur lors de la création du personnage');
        }

        // Ajouter la voix au personnage
        const voiceResponse = await fetch(`/api/characters/${newCharacterId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ elevenlabsVoiceId: selectedVoiceId }),
        });

        if (!voiceResponse.ok) {
          throw new Error('Erreur lors de l\'association de la voix');
        }

        // Nettoyer les données temporaires
        localStorage.removeItem('pendingCharacter');

      } else if (characterId) {
        // Mettre à jour un personnage existant
        const response = await fetch(`/api/characters/${characterId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ elevenlabsVoiceId: selectedVoiceId }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'association de la voix');
        }
      } else {
        throw new Error('Aucun personnage à configurer');
      }

      setSuccess(true);

      // Rediriger après 1.5 secondes
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(err instanceof Error ? err.message : 'Impossible de sauvegarder la voix sélectionnée');
    } finally {
      setSaving(false);
    }
  };

  const characterName = pendingCharacter?.name || 'votre personnage';

  return (
    <div className="bg-[#0F0F0F] text-white min-h-screen">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between pl-3 pr-12 md:pl-4 md:pr-20 py-3 border-b border-[#2A2A2A] bg-[#0F0F0F] transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-white"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold absolute left-1/2 -translate-x-1/2">
          Choisir une voix
        </h1>
        <div className="w-9" />
      </header>

      {/* Contenu principal */}
      <main className="px-4 md:px-8 pt-20 pb-24 max-w-2xl mx-auto w-full">
        <motion.p
          className="text-[#A3A3A3] mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isNewCharacter
            ? `Sélectionnez une voix pour ${characterName}. Cliquez sur play pour écouter un aperçu.`
            : 'Sélectionnez une voix pour votre avatar. Cliquez sur le bouton play pour écouter un aperçu.'
          }
        </motion.p>

        {/* Liste des voix */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {AVAILABLE_VOICES.map((voice, index) => (
            <motion.div
              key={voice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              onClick={() => selectVoice(voice.id)}
              className={`bg-[#1E1E1E] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                selectedVoiceId === voice.id
                  ? 'border-[#3BB9FF] bg-[#3BB9FF]/10'
                  : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  selectedVoiceId === voice.id
                    ? 'bg-[#3BB9FF]/20 border-[#3BB9FF]'
                    : 'bg-[#252525] border-[#3BB9FF]'
                }`}>
                  <Volume2 className="w-6 h-6 text-[#3BB9FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{voice.name}</p>
                  <p className="text-[#A3A3A3] text-sm">{voice.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedVoiceId === voice.id && (
                  <div className="w-6 h-6 rounded-full bg-[#3BB9FF] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playVoicePreview(voice.id);
                  }}
                  disabled={loadingVoiceId === voice.id}
                  className="p-3 rounded-full bg-[#252525] hover:bg-[#2F2F2F] transition-colors disabled:opacity-50"
                  aria-label={playingVoiceId === voice.id ? "Pause" : "Écouter"}
                >
                  {loadingVoiceId === voice.id ? (
                    <Loader2 className="w-5 h-5 text-[#3BB9FF] animate-spin" />
                  ) : playingVoiceId === voice.id ? (
                    <Pause className="w-5 h-5 text-[#3BB9FF]" />
                  ) : (
                    <Play className="w-5 h-5 text-[#3BB9FF]" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Message d'erreur */}
        {error && (
          <motion.div
            className="mt-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        {/* Message de succès */}
        {success && (
          <motion.div
            className="mt-6 bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200 text-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isNewCharacter
              ? `${characterName} a été créé avec succès ! Redirection...`
              : 'Voix sélectionnée avec succès ! Redirection...'
            }
          </motion.div>
        )}

        {/* Bouton de sauvegarde */}
        {selectedVoiceId && !success && (
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={saveSelectedVoice}
              disabled={saving}
              className={`py-3 px-8 font-medium rounded-xl transition-colors flex items-center gap-2 ${
                saving
                  ? "bg-[#252525] text-[#A3A3A3] cursor-not-allowed"
                  : "bg-[#3BB9FF] text-white hover:bg-[#2AA3E6]"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isNewCharacter ? 'Création...' : 'Enregistrement...'}
                </>
              ) : (
                isNewCharacter ? `Créer ${characterName}` : "Utiliser cette voix"
              )}
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default function VoixPage() {
  return (
    <Suspense fallback={null}>
      <VoixPageContent />
    </Suspense>
  );
}
