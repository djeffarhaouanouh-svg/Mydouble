"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Volume2, User, Sparkles, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export default function MonDoubleIA() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }

    // Charger l'historique des messages
    loadMessages();

    // Message de bienvenue si première fois
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "ai",
          content: "Salut ! Je suis ton double IA. Pose-moi n'importe quelle question ou discutons de ce que tu veux ! Plus on parle, mieux je te comprends. 😊",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/ai-double/messages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/ai-double/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message: input,
          conversationHistory: messages.slice(-10), // Garder les 10 derniers messages pour le contexte
        }),
      });

      if (!response.ok) throw new Error('Erreur de réponse');

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.response,
        timestamp: new Date(),
        audioUrl: data.audioUrl, // URL audio de ElevenLabs si disponible
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Sauvegarder dans la base de données
      await fetch('/api/ai-double/save-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          messages: [userMessage, aiMessage],
        }),
      });

    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Désolé, j'ai rencontré une erreur. Peux-tu réessayer ?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      // Arrêter la lecture
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      // Lire l'audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingAudio(null);
      };
      
      audio.play();
      setPlayingAudio(messageId);
    }
  };

  const resetConversation = () => {
    if (confirm("Veux-tu vraiment réinitialiser la conversation ?")) {
      setMessages([
        {
          id: "welcome",
          role: "ai",
          content: "Conversation réinitialisée ! Repartons sur de nouvelles bases. 😊",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-black to-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Mon Double IA</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-xs text-gray-400">En ligne • S'améliore en temps réel</p>
                </div>
              </div>
            </div>

            <button
              onClick={resetConversation}
              className="p-2 rounded-lg hover:bg-gray-900 transition-colors"
              title="Réinitialiser la conversation"
            >
              <RotateCcw className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 mb-6 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[75%] ${
                    message.role === "user"
                      ? "bg-gray-800 rounded-2xl rounded-tr-sm"
                      : "bg-gradient-to-r from-[#e31fc1]/20 via-[#ff6b9d]/20 to-[#ffc0cb]/20 border border-[#e31fc1]/30 rounded-2xl rounded-tl-sm"
                  }`}
                >
                  <div className="px-5 py-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  {message.audioUrl && message.role === "ai" && (
                    <div className="px-5 pb-3">
                      <button
                        onClick={() => playAudio(message.audioUrl!, message.id)}
                        className="flex items-center gap-2 text-xs text-[#e31fc1] hover:text-[#ff6b9d] transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                        {playingAudio === message.id ? "⏸️ Pause" : "▶️ Écouter"}
                      </button>
                    </div>
                  )}

                  <p className="px-5 pb-2 text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 mb-6"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gradient-to-r from-[#e31fc1]/20 via-[#ff6b9d]/20 to-[#ffc0cb]/20 border border-[#e31fc1]/30 rounded-2xl rounded-tl-sm px-5 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#e31fc1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-[#ff6b9d] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-[#ffc0cb] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-gradient-to-t from-black to-black/95 backdrop-blur-sm border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden focus-within:border-[#e31fc1] transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Écris ton message..."
                disabled={isLoading}
                rows={1}
                className="w-full px-5 py-4 bg-transparent resize-none focus:outline-none text-sm max-h-32"
                style={{ minHeight: '56px' }}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:scale-105 transition-transform flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            💡 Plus tu discutes, plus ton double IA devient précis et personnalisé
          </p>
        </div>
      </div>
    </div>
  );
}
