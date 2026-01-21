'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  loading?: boolean;
  time: string;
}

export default function ChatVideoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getTime = () => {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      time: getTime(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      loading: true,
      time: getTime(),
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => !m.loading)
        .map(m => ({
          role: m.role,
          content: m.role === 'user' ? m.content : m.content,
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

      const assistantMessage: Message = {
        id: loadingMessage.id,
        role: 'assistant',
        content: data.aiResponse,
        videoUrl: data.videoUrl,
        audioUrl: data.audioUrl,
        time: getTime(),
      };

      setMessages(prev =>
        prev.map(m => (m.id === loadingMessage.id ? assistantMessage : m))
      );
    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMessage.id
            ? { ...m, content: 'Erreur lors de la génération', loading: false }
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
    <div
      className="flex flex-col h-screen"
      style={{
        backgroundColor: '#0b141a',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
      }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div
              className="text-center px-8 py-6 rounded-lg"
              style={{ backgroundColor: 'rgba(17, 27, 33, 0.9)' }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-300 text-lg font-medium">Chat Video IA</p>
              <p className="text-gray-500 text-sm mt-1">Envoyez un message pour recevoir une reponse video</p>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-2">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'user' ? (
                <div
                  className="max-w-[75%] rounded-lg px-3 py-2 shadow-sm"
                  style={{
                    backgroundColor: '#005c4b',
                    borderTopRightRadius: '4px'
                  }}
                >
                  <p className="text-gray-100 text-sm">{message.content}</p>
                  <p className="text-right text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {message.time}
                  </p>
                </div>
              ) : (
                <div
                  className="max-w-[75%] rounded-lg shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: '#202c33',
                    borderTopLeftRadius: '4px'
                  }}
                >
                  {message.loading ? (
                    <div className="px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ backgroundColor: '#00a884', animationDelay: '0ms' }}
                        />
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ backgroundColor: '#00a884', animationDelay: '150ms' }}
                        />
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ backgroundColor: '#00a884', animationDelay: '300ms' }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs">Generation video...</span>
                    </div>
                  ) : (
                    <>
                      {message.videoUrl ? (
                        <video
                          src={message.videoUrl}
                          controls
                          autoPlay
                          playsInline
                          className="w-44 h-auto"
                          style={{ maxHeight: '160px', display: 'block' }}
                        />
                      ) : message.audioUrl ? (
                        <div className="px-3 py-2">
                          <audio src={message.audioUrl} controls autoPlay className="w-40 h-8" />
                        </div>
                      ) : null}
                      {message.content && (
                        <div className="px-3 py-2">
                          <p className="text-gray-200 text-sm">{message.content}</p>
                          <p className="text-right text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {message.time}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar - Style WhatsApp */}
      <div className="px-4 py-3" style={{ backgroundColor: '#202c33' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div
            className="flex-1 flex items-center rounded-full px-4"
            style={{ backgroundColor: '#2a3942' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message"
              disabled={isLoading}
              className="flex-1 bg-transparent text-gray-100 py-3 outline-none placeholder-gray-500 text-sm disabled:opacity-50"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#00a884' }}
          >
            {isLoading ? (
              <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
