'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Mic, MicOff, ArrowLeft, Phone, PhoneOff, Camera, FileText, Image as ImageIcon, User, Mail, Lock, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Message } from '@/lib/types';
import Vapi from '@vapi-ai/web';

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showQuizMenu, setShowQuizMenu] = useState(false);

  const [showInscription, setShowInscription] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    let currentUserId = localStorage.getItem('userId');
    if (!currentUserId || currentUserId.startsWith('user_') || currentUserId.startsWith('temp_')) {
      // Si pas de userId valide, afficher le formulaire d'inscription
      setShowInscription(true);
      setIsInitializing(false);
      return;
    }

    setUserId(currentUserId);

    // Charger l'avatar et le prénom utilisateur
    async function loadUserProfile() {
      try {
        const response = await fetch(`/api/user/profile?userId=${currentUserId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.user?.avatar_url) {
            setUserAvatar(data.user.avatar_url);
          }
          // Extraire le prénom depuis le nom complet
          if (data.user?.name || data.name) {
            const fullName = data.user?.name || data.name;
            const firstName = fullName.split(' ')[0];
            setUserFirstName(firstName);
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }

    loadUserProfile();

    // Message de bienvenue
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Salut ! Je suis ton double IA. Pose-moi des questions, parlons de tout et de rien ! 😊',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setIsInitializing(false);

    // Initialiser VAPI avec le voiceId de l'utilisateur
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (publicKey) {
      // Stocker la clé dans une constante locale pour garantir le type
      const vapiPublicKey: string = publicKey;
      
      // Charger le voiceId depuis le profil utilisateur
      async function initVapiWithVoice() {
        try {
          const profileResponse = await fetch(`/api/user/profile?userId=${currentUserId}`);
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const user = profileData.user || profileData;
            const voiceId = user.voiceId;

            const vapiInstance = new Vapi(vapiPublicKey);
            setVapi(vapiInstance);

            // Écouter les événements VAPI
            vapiInstance.on('call-start', () => {
              setIsCallActive(true);
              console.log('Appel démarré');
            });

            vapiInstance.on('call-end', () => {
              setIsCallActive(false);
              console.log('Appel terminé');
            });

            vapiInstance.on('speech-start', () => {
              console.log('L\'assistant parle');
            });

            vapiInstance.on('speech-end', () => {
              console.log('L\'assistant a fini de parler');
            });

            vapiInstance.on('message', (message: any) => {
              console.log('Message reçu:', message);
            });

            vapiInstance.on('error', (error: any) => {
              console.error('Erreur VAPI:', error);
              setIsCallActive(false);
            });

            // Stocker le voiceId pour l'utiliser lors de l'appel
            if (voiceId) {
              (vapiInstance as any).voiceId = voiceId;
            }
          } else {
            // Initialiser VAPI sans voiceId si le profil n'est pas disponible
            const vapiInstance = new Vapi(vapiPublicKey);
            setVapi(vapiInstance);
          }
        } catch (error) {
          console.error('Erreur lors du chargement du profil pour VAPI:', error);
          // Initialiser VAPI quand même
          const vapiInstance = new Vapi(vapiPublicKey);
          setVapi(vapiInstance);
        }
      }

      initVapiWithVoice();
    }
  }, []);

  // Fermer les menus quand on clique ailleurs
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fonction pour démarrer/arrêter l'enregistrement vocal avec ElevenLabs
  const toggleRecording = async () => {
    if (isRecording && mediaRecorder) {
      // Arrêter l'enregistrement
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      // Démarrer l'enregistrement
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
          // Arrêter tous les tracks pour libérer le micro
          stream.getTracks().forEach(track => track.stop());

          // Créer un blob audio
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });

          // Envoyer à l'API pour transcription avec ElevenLabs
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

  // Fonction pour ouvrir la galerie photo
  const openGallery = () => {
    setShowCameraMenu(false);
    fileInputRef.current?.click();
  };

  // Fonction pour ouvrir l'appareil photo
  const openCamera = () => {
    setShowCameraMenu(false);
    cameraInputRef.current?.click();
  };

  // Fonction pour ouvrir le menu appareil photo
  const toggleCameraMenu = () => {
    setShowCameraMenu(!showCameraMenu);
    setShowQuizMenu(false);
  };

  // Fonction pour ouvrir un quiz
  const openQuiz = (quizType: 'personnalite' | 'souvenir' | 'identite') => {
    setShowQuizMenu(false);
    // Envoyer un message pour lancer le quiz
    const quizMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Je veux faire le quiz ${quizType === 'personnalite' ? 'personnalité' : quizType === 'souvenir' ? 'souvenir' : 'identité'}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, quizMessage]);
    // Envoyer le message à l'API
    sendQuizMessage(quizType);
  };

  // Fonction pour envoyer un message de quiz
  const sendQuizMessage = async (quizType: string) => {
    setIsLoading(true);
    try {
      // Appeler l'API dédiée pour les quiz qui appelle Claude directement
      const response = await fetch('/api/ai-double/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          quizType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du lancement du quiz');
      }
    } catch (error: any) {
      console.error('Erreur envoi quiz:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Désolé, une erreur est survenue lors du lancement du quiz : ${error.message || 'Erreur inconnue'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour démarrer/arrêter un appel VAPI
  const toggleCall = async () => {
    if (!vapi) {
      alert('VAPI n\'est pas initialisé');
      return;
    }

    if (isCallActive) {
      // Arrêter l'appel
      vapi.stop();
    } else {
      // Récupérer le voiceId depuis le profil
      try {
        const profileResponse = await fetch(`/api/user/profile?userId=${userId}`);
        if (!profileResponse.ok) {
          throw new Error('Impossible de charger le profil');
        }

        const profileData = await profileResponse.json();
        const user = profileData.user || profileData;
        const voiceId = user.voiceId;

        if (!voiceId) {
          alert('Aucune voix clonée trouvée. Veuillez d\'abord créer votre voix dans l\'onboarding.');
          return;
        }

        // Utiliser l'assistantId depuis le profil (créé avec le voiceId)
        const assistantId = user.vapiAssistantId || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
        
        if (assistantId) {
          try {
            await vapi.start(assistantId);
          } catch (error) {
            console.error('Erreur démarrage appel:', error);
            alert('Erreur lors du démarrage de l\'appel');
          }
        } else {
          // Si pas d'assistantId, essayer de le créer
          try {
            const createResponse = await fetch('/api/vapi/create-assistant', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            });
            
            if (createResponse.ok) {
              const createData = await createResponse.json();
              await vapi.start(createData.assistantId);
            } else {
              alert('Impossible de créer l\'assistant VAPI. Veuillez réessayer plus tard.');
            }
          } catch (createError) {
            console.error('Erreur création assistant:', createError);
            alert('Erreur lors de la création de l\'assistant VAPI');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        alert('Erreur lors du chargement du profil');
      }
    }
  };

  // Fonction pour gérer l'upload d'images
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Afficher un message utilisateur avec l'image
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[Image: ${file.name}]`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // TODO: Uploader l'image vers Vercel Blob et l'envoyer à l'API
    // Pour l'instant, on envoie juste un message de confirmation
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

  // Composant formulaire d'inscription
  const InscriptionForm = ({ redirectTo, onSuccess }: { redirectTo: string; onSuccess: () => void }) => {
    const [isLogin, setIsLogin] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Une erreur est survenue');
        }

        if (data.userId) {
          localStorage.setItem('userId', data.userId.toString());
        }

        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {isLogin ? 'Connexion' : 'Inscription'}
              </h1>
              <p className="text-gray-600">
                {isLogin 
                  ? 'Connecte-toi pour parler avec ton double IA' 
                  : 'Crée ton compte pour créer ton double IA'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                    placeholder="jean@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isLogin ? 'Connexion...' : 'Inscription...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Se connecter' : "S'inscrire"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-sm text-[#e31fc1] hover:underline"
              >
                {isLogin 
                  ? "Pas encore de compte ? S'inscrire" 
                  : 'Déjà un compte ? Se connecter'}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  };

  if (showInscription) {
    return <InscriptionForm redirectTo="/messages" onSuccess={() => {
      setShowInscription(false);
      setIsInitializing(false);
      // Recharger la page pour initialiser avec le nouveau userId
      window.location.reload();
    }} />;
  }

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
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>

          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#e31fc1] flex-shrink-0">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={`${userFirstName || 'Mon Double'} IA`}
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
            <h2 className="font-bold text-base text-gray-900">
              {userFirstName || 'Mon Double'} <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">IA</span>
            </h2>
            <p className="text-xs text-green-600">En ligne</p>
          </div>

          {/* Bouton appel vocal VAPI */}
          <button
            onClick={toggleCall}
            className={`p-1.5 rounded-lg transition-colors ${
              isCallActive
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
            title={isCallActive ? 'Terminer l\'appel' : `Appeler ${userFirstName || 'Mon Double'} IA`}
          >
            {isCallActive ? (
              <PhoneOff className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
          </button>
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
              }`}
            >
              <div className="flex gap-3 max-w-[75%]">
                {message.role === 'assistant' && (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#e31fc1] flex-shrink-0">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt={`${userFirstName || 'Mon Double'} IA`}
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
                      alt={`${userFirstName || 'Mon Double'} IA`}
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
      <div className="bg-white border-t border-gray-200 px-4 py-3 fixed bottom-0 left-0 right-0 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex gap-2 items-center">
          {/* Inputs cachés pour les fichiers */}
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

          {/* Bouton document avec menu quiz */}
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
                  onClick={() => openQuiz('personnalite')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                >
                  Quiz Personnalité
                </button>
                <button
                  onClick={() => openQuiz('souvenir')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                >
                  Quiz Souvenir
                </button>
                <button
                  onClick={() => openQuiz('identite')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                >
                  Quiz Identité
                </button>
              </div>
            )}
          </div>

          {/* Bouton appareil photo avec menu */}
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

          {/* Bouton micro pour speech-to-text */}
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

          {/* Bouton d'envoi */}
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
