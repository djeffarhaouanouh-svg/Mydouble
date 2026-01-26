'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Phone, MoreVertical, Paperclip, Mic, Send, Check, CheckCheck } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  jobId?: string;
  status: 'sending' | 'processing' | 'completed' | 'failed';
  time: string;
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
  const [displayedText, setDisplayedText] = useState("");
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

  // Gérer la visibilité du header au scroll (même effet que page.tsx)
  useEffect(() => {
    const messagesContainer = document.querySelector('.flex-1.overflow-y-auto');
    
    const handleScroll = () => {
      if (!messagesContainer) return;
      
      const target = messagesContainer as HTMLElement;
      const currentScrollY = target.scrollTop;
      
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => messagesContainer.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  // Récupérer characterId et storyId depuis l'URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('characterId');
      const storyIdParam = params.get('storyId');
      setCharacterId(id);
      setScenario(storyIdParam);
    }
  }, []);

  // Effet typewriter pour le logo
  useEffect(() => {
    const fullText = "swayco.ai";
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100); // 100ms entre chaque lettre

    return () => clearInterval(typeInterval);
  }, []);

  // Charger les informations du personnage/scénario et enregistrer la conversation
  useEffect(() => {
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
          // Récupérer tous les personnages (publics et privés)
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
          
          // Si pas trouvé dans les publics, essayer les privés
          if (name === 'Avatar') {
            const userId = localStorage.getItem('userId');
            if (userId) {
              const privateResponse = await fetch(`/api/characters?isPublic=false&userId=${userId}`);
              const privateData = await privateResponse.json();
              if (privateData.success && privateData.avatars) {
                const character = privateData.avatars.find((a: any) => a.id === parseInt(characterId));
                if (character) {
                  name = character.name;
                  photoUrl = character.photoUrl || '/avatar-1.png';
                  setCharacterName(name);
                  setAvatarPhotoUrl(photoUrl);
                }
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
      
      const conversation = {
        id: conversationId,
        characterId: characterId || null,
        storyId: scenario || null,
        name: name,
        photoUrl: photoUrl,
        timestamp: new Date().toISOString(),
        lastMessage: '',
      };

      // Récupérer les conversations existantes
      const existingConversations = JSON.parse(
        localStorage.getItem('recentConversations') || '[]'
      );

      // Retirer la conversation si elle existe déjà
      const filtered = existingConversations.filter(
        (c: any) => c.id !== conversation.id
      );

      // Ajouter la nouvelle conversation en premier
      const updated = [conversation, ...filtered].slice(0, 10); // Garder max 10 conversations

      // Sauvegarder dans localStorage
      localStorage.setItem('recentConversations', JSON.stringify(updated));
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new Event('conversationsUpdated'));
    };

    loadCharacterAndSaveConversation();
  }, [characterId, scenario]);

  const pollJobStatus = useCallback(async (jobId: string, messageId: string) => {
    try {
      const response = await fetch(`/api/chat-video/status?jobId=${jobId}`);
      const data = await response.json();

      if (data.status === 'completed' && data.videoUrl) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, videoUrl: data.videoUrl, status: 'completed' }
              : m
          )
        );
        pollingRef.current.delete(jobId);
      } else if (data.status === 'failed') {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, status: 'failed', content: m.content + ' (échec vidéo)' }
              : m
          )
        );
        pollingRef.current.delete(jobId);
      } else {
        const timer = setTimeout(() => pollJobStatus(jobId, messageId), 2000);
        pollingRef.current.set(jobId, timer);
      }
    } catch (error) {
      console.error('Polling error:', error);
      const timer = setTimeout(() => pollJobStatus(jobId, messageId), 3000);
      pollingRef.current.set(jobId, timer);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: data.aiResponse,
                audioUrl: data.audioUrl,
                jobId: data.jobId,
                status: 'processing',
              }
            : m
        )
      );

      if (data.jobId) {
        pollJobStatus(data.jobId, assistantMessageId);
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
      {/* Header avec design du site */}
      <div className={`sticky top-0 z-50 flex items-center px-4 py-3 bg-[#1A1A1A] border-b border-[#2A2A2A] transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <Link href="/" className="mr-3 hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-6 h-6 text-[#A3A3A3] hover:text-white" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center mr-3 overflow-hidden border border-[#2A2A2A]">
          <img 
            src="/avatar-1.png" 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center">
            <svg width="140" height="36" viewBox="0 0 1400 360" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="swayBlueChat" x1="0" y1="0" x2="1400" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0B2030"/>
                  <stop offset="18%" stopColor="#124B6B"/>
                  <stop offset="35%" stopColor="#1E7FB0"/>
                  <stop offset="55%" stopColor="#3BB9FF"/>
                  <stop offset="70%" stopColor="#2FA9F2"/>
                  <stop offset="85%" stopColor="#A9E8FF"/>
                  <stop offset="94%" stopColor="#F6FDFF"/>
                  <stop offset="100%" stopColor="#FFFFFF"/>
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="transparent"/>
              <text x="50%" y="60%" textAnchor="middle"
                fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
                fontSize="170" fontWeight="800">
                {displayedText.length <= 6 ? (
                  <tspan fill="transparent" stroke="white" strokeWidth="7" strokeLinejoin="round">
                    {displayedText}
                  </tspan>
                ) : (
                  <>
                    <tspan fill="transparent" stroke="white" strokeWidth="7" strokeLinejoin="round">
                      {displayedText.substring(0, 6)}
                    </tspan>
                    <tspan fill="transparent" stroke="url(#swayBlueChat)" strokeWidth="7" strokeLinejoin="round">
                      {displayedText.substring(6)}
                    </tspan>
                  </>
                )}
              </text>
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-[#252525] rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-[#A3A3A3] hover:text-[#3BB9FF]" />
          </button>
        </div>
      </div>

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
                /* Message utilisateur (droite - bleu accent) */
                <div className="max-w-[80%] bg-[#3BB9FF] rounded-lg rounded-tr-none px-4 py-2.5 shadow-lg">
                  <p className="text-[#0F0F0F] text-[14.5px] leading-[19px] font-medium">{message.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[11px] text-[#0F0F0F] opacity-70">{message.time}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#0F0F0F] opacity-70" />
                  </div>
                </div>
              ) : (
                /* Message assistant (gauche - design du site) */
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1 border border-[#2A2A2A]">
                    <img 
                      src="/avatar-1.png" 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
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
                      {message.videoUrl ? (
                        <video
                          src={message.videoUrl}
                          controls
                          autoPlay
                          playsInline
                          className="w-48 h-auto"
                        />
                      ) : message.status === 'processing' ? (
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
                            <span className="text-white text-xs font-medium">Vidéo en cours...</span>
                          </div>
                          {message.audioUrl && (
                            <audio src={message.audioUrl} autoPlay className="hidden" />
                          )}
                        </div>
                      ) : message.audioUrl ? (
                        <div className="px-3 py-2">
                          <audio src={message.audioUrl} controls autoPlay className="w-44 h-8" />
                        </div>
                      ) : null}

                      {message.content && (
                        <div className="px-4 py-2.5">
                          <p className="text-white text-[14.5px] leading-[19px]">{message.content}</p>
                          <div className="flex items-center justify-end mt-1">
                            <span className="text-[11px] text-[#A3A3A3]">{message.time}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  </div>
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
    </div>
  );
}
