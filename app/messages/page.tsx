'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ArrowLeft, Paperclip, Mic, Plus, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Message } from '@/lib/types';
import Button from '@/components/ui/Button';

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    // Créer un userId s'il n'existe pas
    let currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      currentUserId = `user_${Date.now()}`;
      localStorage.setItem('userId', currentUserId);
    }

    setUserId(currentUserId);

    // Charger l'avatar utilisateur
    async function loadUserAvatar() {
      try {
        const response = await fetch(`/api/user/profile?userId=${currentUserId}`);
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
    
    // Message de bienvenue
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Salut ! Je suis ton double IA. Pose-moi des questions, parlons de tout et de rien ! 😊',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !userId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Préparer l'historique (exclure le message de bienvenue)
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      // Appeler l'API chat
      const response = await fetch('/api/ai-double/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: currentInput,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Erreur:', error);
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

  if (isInitializing) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e31fc1] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#e31fc1] flex-shrink-0">
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

          <div className="flex-1">
            <h2 className="font-bold text-lg text-gray-900">
              Mon Double <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">IA</span>
            </h2>
            <p className="text-xs text-green-600">En ligne</p>
          </div>

          {/* Icône appel en haut à droite */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-gray-900" />
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pt-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="flex gap-3 max-w-[75%]">
                {message.role === 'assistant' && (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#e31fc1] flex-shrink-0">
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
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white'
                        : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'user'
                          ? 'text-white/70'
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
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#e31fc1] flex-shrink-0">
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
              <div className="flex gap-3 max-w-[75%]">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#e31fc1] flex-shrink-0">
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

                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#e31fc1] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#e31fc1] rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-[#e31fc1] rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 fixed bottom-20 left-0 right-0 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex gap-2 items-center">
          {/* Bouton Plus pour menu */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
            <Plus size={24} />
          </button>

          {/* Icônes d'action */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
            <Paperclip size={24} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
            <Mic size={24} />
          </button>

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
            className="resize-none rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 px-4 py-3 flex-1 focus:outline-none focus:border-[#e31fc1] focus:bg-white transition-colors min-h-[48px]"
            rows={1}
            disabled={isLoading}
          />

          {/* Bouton d'envoi */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </main>
  );
}
