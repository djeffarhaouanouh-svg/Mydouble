"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, MicOff, Upload, Play, Pause, Trash2, Loader2, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

type RecordingState = "idle" | "recording" | "paused" | "stopped";
type UploadState = "idle" | "uploading" | "success" | "error";

export default function VoixPage() {
  const router = useRouter();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState<"record" | "upload">("record");
  
  // États pour l'enregistrement
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  
  // États pour l'upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileUrl, setUploadFileUrl] = useState<string | null>(null);
  
  // États pour les voix existantes
  const [existingVoices, setExistingVoices] = useState<any[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const voicePlayerRefs = useRef<Map<number, HTMLAudioElement>>(new Map());

  // Gérer la visibilité du header au scroll et le scroll Y pour les animations
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Charger les voix existantes
  useEffect(() => {
    const loadVoices = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoadingVoices(false);
        return;
      }

      try {
        const response = await fetch(`/api/voices?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setExistingVoices(data.voices || []);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des voix:', error);
      } finally {
        setLoadingVoices(false);
      }
    };

    loadVoices();
  }, []);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (uploadFileUrl) {
        URL.revokeObjectURL(uploadFileUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Nettoyer les lecteurs audio des voix
      voicePlayerRefs.current.forEach((audio) => {
        audio.pause();
        if (audio.src && audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }
      });
    };
  }, [audioUrl, uploadFileUrl]);

  // Démarrer l'enregistrement
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/mpeg',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        
        if (blob.size > 0) {
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setRecordingState("stopped");
        }
      };

      mediaRecorder.start(100);
      setRecordingState("recording");
      setRecordingTime(0);
      
      // Timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erreur accès microphone:', err);
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.");
      setRecordingState("idle");
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Supprimer l'enregistrement
  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingState("idle");
    setRecordingTime(0);
    setIsPlaying(false);
  };

  // Jouer/Pause l'audio
  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    
    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Gérer le changement de fichier upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError("Le fichier doit être un fichier audio (MP3, WAV, etc.)");
      return;
    }

    setError(null);
    setUploadFile(file);
    
    if (uploadFileUrl) {
      URL.revokeObjectURL(uploadFileUrl);
    }
    
    const url = URL.createObjectURL(file);
    setUploadFileUrl(url);
  };

  // Upload l'audio
  const handleUpload = async () => {
    const fileToUpload = activeTab === "record" ? audioBlob : uploadFile;
    if (!fileToUpload) return;

    setUploadState("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', fileToUpload, `voice-${Date.now()}.${activeTab === "record" ? "webm" : uploadFile?.name.split('.').pop()}`);
      
      const userId = localStorage.getItem('userId');
      if (userId) {
        formData.append('userId', userId);
      }

      const response = await fetch('/api/voice/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      setUploadState("success");
      
      // Recharger les voix après upload réussi
      if (userId) {
        try {
          const voicesResponse = await fetch(`/api/voices?userId=${userId}`);
          if (voicesResponse.ok) {
            const voicesData = await voicesResponse.json();
            if (voicesData.success) {
              setExistingVoices(voicesData.voices || []);
            }
          }
        } catch (err) {
          console.error('Erreur lors du rechargement des voix:', err);
        }
      }
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push('/avatar-fx');
      }, 2000);
    } catch (err) {
      console.error('Erreur upload:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
      setUploadState("error");
    }
  };

  // Formater le temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Jouer/Pause une voix existante
  const toggleVoicePlayback = (voiceId: number, sampleUrl: string) => {
    let audio = voicePlayerRefs.current.get(voiceId);
    
    if (!audio) {
      audio = new Audio(sampleUrl);
      audio.onended = () => setPlayingVoiceId(null);
      voicePlayerRefs.current.set(voiceId, audio);
    }

    if (playingVoiceId === voiceId) {
      audio.pause();
      setPlayingVoiceId(null);
    } else {
      // Arrêter les autres voix
      voicePlayerRefs.current.forEach((a, id) => {
        if (id !== voiceId) {
          a.pause();
        }
      });
      audio.play();
      setPlayingVoiceId(voiceId);
    }
  };

  // Obtenir le statut de la voix en français
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'En attente',
      cloning: 'Clonage en cours',
      ready: 'Prête',
      failed: 'Échec',
    };
    return statusMap[status] || status;
  };

  const currentAudioUrl = activeTab === "record" ? audioUrl : uploadFileUrl;
  const hasAudio = activeTab === "record" ? !!audioBlob : !!uploadFile;

  return (
    <div className="bg-[#0F0F0F] text-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between pl-3 pr-12 md:pl-4 md:pr-20 py-3 border-b border-[#2A2A2A] bg-[#0F0F0F] transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-white"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold absolute left-1/2 -translate-x-1/2">
          Voix
        </h1>
        <div className="w-9" />
      </header>

      {/* Contenu principal */}
      <main className="px-4 md:px-8 pt-20 pb-24 max-w-2xl mx-auto w-full">
        <motion.p 
          className="text-[#A3A3A3] mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Enregistrez votre voix ou uploadez un fichier audio pour créer votre avatar vocal
        </motion.p>

        {/* Tabs */}
        <motion.div 
          className="flex gap-2 mb-6 bg-[#1A1A1A] p-1 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button
            onClick={() => {
              setActiveTab("record");
              setError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "record"
                ? "bg-[#3BB9FF] text-white"
                : "text-[#A3A3A3] hover:text-white"
            }`}
          >
            <Mic className="w-4 h-4 inline mr-2" />
            Enregistrer
          </button>
          <button
            onClick={() => {
              setActiveTab("upload");
              setError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "upload"
                ? "bg-[#3BB9FF] text-white"
                : "text-[#A3A3A3] hover:text-white"
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Uploader
          </button>
        </motion.div>

        {/* Section Enregistrement */}
        {activeTab === "record" && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Zone d'enregistrement */}
            <motion.div 
              className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-8 flex flex-col items-center gap-6"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              {recordingState === "idle" && !audioBlob && (
                <>
                  <div className="w-24 h-24 rounded-full bg-[#252525] flex items-center justify-center border-2 border-[#3BB9FF]">
                    <Mic className="w-12 h-12 text-[#3BB9FF]" />
                  </div>
                  <button
                    onClick={startRecording}
                    className="px-6 py-3 bg-[#3BB9FF] text-white font-medium rounded-xl hover:bg-[#2AA3E6] transition-colors"
                  >
                    Commencer l'enregistrement
                  </button>
                </>
              )}

              {recordingState === "recording" && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <MicOff className="w-12 h-12 text-white" />
                  </motion.div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#3BB9FF] mb-2">
                      {formatTime(recordingTime)}
                    </div>
                    <p className="text-[#A3A3A3] text-sm">Enregistrement en cours...</p>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
                  >
                    Arrêter l'enregistrement
                  </button>
                </>
              )}

              {recordingState === "stopped" && audioBlob && (
                <>
                  <div className="w-24 h-24 rounded-full bg-[#252525] flex items-center justify-center border-2 border-[#3BB9FF]">
                    <Volume2 className="w-12 h-12 text-[#3BB9FF]" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-2">Enregistrement terminé</p>
                    <p className="text-[#A3A3A3] text-sm mb-4">
                      Durée: {formatTime(recordingTime)}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={togglePlayback}
                        className="px-4 py-2 bg-[#3BB9FF] text-white rounded-lg hover:bg-[#2AA3E6] transition-colors flex items-center gap-2"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Écouter
                          </>
                        )}
                      </button>
                      <button
                        onClick={clearRecording}
                        className="px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#2F2F2F] transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                  <audio
                    ref={audioPlayerRef}
                    src={audioUrl || undefined}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Section Upload */}
        {activeTab === "upload" && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div 
              className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-8"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              {!uploadFile ? (
                <label className="flex flex-col items-center gap-4 cursor-pointer">
                  <div className="w-24 h-24 rounded-full bg-[#252525] flex items-center justify-center border-2 border-dashed border-[#3BB9FF]">
                    <Upload className="w-12 h-12 text-[#3BB9FF]" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">Cliquez pour sélectionner un fichier</p>
                    <p className="text-[#A3A3A3] text-sm">MP3, WAV, OGG, M4A</p>
                    <p className="text-[#3BB9FF] text-sm mt-1 font-medium">MAX 3 à 15 sec</p>
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-[#252525] flex items-center justify-center border-2 border-[#3BB9FF]">
                    <Volume2 className="w-12 h-12 text-[#3BB9FF]" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">{uploadFile.name}</p>
                    <p className="text-[#A3A3A3] text-sm">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={togglePlayback}
                      className="px-4 py-2 bg-[#3BB9FF] text-white rounded-lg hover:bg-[#2AA3E6] transition-colors flex items-center gap-2"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Écouter
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setUploadFile(null);
                        if (uploadFileUrl) {
                          URL.revokeObjectURL(uploadFileUrl);
                          setUploadFileUrl(null);
                        }
                        setIsPlaying(false);
                      }}
                      className="px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#2F2F2F] transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Changer
                    </button>
                  </div>
                  <audio
                    ref={audioPlayerRef}
                    src={uploadFileUrl || undefined}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Message d'erreur */}
        {error && (
          <motion.div 
            className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        {/* Message de succès */}
        {uploadState === "success" && (
          <motion.div 
            className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200 text-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            Fichier uploadé avec succès ! Redirection...
          </motion.div>
        )}

        {/* Bouton Upload */}
        {hasAudio && (
          <motion.div 
            className="mt-6 flex justify-end mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={handleUpload}
              disabled={uploadState === "uploading"}
              className={`py-2.5 px-6 font-medium rounded-xl transition-colors flex items-center gap-2 ${
                uploadState === "uploading"
                  ? "bg-[#252525] text-[#A3A3A3] cursor-not-allowed"
                  : "bg-[#3BB9FF] text-white hover:bg-[#2AA3E6]"
              }`}
            >
              {uploadState === "uploading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                "Enregistrer la voix"
              )}
            </button>
          </motion.div>
        )}

        {/* Section Voix existantes */}
        {existingVoices.length > 0 && (
          <motion.div 
            className="mt-12 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-white">Voix déjà créées</h2>
            <div className="space-y-3">
              {existingVoices.map((voice) => (
                <motion.div
                  key={voice.id}
                  className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center border-2 border-[#3BB9FF]">
                      <Volume2 className="w-6 h-6 text-[#3BB9FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{voice.name}</p>
                      <p className="text-[#A3A3A3] text-sm">
                        {getStatusLabel(voice.status)}
                        {voice.createdAt && (
                          <span className="ml-2">
                            • {new Date(voice.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {voice.sampleUrl && voice.status === 'ready' && (
                      <button
                        onClick={() => toggleVoicePlayback(voice.id, voice.sampleUrl)}
                        className="p-2 rounded-lg bg-[#252525] hover:bg-[#2F2F2F] transition-colors"
                        aria-label={playingVoiceId === voice.id ? "Pause" : "Écouter"}
                      >
                        {playingVoiceId === voice.id ? (
                          <Pause className="w-4 h-4 text-[#3BB9FF]" />
                        ) : (
                          <Play className="w-4 h-4 text-[#3BB9FF]" />
                        )}
                      </button>
                    )}
                    {voice.status === 'ready' && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg">
                        ✓ Prête
                      </span>
                    )}
                    {voice.status === 'cloning' && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Clonage...
                      </span>
                    )}
                    {voice.status === 'failed' && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg">
                        ✗ Échec
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
