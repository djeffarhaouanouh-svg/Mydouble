'use client';

import { useState, useEffect, useCallback, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, RefreshCw, Loader2 } from 'lucide-react';
import { VideoPlayer } from './components/VideoPlayer';
import { PushToTalkButton } from './components/PushToTalkButton';
import { UsageBar, UsageBarCompact } from './components/UsageBar';
import { VisioSetup } from './components/VisioSetup';
import type { VisioState, VisioSessionState, VisioAction } from '@/lib/visio/types';

// Reducer pour gérer les états de la session
function visioReducer(state: VisioSessionState, action: VisioAction): VisioSessionState {
  switch (action.type) {
    case 'INIT_SESSION':
      return {
        ...state,
        state: 'idle',
        sessionId: action.payload.sessionId,
        idleVideoUrl: action.payload.idleVideoUrl,
        sessionStartTime: new Date(),
      };
    case 'START_RECORDING':
      return { ...state, state: 'recording' };
    case 'STOP_RECORDING':
      return { ...state, state: 'processing' };
    case 'PROCESSING_STARTED':
      return { ...state, state: 'processing' };
    case 'RESPONSE_RECEIVED':
      return {
        ...state,
        state: 'talking',
        currentVideoUrl: action.payload.videoUrl,
        lastUserMessage: action.payload.userText,
        lastAiResponse: action.payload.aiResponse,
        usageRemaining: action.payload.usageRemaining,
      };
    case 'VIDEO_ENDED':
      return {
        ...state,
        state: 'idle',
        currentVideoUrl: null,
      };
    case 'END_SESSION':
      return {
        ...state,
        state: 'ready',
        sessionId: null,
        currentVideoUrl: null,
      };
    case 'SET_ERROR':
      return { ...state, state: 'error', error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_AVATAR_STATUS':
      return { ...state, avatarStatus: action.payload };
    case 'UPDATE_USAGE':
      return { ...state, usageRemaining: action.payload };
    default:
      return state;
  }
}

const initialState: VisioSessionState = {
  state: 'setup',
  sessionId: null,
  sessionStartTime: null,
  usageRemaining: 0,
  avatarStatus: 'none',
  currentVideoUrl: null,
  idleVideoUrl: null,
  error: null,
  lastUserMessage: null,
  lastAiResponse: null,
};

export default function AvatarVisioPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(visioReducer, initialState);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasExistingVoice, setHasExistingVoice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usage, setUsage] = useState({ usedSeconds: 0, quotaSeconds: 600 });

  // Charger les données utilisateur au montage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/inscription');
      return;
    }
    setUserId(storedUserId);
    loadUserData(storedUserId);
  }, [router]);

  // Charger les données utilisateur
  const loadUserData = async (uid: string) => {
    setIsLoading(true);
    try {
      // Charger l'usage
      const usageRes = await fetch(`/api/avatar-visio/usage?userId=${uid}`);
      const usageData = await usageRes.json();

      if (usageData.success) {
        setUsage({
          usedSeconds: usageData.usage.usedSeconds,
          quotaSeconds: usageData.usage.quotaSeconds,
        });
        dispatch({ type: 'UPDATE_USAGE', payload: usageData.usage.remainingSeconds });

        if (usageData.avatarStatus === 'ready') {
          dispatch({ type: 'SET_AVATAR_STATUS', payload: 'ready' });

          // Charger les détails de l'avatar
          const avatarRes = await fetch(`/api/avatar-visio/create-avatar?userId=${uid}`);
          const avatarData = await avatarRes.json();

          if (avatarData.idleLoopVideoUrl) {
            // Avatar prêt avec idle loop
            dispatch({
              type: 'INIT_SESSION',
              payload: {
                sessionId: `visio_${Date.now()}`,
                idleVideoUrl: avatarData.idleLoopVideoUrl,
              },
            });
          } else {
            // Avatar prêt mais pas d'idle loop - utiliser la photo comme placeholder
            dispatch({ type: 'SET_AVATAR_STATUS', payload: 'ready' });
          }
        } else if (usageData.avatarStatus === 'none') {
          dispatch({ type: 'SET_AVATAR_STATUS', payload: 'none' });
        } else {
          dispatch({ type: 'SET_AVATAR_STATUS', payload: usageData.avatarStatus as any });
        }
      }

      // Vérifier s'il a une voix clonée
      const profileRes = await fetch(`/api/user/profile?userId=${uid}`);
      const profileData = await profileRes.json();
      setHasExistingVoice(!!profileData.aiDouble?.voiceId);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Démarrer l'enregistrement
  const handleRecordStart = useCallback(() => {
    dispatch({ type: 'START_RECORDING' });
  }, []);

  // Fin d'enregistrement - envoyer au backend
  const handleRecordEnd = useCallback(
    async (audioBlob: Blob) => {
      if (!userId) return;

      dispatch({ type: 'STOP_RECORDING' });

      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('userId', userId);
        if (state.sessionId) {
          formData.append('sessionId', state.sessionId);
        }

        const response = await fetch('/api/avatar-visio/conversation', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la conversation');
        }

        if (data.videoUrl) {
          dispatch({
            type: 'RESPONSE_RECEIVED',
            payload: {
              videoUrl: data.videoUrl,
              userText: data.userText,
              aiResponse: data.aiResponse,
              usageRemaining: data.usageRemaining,
            },
          });
        } else {
          // Pas de vidéo mais on a une réponse audio
          // On retourne à idle
          dispatch({ type: 'VIDEO_ENDED' });
        }

        // Mettre à jour l'usage
        setUsage((prev) => ({
          ...prev,
          usedSeconds: prev.quotaSeconds - data.usageRemaining,
        }));
      } catch (error) {
        console.error('Erreur conversation:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Erreur inconnue',
        });
        // Retour à idle après erreur
        setTimeout(() => {
          dispatch({ type: 'VIDEO_ENDED' });
          dispatch({ type: 'CLEAR_ERROR' });
        }, 3000);
      }
    },
    [userId, state.sessionId]
  );

  // Fin de la vidéo
  const handleVideoEnd = useCallback(() => {
    dispatch({ type: 'VIDEO_ENDED' });
  }, []);

  // Setup terminé
  const handleSetupComplete = useCallback(() => {
    if (userId) {
      loadUserData(userId);
    }
  }, [userId]);

  // Réinitialiser l'avatar
  const handleReset = useCallback(() => {
    dispatch({ type: 'SET_AVATAR_STATUS', payload: 'none' });
  }, []);

  // Affichage loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    );
  }

  // Mapper l'état pour le bouton PTT
  const buttonState: 'idle' | 'recording' | 'processing' | 'talking' | 'disabled' =
    state.state === 'idle'
      ? 'idle'
      : state.state === 'recording'
        ? 'recording'
        : state.state === 'processing'
          ? 'processing'
          : state.state === 'talking'
            ? 'talking'
            : 'disabled';

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <h1 className="font-bold text-gray-900">Avatar Visio</h1>

          <div className="flex items-center gap-2">
            {state.avatarStatus === 'ready' && (
              <UsageBarCompact usedSeconds={usage.usedSeconds} quotaSeconds={usage.quotaSeconds} />
            )}
            {state.avatarStatus === 'ready' && (
              <button
                onClick={handleReset}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                title="Reconfigurer l'avatar"
              >
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Setup si pas d'avatar */}
        {state.avatarStatus === 'none' && userId && (
          <VisioSetup
            userId={userId}
            hasExistingVoice={hasExistingVoice}
            onComplete={handleSetupComplete}
          />
        )}

        {/* Avatar en cours de création */}
        {(state.avatarStatus === 'pending' || state.avatarStatus === 'processing') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-pink-500 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Avatar en préparation...
            </h2>
            <p className="text-gray-600">
              Cela peut prendre quelques minutes.
            </p>
            <button
              onClick={() => userId && loadUserData(userId)}
              className="mt-6 px-4 py-2 text-sm text-pink-600 hover:text-pink-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser le statut
            </button>
          </motion.div>
        )}

        {/* Interface de conversation */}
        {state.avatarStatus === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Video Player */}
            <VideoPlayer
              idleVideoUrl={state.idleVideoUrl}
              talkingVideoUrl={state.currentVideoUrl}
              isPlaying={state.state === 'talking'}
              onVideoEnd={handleVideoEnd}
            />

            {/* Transcription */}
            {(state.lastUserMessage || state.lastAiResponse) && (
              <div className="w-full space-y-3">
                {state.lastUserMessage && (
                  <div className="bg-gray-100 rounded-xl p-3 text-sm">
                    <span className="text-gray-500 font-medium">Vous: </span>
                    {state.lastUserMessage}
                  </div>
                )}
                {state.lastAiResponse && (
                  <div className="bg-pink-50 rounded-xl p-3 text-sm">
                    <span className="text-pink-600 font-medium">Avatar: </span>
                    {state.lastAiResponse}
                  </div>
                )}
              </div>
            )}

            {/* Erreur */}
            {state.error && (
              <div className="w-full p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                {state.error}
              </div>
            )}

            {/* Bouton Push-to-Talk */}
            <PushToTalkButton
              state={buttonState}
              onRecordStart={handleRecordStart}
              onRecordEnd={handleRecordEnd}
              disabled={state.usageRemaining <= 0}
              enableVAD={true}
              vadSilenceDuration={2000}
            />

            {/* Barre d'usage */}
            <UsageBar
              usedSeconds={usage.usedSeconds}
              quotaSeconds={usage.quotaSeconds}
              className="w-full"
            />
          </motion.div>
        )}

        {/* Erreur avatar */}
        {state.avatarStatus === 'failed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-3xl">😕</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Erreur lors de la création
            </h2>
            <p className="text-gray-600 mb-6">
              La création de l'avatar a échoué. Veuillez réessayer.
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gradient-to-r from-[#e31fc1] to-[#ff6b9d] text-white font-semibold rounded-xl hover:scale-105 transition-transform"
            >
              Réessayer
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
