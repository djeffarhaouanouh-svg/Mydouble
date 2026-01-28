'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Phone, MoreVertical, Paperclip, Mic, Send, Check, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { CreditDisplay } from '@/components/ui/CreditDisplay';
import { InsufficientCreditsModal } from '@/components/ui/InsufficientCreditsModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  jobId?: string;
  status: 'sending' | 'processing' | 'completed' | 'failed';
  time: string;
  showVideo?: boolean; // Indique si on doit afficher la vidéo au lieu du texte
  dbId?: number; // ID du message en base de données pour la mise à jour
  generationStartTime?: number; // Timestamp de début de génération pour calculer le temps total
}

export default function ChatVideoPage() {
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string>('Avatar');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPhotoUrl, setAvatarPhotoUrl] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditError, setCreditError] = useState<{ currentBalance: number; required: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const getTime = () => {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      pollingRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Header fixe - pas de logique de scroll

  // Récupérer characterId et storyId depuis l'URL et charger le personnage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('characterId');
      const storyIdParam = params.get('storyId');
      setCharacterId(id);
      setScenario(storyIdParam);
    }
  }, []);

  // Charger les messages existants depuis la base de données
  useEffect(() => {
    const loadMessages = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId || userId.startsWith('user_') || userId.startsWith('temp_') || isNaN(Number(userId))) {
        return;
      }

      if (!characterId && !scenario) {
        return;
      }

      try {
        const params = new URLSearchParams({
          userId,
        });
        if (characterId) params.append('characterId', characterId);
        if (scenario) params.append('storyId', scenario);

        const response = await fetch(`/api/messages?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.messages && data.messages.length > 0) {
            const loadedMessages: Message[] = data.messages.map((msg: any) => {
              // Support camelCase (Drizzle) et snake_case (DB brut)
              const videoUrl = msg.videoUrl ?? msg.video_url ?? undefined;
              return {
                id: msg.id.toString(),
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content,
                audioUrl: msg.audioUrl ?? msg.audio_url ?? undefined,
                videoUrl,
                status: 'completed' as const,
                time: new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                dbId: msg.id,
                showVideo: !!videoUrl,
              };
            });
            setMessages(loadedMessages);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    };

    if (characterId || scenario) {
      loadMessages();
    }
  }, [characterId, scenario]);

  // Charger les informations du personnage/scénario et enregistrer la conversation
  useEffect(() => {
    // Ne rien faire si on n'a ni characterId ni scenario
    if (!characterId && !scenario) {
      return;
    }

    const loadCharacterAndSaveConversation = async () => {
      let name = 'Avatar';
      let photoUrl = '/avatar-1.png';

      // Si un storyId est présent, charger les informations du scénario
      if (scenario) {
        try {
          const response = await fetch(`/api/stories`);
          const data = await response.json();
          if (data.success && data.stories) {
            const story = data.stories.find((s: any) => s.id === parseInt(scenario));
            if (story) {
              name = story.title;
              if (story.character) {
                photoUrl = story.character.photoUrl || '/avatar-1.png';
                setCharacterName(story.character.name);
                setAvatarPhotoUrl(photoUrl);
              } else {
                setCharacterName(name);
              }
            }
          }
        } catch (error) {
          console.error('Erreur chargement scénario:', error);
        }
      }

      // Charger les informations du personnage si characterId est présent
      if (characterId) {
        try {
          const userId = localStorage.getItem('userId');

          if (userId && !userId.startsWith('user_') && !userId.startsWith('temp_') && !isNaN(Number(userId))) {
            const response = await fetch(`/api/characters?isPublic=true&userId=${userId}`);
            const data = await response.json();
            if (data.success && data.avatars) {
              const character = data.avatars.find((a: any) => a.id === parseInt(characterId));
              if (character) {
                name = character.name;
                photoUrl = character.photoUrl || '/avatar-1.png';
                setCharacterName(name);
                setAvatarPhotoUrl(photoUrl);
              }
            }
          }

          if (name === 'Avatar') {
            const response = await fetch(`/api/characters?isPublic=true&limit=100`);
            const data = await response.json();
            if (data.success && data.avatars) {
              const character = data.avatars.find((a: any) => a.id === parseInt(characterId));
              if (character) {
                name = character.name;
                photoUrl = character.photoUrl || '/avatar-1.png';
                setCharacterName(name);
                setAvatarPhotoUrl(photoUrl);
              }
            }
          }

          if (name === 'Avatar') {
            const response = await fetch(`/api/characters?isPublic=false`);
            const data = await response.json();
            if (data.success && data.avatars) {
              const character = data.avatars.find((a: any) => a.id === parseInt(characterId));
              if (character) {
                name = character.name;
                photoUrl = character.photoUrl || '/avatar-1.png';
                setCharacterName(name);
                setAvatarPhotoUrl(photoUrl);
              }
            }
          }
        } catch (error) {
          console.error('Erreur chargement personnage:', error);
        }
      } else if (!scenario) {
        // Charger la photo du personnage par défaut
        const userId = localStorage.getItem('userId');
        if (userId) {
          try {
            const response = await fetch(`/api/avatar-visio/create-avatar?userId=${userId}`);
            const data = await response.json();
            if (data.photoUrl) {
              setAvatarPhotoUrl(data.photoUrl);
              photoUrl = data.photoUrl;
            }
          } catch (error) {
            console.error('Erreur chargement photo avatar:', error);
          }
        }
      }

      // Enregistrer la conversation dans localStorage
      const conversationId = scenario 
        ? `story-${scenario}` 
        : characterId 
          ? `character-${characterId}` 
          : `chat-${Date.now()}`;
      
      // Récupérer les conversations existantes
      const existingConversations = JSON.parse(
        localStorage.getItem('recentConversations') || '[]'
      );

      // Chercher si la conversation existe déjà
      const existingIndex = existingConversations.findIndex(
        (c: any) => c.id === conversationId
      );

      if (existingIndex >= 0) {
        // Mettre à jour la conversation existante avec le nouveau nom et photo
        // Ne remplacer le nom que si on a un nom valide (pas "Avatar") OU si la conversation existante a déjà "Avatar"
        const currentName = existingConversations[existingIndex].name;
        const shouldUpdateName = name !== 'Avatar' || currentName === 'Avatar';
        
        const updatedConversation = {
          ...existingConversations[existingIndex],
          name: shouldUpdateName ? name : currentName,
          photoUrl: photoUrl !== '/avatar-1.png' ? photoUrl : existingConversations[existingIndex].photoUrl,
          timestamp: new Date().toISOString(),
        };
        // Remettre en premier
        const updated = [
          updatedConversation,
          ...existingConversations.filter((c: any, i: number) => i !== existingIndex)
        ].slice(0, 15); // Limite de 15 discussions
        localStorage.setItem('recentConversations', JSON.stringify(updated));
      } else {
        // Créer une nouvelle conversation seulement si on a un nom valide (pas "Avatar" quand on a un characterId)
        if (!characterId || name !== 'Avatar') {
          const conversation = {
            id: conversationId,
            characterId: characterId || null,
            storyId: scenario || null,
            name: name,
            photoUrl: photoUrl,
            timestamp: new Date().toISOString(),
            lastMessage: '',
          };

          // Retirer la conversation si elle existe déjà (par sécurité)
          const filtered = existingConversations.filter(
            (c: any) => c.id !== conversation.id
          );

          // Ajouter la nouvelle conversation en premier
          const updated = [conversation, ...filtered].slice(0, 15); // Limite de 15 discussions
          localStorage.setItem('recentConversations', JSON.stringify(updated));
        }
      }
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new Event('conversationsUpdated'));
    };

    loadCharacterAndSaveConversation();
  }, [characterId, scenario]);

  const pollJobStatus = useCallback(async (jobId: string, messageId: string, attemptCount = 0) => {
    const MAX_ATTEMPTS = 60; // Maximum 60 tentatives (120 secondes = 2 minutes)
    
    try {
      console.log(`🔄 Polling #${attemptCount + 1}/${MAX_ATTEMPTS} pour jobId:`, jobId);
      const response = await fetch(`/api/chat-video/status?jobId=${jobId}`);
      const data = await response.json();
      
      console.log('📊 Status response:', {
        status: data.status || 'undefined',
        hasVideoUrl: !!data.videoUrl,
        error: data.error || null,
        videoUrl: data.videoUrl || null,
        warning: data.warning || null
      });

      if (data.status === 'completed' && data.videoUrl) {
        // Mettre à jour le message avec l'URL de la vidéo
        setMessages(prev => {
          // Trouver le message pour récupérer son dbId et son temps de début
          const currentMessage = prev.find(m => m.id === messageId);
          const messageDbId = currentMessage?.dbId;
          const startTime = currentMessage?.generationStartTime;
          
          // Calculer le temps total si on a le timestamp de début
          if (startTime) {
            const totalGenerationTime = Date.now() - startTime;
            const vmodelTime = data.vmodelTime ? `${data.vmodelTime}s` : 'non disponible';
            console.log('✅ Vidéo prête! URL:', data.videoUrl);
            console.log('⏱️ Temps total de génération:', {
              total: `${totalGenerationTime}ms (${(totalGenerationTime / 1000).toFixed(2)}s)`,
              vmodelGeneration: vmodelTime,
            });
          } else {
            console.log('✅ Vidéo prête! URL:', data.videoUrl);
          }
          
          // Mettre à jour le message en base de données avec l'URL de la vidéo
          if (messageDbId) {
            fetch('/api/messages', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messageId: messageDbId,
                videoUrl: data.videoUrl,
              }),
            })
            .then(() => console.log('💾 Message mis à jour en base avec l\'URL vidéo'))
            .catch((updateError) => console.error('❌ Erreur lors de la mise à jour du message:', updateError));
          } else {
            console.warn('⚠️ Pas de dbId pour mettre à jour le message en base');
          }
          
          return prev.map(m =>
            m.id === messageId
              ? { ...m, videoUrl: data.videoUrl, status: 'completed', showVideo: true }
              : m
          );
        });
        pollingRef.current.delete(jobId);
      } else if (data.status === 'failed') {
        console.error('❌ Échec génération vidéo:', data.error);
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, status: 'failed', content: m.content + ` (échec: ${data.error || 'erreur inconnue'})` }
              : m
          )
        );
        pollingRef.current.delete(jobId);
      } else if (attemptCount >= MAX_ATTEMPTS) {
        console.error('⏱️ Timeout: Maximum de tentatives atteint');
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, status: 'failed', content: m.content + ' (timeout: vidéo non générée)' }
              : m
          )
        );
        pollingRef.current.delete(jobId);
      } else {
        // Continuer le polling
        const timer = setTimeout(() => pollJobStatus(jobId, messageId, attemptCount + 1), 2000);
        pollingRef.current.set(jobId, timer);
      }
    } catch (error) {
      console.error('❌ Polling error:', error);
      if (attemptCount >= MAX_ATTEMPTS) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, status: 'failed', content: m.content + ' (erreur polling)' }
              : m
          )
        );
        pollingRef.current.delete(jobId);
      } else {
        const timer = setTimeout(() => pollJobStatus(jobId, messageId, attemptCount + 1), 3000);
        pollingRef.current.set(jobId, timer);
      }
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const generationStartTime = Date.now(); // Début du timer global

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      status: 'completed',
      time: getTime(),
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const loadingMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      status: 'sending',
      time: getTime(),
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Sauvegarder le message de l'utilisateur
      const userId = localStorage.getItem('userId');
      if (userId && !userId.startsWith('user_') && !userId.startsWith('temp_') && !isNaN(Number(userId))) {
        try {
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              characterId: characterId || null,
              storyId: scenario || null,
              role: 'user',
              content: userMessage.content,
            }),
          });
        } catch (saveError) {
          console.error('Erreur lors de la sauvegarde du message utilisateur:', saveError);
        }
      }

      const conversationHistory = messages
        .filter(m => m.status === 'completed')
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch('/api/chat-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          characterId: characterId ? parseInt(characterId, 10) : null,
          userId: userId, // Ajouter userId pour la vérification des crédits
        }),
      });

      const data = await response.json();

      // Gérer l'erreur de crédits insuffisants
      if (response.status === 402 && data.errorCode === 'INSUFFICIENT_CREDITS') {
        setCreditError({
          currentBalance: data.currentBalance,
          required: data.required,
        });
        setShowCreditModal(true);
        // Retirer le message de chargement
        setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }

      const apiTime = Date.now() - generationStartTime;
      console.log('Réponse API reçue:', { 
        aiResponse: data.aiResponse?.substring(0, 50), 
        jobId: data.jobId, 
        vmodelTaskId: data.vmodelTaskId,
        timings: data.timings || null,
        apiTime: `${apiTime}ms (${(apiTime / 1000).toFixed(2)}s)`,
      });

      // Sauvegarder le message de l'assistant et récupérer son ID AVANT de mettre à jour le state
      let savedMessageId: number | null = null;
      if (userId && !userId.startsWith('user_') && !userId.startsWith('temp_') && !isNaN(Number(userId))) {
        try {
          const saveResponse = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              characterId: characterId || null,
              storyId: scenario || null,
              role: 'assistant',
              content: data.aiResponse,
              audioUrl: data.audioUrl || null,
            }),
          });
          if (saveResponse.ok) {
            const saveData = await saveResponse.json();
            if (saveData.success && saveData.message) {
              savedMessageId = saveData.message.id;
              console.log('💾 Message assistant sauvegardé avec ID:', savedMessageId);
            }
          }
        } catch (saveError) {
          console.error('Erreur lors de la sauvegarde du message assistant:', saveError);
        }
      }

      // Maintenant mettre à jour le state avec le dbId récupéré
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: data.aiResponse,
                audioUrl: data.audioUrl,
                jobId: data.jobId,
                status: 'processing',
                dbId: savedMessageId || undefined, // Sauvegarder l'ID du message en base
                generationStartTime: generationStartTime, // Sauvegarder le timestamp de début
              }
            : m
        )
      );

      // Démarrer le polling si on a un jobId (vmodelTaskId ou jobId local)
      if (data.jobId) {
      console.log('✅ Réponse reçue:', {
        texte: data.aiResponse?.substring(0, 100),
        jobId: data.jobId,
        vmodelTaskId: data.vmodelTaskId,
        audioUrl: data.audioUrl ? '✅' : '❌'
      });
      
      // Afficher les informations de debug
      if (data.debug) {
        console.group('🔍 Debug Info');
        console.log('🎤 ElevenLabs:', {
          success: data.debug.elevenlabs?.success ? '✅' : '❌',
          error: data.debug.elevenlabs?.error || 'OK',
          audioSize: data.debug.elevenlabs?.audioSize || 0,
          audioBlobUrl: data.debug.audioBlobUrl ? '✅' : '❌'
        });
        console.log('🎬 VModel.ai:', {
          success: data.debug.vmodel?.success ? '✅' : '❌',
          taskId: data.debug.vmodel?.taskId || 'Aucun',
          error: data.debug.vmodel?.error || 'OK',
          avatarUrl: data.debug.avatarUrl ? '✅' : '❌'
        });
        console.groupEnd();
      }
        console.log('🔄 Démarrage du polling pour jobId:', data.jobId);
        pollJobStatus(data.jobId, assistantMessageId);
      } else {
        console.error('❌ Aucun jobId reçu, pas de polling');
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessageId
              ? { ...m, status: 'failed', content: m.content + ' (erreur: pas de jobId)' }
              : m
          )
        );
      }

    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessageId
            ? { ...m, content: 'Erreur lors de la génération', status: 'failed' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0F0F0F]">
      {/* Header avec design du site - min-h pour garder la barre visible sans logo */}
      <header className="sticky top-0 z-50 flex items-center min-h-[56px] px-4 py-2.5 bg-[#1A1A1A] border-b border-[#2A2A2A] relative">
        <Link href="/" className="absolute left-4 hover:opacity-80 transition-opacity flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#A3A3A3] hover:text-white" />
        </Link>
        <div className="absolute left-12 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#252525] flex items-center justify-center overflow-hidden border border-[#2A2A2A] flex-shrink-0">
            <img 
              src={avatarPhotoUrl || '/avatar-1.png'} 
              alt={characterName || 'Avatar'} 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white font-medium text-sm truncate max-w-[120px]" title={characterName || 'Avatar'}>
            {characterName || 'Avatar'}
          </span>
        </div>
        <div className="flex-1 min-h-[36px]" aria-hidden />
        <div className="absolute right-4 flex items-center gap-3">
          <CreditDisplay compact />
          <button className="p-2 hover:bg-[#252525] rounded-lg transition-colors">
            <Phone className="w-[18px] h-[18px] text-[#A3A3A3] hover:text-[#3BB9FF]" />
          </button>
        </div>
      </header>

      {/* Messages area avec design du site */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#0F0F0F]">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6 py-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A]">
              <p className="text-[#A3A3A3] text-sm">
                Commencez une conversation avec votre avatar IA
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'user' ? (
                /* Message utilisateur (droite) */
                <div className="max-w-[80%] bg-[#3BB9FF] rounded-lg rounded-tr-none px-4 py-2.5 shadow-lg">
                  <p className="text-[#0F0F0F] text-[14.5px] leading-[19px] font-medium">{message.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[11px] text-[#0F0F0F] opacity-70">{message.time}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#0F0F0F] opacity-70" />
                  </div>
                </div>
              ) : (
                /* Message assistant (gauche) */
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1 border border-[#2A2A2A]">
                    <img 
                      src={avatarPhotoUrl || '/avatar-1.png'} 
                      alt={characterName || 'Avatar'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Réponse vidéo : coins arrondis, marge intérieure, horodatage bas gauche, sans fond ni bordure */}
                  {message.videoUrl && message.showVideo ? (
                    <div className="max-w-[80%] rounded-2xl rounded-tl-none overflow-hidden">
                      <div className="p-2">
                        {/* Taille "cadrée" à remettre si besoin : container h-[240px] w-48, video object-cover object-[50%_68%] */}
                        <div
                          className="rounded-xl overflow-hidden bg-black cursor-pointer"
                          onClick={(e) => {
                            const video = (e.currentTarget as HTMLDivElement).querySelector('video');
                            if (!video) return;
                            if (video.paused) video.play();
                            else video.pause();
                          }}
                        >
                          <video
                            key={message.videoUrl}
                            src={message.videoUrl}
                            autoPlay
                            playsInline
                            preload="auto"
                            className="w-48 h-auto min-h-[120px] block"
                            onError={(e) => {
                              console.error('Erreur chargement vidéo:', message.videoUrl, e);
                            }}
                          />
                        </div>
                        <div className="pt-2 flex items-center justify-start">
                          <span className="text-[11px] text-white/80">{message.time}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="max-w-[80%] bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg rounded-tl-none shadow-lg overflow-hidden">
                  {message.status === 'sending' ? (
                    <div className="relative">
                      <video
                        src="/video-1.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-48 h-auto"
                      />
                      <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-[#1A1A1A]/90 border border-[#2A2A2A] rounded-full px-3 py-1.5">
                        <div className="w-2 h-2 bg-[#3BB9FF] rounded-full animate-pulse" />
                        <span className="text-white text-xs font-medium">Génération...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Texte de la réponse (sans vidéo) */}
                          {message.content && (
                            <div className="px-4 py-2.5">
                              <p className="text-white text-[14.5px] leading-[19px]">{message.content}</p>
                              {message.status === 'processing' && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-[#3BB9FF] rounded-full animate-pulse" />
                                  <span className="text-[#A3A3A3] text-xs">Génération de la vidéo...</span>
                                </div>
                              )}
                              <div className="flex items-center justify-end mt-1">
                                <span className="text-[11px] text-[#A3A3A3]">{message.time}</span>
                              </div>
                            </div>
                          )}
                          {/* Audio en arrière-plan seulement si pas de vidéo en cours de génération */}
                          {/* Ne pas jouer l'audio si une vidéo est en cours (jobId présent) */}
                          {message.audioUrl && message.status === 'processing' && !message.jobId && (
                            <audio src={message.audioUrl} autoPlay className="hidden" />
                          )}
                          {/* Si la vidéo a échoué, on peut jouer l'audio */}
                          {message.audioUrl && message.status === 'failed' && !message.videoUrl && (
                            <audio src={message.audioUrl} autoPlay className="hidden" />
                          )}
                        </>
                  )}
                  </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar avec design du site */}
      <div className="px-3 py-2 bg-[#1A1A1A] border-t border-[#2A2A2A] flex items-center gap-2">
        <button className="p-1 hover:bg-[#252525] rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-[#A3A3A3] hover:text-[#3BB9FF]" />
        </button>
        <button className="p-1 hover:bg-[#252525] rounded-lg transition-colors">
          <Paperclip className="w-5 h-5 text-[#A3A3A3] hover:text-[#3BB9FF]" />
        </button>
        <div className="flex-1 bg-[#252525] border border-[#2A2A2A] rounded-lg px-3 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message..."
            disabled={isLoading}
            className="w-full bg-transparent text-white text-[14px] outline-none placeholder-[#A3A3A3] disabled:opacity-50"
          />
        </div>
        {input.trim() ? (
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="p-1 bg-[#3BB9FF] hover:bg-[#2FA9F2] rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button className="p-1 hover:bg-[#252525] rounded-lg transition-colors">
            <Mic className="w-5 h-5 text-[#A3A3A3] hover:text-[#3BB9FF]" />
          </button>
        )}
      </div>

      {/* Modal crédits insuffisants */}
      <InsufficientCreditsModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        currentBalance={creditError?.currentBalance ?? 0}
        required={creditError?.required ?? 1}
      />
    </div>
  );
}
