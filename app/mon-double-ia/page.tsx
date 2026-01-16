'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

interface DoubleData {
  id: number;
  userId: number;
  personality: any;
  styleRules: any;
  messagesCount: number;
  improvementLevel: number;
  createdAt: string;
}

interface UserProfile {
  name: string;
  avatarUrl: string | null;
  firstName: string;
}

interface LastMessage {
  content: string;
  timestamp: Date;
  role: 'user' | 'assistant';
}

interface Personality {
  id: string;
  name: string;
  emoji: string;
  description: string;
  route: string;
}

interface PersonalityLastMessage {
  content: string;
  timestamp: Date;
  role: 'user' | 'assistant';
}

export default function MonDoublePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [doubleData, setDoubleData] = useState<DoubleData | null>(null);
  const [lastMessage, setLastMessage] = useState<LastMessage | null>(null);
  const [personalityLastMessages, setPersonalityLastMessages] = useState<Record<string, PersonalityLastMessage>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasDouble, setHasDouble] = useState(false);

  const personalities: Personality[] = [
    {
      id: 'assistant',
      name: 'Assistant IA',
      emoji: '🤖',
      description: "L'organisateur clair et efficace",
      route: '/mon-double-ia/assistant',
    },
    {
      id: 'coach',
      name: 'Coach IA',
      emoji: '🧠',
      description: 'Le motivateur et boosteur de mindset',
      route: '/mon-double-ia/coach',
    },
    {
      id: 'confident',
      name: 'Confident IA',
      emoji: '🔐',
      description: "L'espace safe et sans jugement",
      route: '/mon-double-ia/confident',
    },
  ];

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    
    // Vérifier si le userId est valide
    const isValidUserId = currentUserId && 
                          !currentUserId.startsWith('user_') && 
                          !currentUserId.startsWith('temp_') &&
                          !isNaN(Number(currentUserId));
    
    if (!isValidUserId) {
      setIsLoading(false);
      return;
    }

    setUserId(currentUserId);

    async function loadData() {
      try {
        // Charger le profil utilisateur
        const profileResponse = await fetch(`/api/user/profile?userId=${currentUserId}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const user = profileData.user || profileData;
          
          const fullName = user.name || '';
          const firstName = fullName.split(' ')[0] || 'Mon Double';
          
          setUserProfile({
            name: fullName,
            avatarUrl: user.avatarUrl || user.avatar_url || null,
            firstName: firstName,
          });
        }

        // Charger le double IA
        const doubleResponse = await fetch(`/api/double-ia/get?userId=${currentUserId}`);
        if (doubleResponse.ok) {
          const doubleResult = await doubleResponse.json();
          if (doubleResult.double) {
            setDoubleData(doubleResult.double);
            setHasDouble(true);

            // Charger le dernier message du double principal
            const messagesResponse = await fetch(`/api/ai-double/messages?userId=${currentUserId}&personalityType=double&lastOnly=true`);
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              if (messagesData.messages && messagesData.messages.length > 0) {
                const latestMsg = messagesData.messages[0];
                setLastMessage({
                  content: latestMsg.content,
                  timestamp: new Date(latestMsg.createdAt || latestMsg.created_at),
                  role: latestMsg.role === 'ai' ? 'assistant' : 'user',
                });
              } else {
                // Si aucun message, afficher un message de bienvenue par défaut
                setLastMessage({
                  content: 'Salut ! Je suis ton double IA. Pose-moi des questions, parlons de tout et de rien ! 😊',
                  timestamp: new Date(),
                  role: 'assistant',
                });
              }
            } else {
              // En cas d'erreur, afficher aussi un message par défaut
              setLastMessage({
                content: 'Salut ! Je suis ton double IA. Pose-moi des questions, parlons de tout et de rien ! 😊',
                timestamp: new Date(),
                role: 'assistant',
              });
            }

            // Charger les derniers messages pour chaque personnalité
            const personalityTypes = ['assistant', 'coach', 'confident'];
            const lastMsgs: Record<string, PersonalityLastMessage> = {};

            await Promise.all(personalityTypes.map(async (pType) => {
              try {
                const response = await fetch(`/api/ai-double/messages?userId=${currentUserId}&personalityType=${pType}&lastOnly=true`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.messages && data.messages.length > 0) {
                    const msg = data.messages[0];
                    lastMsgs[pType] = {
                      content: msg.content,
                      timestamp: new Date(msg.createdAt || msg.created_at),
                      role: msg.role === 'ai' ? 'assistant' : 'user',
                    };
                  }
                }
              } catch (err) {
                console.error(`Erreur chargement messages ${pType}:`, err);
              }
            }));

            setPersonalityLastMessages(lastMsgs);
          } else {
            setHasDouble(false);
          }
        } else {
          setHasDouble(false);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setHasDouble(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}s`;
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handlePersonalityClick = (route: string) => {
    router.push(route);
  };

  const handleDoubleClick = () => {
    router.push('/messages');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-[#1d1d1f] text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e31fc1] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#1d1d1f] text-lg mb-4">Tu dois être connecté pour voir ton double</p>
          <button
            onClick={() => router.push('/compte')}
            className="px-6 py-3 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white rounded-lg font-semibold"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (!hasDouble) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] rounded-full flex items-center justify-center">
            <span className="text-4xl">💬</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] mb-4">
            Crée ton Double IA
          </h1>
          <p className="text-gray-600 mb-8">
            Tu n'as pas encore créé ton double IA. Crée-le en 3 étapes simples !
          </p>
          <button
            onClick={() => router.push('/onboarding-ia')}
            className="px-8 py-4 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white rounded-xl font-semibold"
          >
            Créer mon Double IA
          </button>
        </div>
      </div>
    );
  }

  const doubleName = userProfile?.firstName ? `${userProfile.firstName} IA` : 'Mon Double IA';
  const doubleAvatar = userProfile?.avatarUrl;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#1d1d1f]" />
            </button>
            <h1 className="text-lg font-semibold text-[#1d1d1f]">Messages</h1>
          </div>
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="pb-20">
        {/* Double IA original */}
        <div
          onClick={handleDoubleClick}
          className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="relative w-14 h-14 rounded-full overflow-hidden">
              {doubleAvatar ? (
                <Image
                  src={doubleAvatar}
                  alt={doubleName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {userProfile?.firstName?.[0]?.toUpperCase() || 'IA'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Informations de la conversation */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#1d1d1f] truncate">
                  {userProfile?.firstName || 'Mon Double'}{' '}
                  <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">IA</span>
                </h2>
                {doubleData && doubleData.improvementLevel > 0 && (
                  <span className="text-[#e31fc1] text-xs">✓</span>
                )}
              </div>
              {lastMessage && (
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatTime(lastMessage.timestamp)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 truncate flex-1">
                {lastMessage?.role === 'user' ? 'Tu: ' : ''}
                {lastMessage?.content && lastMessage.content.length > 50
                  ? lastMessage.content.substring(0, 50) + '...'
                  : lastMessage?.content || 'Salut ! Je suis ton double IA. Pose-moi des questions, parlons de tout et de rien ! 😊'}
              </p>
              {lastMessage && lastMessage.role === 'assistant' && (
                <div className="w-2 h-2 bg-gradient-to-r from-[#e31fc1] to-[#ff6b9d] rounded-full flex-shrink-0"></div>
              )}
            </div>
          </div>
        </div>

        {/* Les 3 personnalités */}
        {personalities.map((personality) => {
          const lastMsg = personalityLastMessages[personality.id];
          return (
            <div
              key={personality.id}
              onClick={() => handlePersonalityClick(personality.route)}
              className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center" style={{
                  backgroundColor: personality.id === 'assistant' ? '#000000' :
                                   personality.id === 'coach' ? '#bbf7d0' :
                                   '#ef4444'
                }}>
                  <span className="text-2xl">{personality.emoji}</span>
                </div>
              </div>

              {/* Informations de la conversation */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-[#1d1d1f] truncate">
                      {personality.name.split(' IA')[0]}{' '}
                      <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">IA</span>
                    </h2>
                  </div>
                  {lastMsg && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(lastMsg.timestamp)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600 truncate flex-1">
                    {lastMsg ? (
                      <>
                        {lastMsg.role === 'user' ? 'Tu: ' : ''}
                        {lastMsg.content.length > 50
                          ? lastMsg.content.substring(0, 50) + '...'
                          : lastMsg.content}
                      </>
                    ) : (
                      personality.description
                    )}
                  </p>
                  {lastMsg && lastMsg.role === 'assistant' && (
                    <div className="w-2 h-2 bg-gradient-to-r from-[#e31fc1] to-[#ff6b9d] rounded-full flex-shrink-0"></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Première case : Bouton partager */}
        <div className="flex items-center justify-center px-4 py-3 bg-white border-b border-gray-200">
          {/* Bouton partager */}
          <button
            onClick={() => {
              // Fonctionnalité de partage (peut être connectée à la fonction shareToInstagram de messages/page.tsx)
              console.log('Partager');
            }}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition-colors"
          >
            inviter des amis
          </button>
        </div>

        {/* Deuxième case : Texte informatif */}
        <div className="flex items-center justify-center px-4 py-3 bg-white border-b border-gray-200">
          {/* Texte informatif */}
          <p className="text-sm text-gray-600 text-center">
            Parle avec ton double, pour que tes cartes s'améliorent 😉
          </p>
        </div>
      </div>
    </div>
  );
}
