'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Mic, MicOff, ArrowLeft, Phone, PhoneOff, Camera, FileText, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Message } from '@/lib/types';

export default function ConfidentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showQuizMenu, setShowQuizMenu] = useState(false);

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    const isValidUserId = currentUserId && 
                          !currentUserId.startsWith('user_') && 
                          !currentUserId.startsWith('temp_') &&
                          !isNaN(Number(currentUserId));
    
    if (!isValidUserId) {
      router.push('/compte');
      return;
    }

    setUserId(currentUserId);

    async function loadData() {
      try {
        const profileResponse = await fetch(`/api/user/profile?userId=${currentUserId}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const user = profileData.user || profileData;
          
          if (user.avatarUrl || user.avatar_url) {
            setUserAvatar(user.avatarUrl || user.avatar_url);
          }
          if (user.name || profileData.name) {
            const fullName = user.name || profileData.name;
            const firstName = fullName.split(' ')[0];
            setUserFirstName(firstName);
          }
        }

        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: 'Salut ! Je suis ton Confident IA 🔐. Je suis là pour t\'écouter sans jugement, dans un espace sûr et bienveillant. Tu peux me confier ce que tu veux, je suis là pour toi. 💙',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Erreur:', error);
      }
    }

    loadData();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCameraMenu && !target.closest('.relative')) {
        setShowCameraMenu(false);
      }
      if (showQuizMenu && !target.closest('.relative')) {
        setShowQuizMenu(false);
      }
    };

    if (showCameraMenu || showQuizMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCameraMenu, showQuizMenu]);

  const toggleRecording = async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          try {
            const response = await fetch('/api/ai-double/speech-to-text', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              setInput(data.text);
            } else {
              alert('Erreur lors de la transcription audio');
            }
          } catch (error) {
            console.error('Erreur transcription:', error);
            alert('Erreur lors de la transcription audio');
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        console.error('Erreur accès micro:', error);
        alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
      }
    }
  };

  const openGallery = () => {
    setShowCameraMenu(false);
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    setShowCameraMenu(false);
    cameraInputRef.current?.click();
  };

  const toggleCameraMenu = () => {
    setShowCameraMenu(!showCameraMenu);
    setShowQuizMenu(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[Image: ${file.name}]`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: "J'ai bien reçu ton image ! 📸",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  };

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
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      const response = await fetch('/api/ai-double/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: currentInput,
          conversationHistory,
          personalityType: 'confident',
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

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/mon-double-ia')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>

          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <div className="w-full h-full bg-red-500 flex items-center justify-center">
              <span className="text-xl">🔐</span>
            </div>
          </div>

          <div className="flex-1">
            <h2 className="font-bold text-base text-gray-900">
              Confident <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">IA</span>
            </h2>
            <p className="text-xs text-gray-500">
              L'espace safe et sans jugement
            </p>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pt-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } animate-fadeIn`}
            >
              <div className={`flex gap-2 ${
                message.role === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[85%] md:max-w-[75%]'
              }`}>
                {message.role === 'assistant' && (
                  <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex-shrink-0 self-end mb-1">
                    <div className="w-full h-full bg-red-500 flex items-center justify-center">
                      <span className="text-sm">🔐</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1 min-w-0">
                  <div
                    className={`
                      inline-block px-4 py-2.5
                      ${message.role === 'user'
                        ? 'bg-gradient-to-br from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white rounded-[20px] rounded-tr-md shadow-lg'
                        : 'bg-white text-gray-900 rounded-[20px] rounded-tl-md shadow-md border border-gray-100'
                      }
                      transition-all duration-200 hover:shadow-xl
                    `}
                  >
                    <div className={`${
                      message.role === 'user' ? 'text-[15px]' : 'text-[15px]'
                    } whitespace-pre-wrap break-words leading-relaxed`}>
                      {message.content}
                    </div>
                  </div>
                  <p
                    className={`text-[11px] px-2 ${
                      message.role === 'user'
                        ? 'text-right text-gray-500'
                        : 'text-left text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {message.role === 'user' && userAvatar && (
                  <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex-shrink-0 self-end mb-1">
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
            <div className="flex justify-start animate-fadeIn">
              <div className="flex gap-2 max-w-[85%] md:max-w-[75%]">
                <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex-shrink-0 self-end mb-1">
                  <div className="w-full h-full bg-red-500 flex items-center justify-center">
                    <span className="text-sm">🔐</span>
                  </div>
                </div>

                <div className="bg-white rounded-[20px] rounded-tl-md px-5 py-3 shadow-md border border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#e31fc1] to-[#ff6b9d] rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#ff6b9d] to-[#ffc0cb] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#e31fc1] to-[#ff6b9d] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 fixed bottom-0 left-0 right-0 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex gap-2 items-center">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="relative">
            <button
              onClick={() => {
                setShowQuizMenu(!showQuizMenu);
                setShowCameraMenu(false);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 relative"
              title="Quiz"
            >
              <FileText size={18} />
            </button>
            {showQuizMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[180px] z-50">
                <button
                  onClick={() => setShowQuizMenu(false)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                >
                  Quiz Personnalité
                </button>
                <button
                  onClick={() => setShowQuizMenu(false)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                >
                  Quiz Souvenir
                </button>
                <button
                  onClick={() => setShowQuizMenu(false)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                >
                  Quiz Identité
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={toggleCameraMenu}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Photo"
            >
              <Camera size={18} />
            </button>
            {showCameraMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-50">
                <button
                  onClick={openCamera}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2"
                >
                  <Camera size={16} />
                  Appareil photo
                </button>
                <button
                  onClick={openGallery}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2"
                >
                  <ImageIcon size={16} />
                  Galerie
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggleRecording}
            className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors ${
              isRecording ? 'text-red-500 bg-red-50' : 'text-gray-600'
            }`}
            title={isRecording ? 'Arrêter l\'enregistrement' : 'Reconnaissance vocale'}
          >
            {isRecording ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
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
            className="resize-none rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 px-3 py-2 flex-1 focus:outline-none focus:border-[#e31fc1] focus:bg-white transition-colors min-h-[40px] text-sm"
            rows={1}
            disabled={isLoading}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}
