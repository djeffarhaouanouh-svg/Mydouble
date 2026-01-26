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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPhotoUrl, setAvatarPhotoUrl] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
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

  // Gérer la visibilité du header au scroll
  useEffect(() => {
    const messagesContainer = document.querySelector('.flex-1.overflow-y-auto');
    
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
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

  // Charger la photo du personnage
  useEffect(() => {
    const loadAvatarPhoto = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const response = await fetch(`/api/avatar-visio/create-avatar?userId=${userId}`);
        const data = await response.json();
        if (data.photoUrl) {
          setAvatarPhotoUrl(data.photoUrl);
        }
      } catch (error) {
        console.error('Erreur chargement photo avatar:', error);
      }
    };

    loadAvatarPhoto();
  }, []);

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
    <div className="flex flex-col h-screen bg-[#0b141a]">
      {/* Header WhatsApp style */}
      <div className={`sticky top-0 z-50 flex items-center px-4 py-2 bg-[#202c33] transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <Link href="/" className="mr-2">
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3 overflow-hidden">
          <img 
            src="/avatar-1.png" 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-5">
          <Phone className="w-6 h-6 text-gray-400" />
          <MoreVertical className="w-6 h-6 text-gray-400" />
        </div>
      </div>

      {/* Messages area avec pattern WhatsApp */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='412' height='412' viewBox='0 0 412 412' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M206 0c113.8 0 206 92.2 206 206s-92.2 206-206 206S0 319.8 0 206 92.2 0 206 0z' fill='%230d1418' fill-opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundColor: '#0b141a'
        }}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6 py-4 rounded-lg bg-[#182229]">
              <p className="text-gray-400 text-sm">
                Les messages sont chiffrés de bout en bout. Personne en dehors de ce chat ne peut les lire.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'user' ? (
                /* Message utilisateur (droite - vert) */
                <div className="max-w-[80%] bg-[#005c4b] rounded-lg rounded-tr-none px-3 py-1.5 shadow">
                  <p className="text-[#e9edef] text-[14.5px] leading-[19px]">{message.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[11px] text-[#ffffff99]">{message.time}</span>
                    <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                  </div>
                </div>
              ) : (
                /* Message assistant (gauche - gris foncé) */
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1">
                    <img 
                      src="/avatar-1.png" 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="max-w-[80%] bg-[#202c33] rounded-lg rounded-tl-none shadow overflow-hidden">
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
                      <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 rounded-full px-2 py-1">
                        <div className="w-2 h-2 bg-[#25d366] rounded-full animate-pulse" />
                        <span className="text-white text-xs">Génération...</span>
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
                          <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 rounded-full px-2 py-1">
                            <div className="w-2 h-2 bg-[#25d366] rounded-full animate-pulse" />
                            <span className="text-white text-xs">Vidéo en cours...</span>
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
                        <div className="px-3 py-1.5">
                          <p className="text-[#e9edef] text-[14.5px] leading-[19px]">{message.content}</p>
                          <div className="flex items-center justify-end mt-0.5">
                            <span className="text-[11px] text-[#ffffff73]">{message.time}</span>
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

      {/* Input Bar WhatsApp style */}
      <div className="px-2 py-2 bg-[#202c33] flex items-center gap-2">
        <button className="p-2">
          <Paperclip className="w-6 h-6 text-[#8696a0]" />
        </button>
        <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            disabled={isLoading}
            className="w-full bg-transparent text-[#e9edef] text-[15px] outline-none placeholder-[#8696a0] disabled:opacity-50"
          />
        </div>
        {input.trim() ? (
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="p-2"
          >
            <Send className="w-6 h-6 text-[#8696a0]" />
          </button>
        ) : (
          <button className="p-2">
            <Mic className="w-6 h-6 text-[#8696a0]" />
          </button>
        )}
      </div>
    </div>
  );
}
