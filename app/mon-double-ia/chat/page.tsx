'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useRef, Suspense } from 'react';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { Message } from '@/lib/types';
import Button from '@/components/ui/Button';

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const doubleId = searchParams?.get('id');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [doubleInfo, setDoubleInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  if (!doubleId) {
    router.push('/');
    return null;
  }

  /* ---------------------------- Charger avatar utilisateur --------------------------- */
  useEffect(() => {
    async function loadUserAvatar() {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const response = await fetch(`/api/user/stats?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.user?.avatar_url) {
            setUserAvatar(data.user.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading user avatar:', error);
      }
    }

    loadUserAvatar();
  }, []);

  /* ---------------------------- Chargement session --------------------------- */
  useEffect(() => {
    if (!doubleId) return;

    async function loadMessages() {
      const currentUserId = localStorage.getItem('userId');
      setUserId(currentUserId);

      try {
        // Charger les infos du double
        const doubleResponse = await fetch(`/api/double-ia/get?id=${doubleId}`);
        if (doubleResponse.ok) {
          const doubleData = await doubleResponse.json();
          setDoubleInfo(doubleData.double);
        }

        // Charger les messages existants depuis la DB
        const messagesResponse = await fetch(
          `/api/double-ia/messages?doubleId=${doubleId}${currentUserId ? `&userId=${currentUserId}` : ''}`
        );

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();

          if (messagesData.messages && messagesData.messages.length > 0) {
            // Charger l'historique existant
            const loadedMessages: Message[] = messagesData.messages.map((msg: any) => ({
              id: msg.id.toString(),
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            }));
            setMessages(loadedMessages);
          } else {
            // Aucun historique, afficher message de bienvenue
            const welcomeMessage: Message = {
              id: 'welcome',
              role: 'assistant',
              content: 'Salut ! Je suis ton double IA. Pose-moi des questions, parlons de tout et de rien ! 😊',
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        // En cas d'erreur, afficher au moins le message de bienvenue
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: 'Salut ! Je suis ton double IA. Pose-moi des questions, parlons de tout et de rien ! 😊',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    }

    loadMessages();
  }, [doubleId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ------------------------------- Envoi message ----------------------------- */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/double-ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubleId,
          message: userMessage.content,
          history: messages
            .filter(m => m.id !== 'welcome') // Exclure le message de bienvenue
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          userId,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      const data = await response.json();

      // Mettre à jour le conversationId si retourné
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oups, petit souci 😅 Réessaie dans un instant !",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }

    setIsLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft size={20} />
            </Button>

            <div
              className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
            >
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt="Mon Double IA"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center text-white font-bold">
                  IA
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h2 className="font-semibold text-gray-900">{doubleInfo?.name || 'Mon Double IA'}</h2>
              <p className="text-xs text-green-600">En ligne</p>
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="flex gap-3 max-w-[70%]">
                {message.role === 'assistant' && (
                  <div
                    className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                  >
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt="Mon Double IA"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center text-white font-bold text-sm">
                        IA
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-[#E31FC1] text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>

                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-[#FFE4F7]'
                          : 'text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {message.role === 'user' && userAvatar && (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#E31FC1]">
                    <Image
                      src={userAvatar}
                      alt="Votre avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[70%]">
                <div
                  className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                >
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt="Mon Double IA"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center text-white font-bold text-sm">
                      IA
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-2 items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Écris ton message..."
            className="resize-none rounded-2xl border px-4 py-3 text-gray-900 flex-1"
            rows={1}
            disabled={isLoading}
          />

          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 shrink-0"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#e31fc1] animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
