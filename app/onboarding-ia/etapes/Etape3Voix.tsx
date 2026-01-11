"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, Trash2, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

interface Etape3Props {
  data: any;
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const phrases = [
  { id: 1, text: "Salut ! Comment ça va aujourd'hui ?", type: "greeting" },
  { id: 2, text: "Je suis vraiment content de te parler.", type: "affirmation" },
  { id: 3, text: "Tu penses quoi de tout ça ?", type: "question" },
  { id: 4, text: "C'est génial ! On devrait se voir bientôt.", type: "enthusiasm" },
  { id: 5, text: "Ah non, je ne suis pas d'accord avec toi.", type: "disagreement" },
  { id: 6, text: "Hmm, laisse-moi réfléchir un instant...", type: "thinking" },
  { id: 7, text: "Merci beaucoup, c'est vraiment sympa !", type: "gratitude" },
  { id: 8, text: "Ok, on fait comme ça alors. À tout à l'heure !", type: "conclusion" },
];

export default function Etape3Voix({ data, onUpdate, onNext, onBack, isLoading, setIsLoading }: Etape3Props) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [recordings, setRecordings] = useState<Record<number, Blob>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPhrase = phrases[currentPhraseIndex];
  const progress = (Object.keys(recordings).length / phrases.length) * 100;
  const canContinue = Object.keys(recordings).length >= Math.ceil(phrases.length * 0.75); // Au moins 75% des phrases

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordings({ ...recordings, [currentPhrase.id]: audioBlob });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setError("Impossible d'accéder au microphone. Vérifie tes permissions.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const deleteRecording = (phraseId: number) => {
    const newRecordings = { ...recordings };
    delete newRecordings[phraseId];
    setRecordings(newRecordings);
  };

  const playRecording = (phraseId: number) => {
    const recording = recordings[phraseId];
    if (!recording) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(URL.createObjectURL(recording));
    audioRef.current = audio;
    setPlayingId(phraseId);

    audio.play();
    audio.onended = () => {
      setPlayingId(null);
    };
  };

  const handleSubmit = async () => {
    if (!canContinue) {
      setError(`Enregistre au moins ${Math.ceil(phrases.length * 0.75)} phrases`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Upload des fichiers audio
      const formData = new FormData();
      Object.entries(recordings).forEach(([phraseId, blob]) => {
        const phrase = phrases.find((p) => p.id === parseInt(phraseId));
        formData.append(`audio_${phraseId}`, blob, `phrase_${phraseId}.webm`);
        formData.append(`text_${phraseId}`, phrase?.text || "");
        formData.append(`type_${phraseId}`, phrase?.type || "");
      });

      // Créer la voix ElevenLabs
      const response = await fetch("/api/double-ia/voice/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la voix");
      }

      const result = await response.json();
      onUpdate({
        voiceSamples: Object.values(recordings),
        voiceId: result.voiceId,
        voiceName: result.voiceName
      });
      onNext();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Clone ta{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              voix
            </span>
          </h2>
          <p className="text-gray-600">
            Enregistre ces phrases pour créer une voix qui te ressemble
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">
              {Object.keys(recordings).length} / {phrases.length} phrases
            </span>
            <span className="text-black font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Phrase Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {phrases.map((phrase, idx) => {
            const isRecorded = !!recordings[phrase.id];
            const isCurrent = idx === currentPhraseIndex;

            return (
              <button
                key={phrase.id}
                onClick={() => setCurrentPhraseIndex(idx)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  isRecorded
                    ? "bg-green-500 text-black"
                    : isCurrent
                    ? "bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-700"
                }`}
              >
                {isRecorded ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </button>
            );
          })}
        </div>

        {/* Current Phrase */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhrase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <div className="bg-gray-100/50 rounded-xl p-6 text-center">
              <p className="text-2xl font-semibold mb-4 leading-relaxed">{currentPhrase.text}</p>
              <p className="text-sm text-gray-600">
                Lis cette phrase naturellement, comme si tu parlais à un ami
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Recording Controls */}
        <div className="flex flex-col items-center gap-4 mb-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!!recordings[currentPhrase.id]}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Mic className="w-10 h-10 text-black" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center hover:scale-110 transition-transform animate-pulse"
            >
              <Square className="w-8 h-8 text-black fill-white" />
            </button>
          )}

          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-mono text-[#e31fc1]"
            >
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
            </motion.div>
          )}

          {recordings[currentPhrase.id] && !isRecording && (
            <div className="flex gap-3">
              <button
                onClick={() => playRecording(currentPhrase.id)}
                disabled={playingId === currentPhrase.id}
                className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-black font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {playingId === currentPhrase.id ? "Lecture..." : "Écouter"}
              </button>
              <button
                onClick={() => deleteRecording(currentPhrase.id)}
                className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
              <button
                onClick={() => {
                  deleteRecording(currentPhrase.id);
                  setTimeout(startRecording, 100);
                }}
                className="px-6 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-semibold flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Refaire
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setCurrentPhraseIndex(Math.max(0, currentPhraseIndex - 1))}
            disabled={currentPhraseIndex === 0}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-black font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Phrase précédente
          </button>
          <button
            onClick={() => setCurrentPhraseIndex(Math.min(phrases.length - 1, currentPhraseIndex + 1))}
            disabled={currentPhraseIndex === phrases.length - 1}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-black font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Phrase suivante →
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300">
            💡 <strong>Conseils :</strong> Parle clairement, dans un endroit calme.
            Varie ton intonation selon le type de phrase. Tu peux sauter des phrases, mais au moins {Math.ceil(phrases.length * 0.75)} sont requises.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-lg border border-gray-300 text-black font-semibold hover:bg-gray-100 transition-colors"
            >
              ← Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !canContinue}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? "Création de ta voix..." : "Créer ma voix →"}
            </button>
          </div>

          {/* Skip Button */}
          <button
            onClick={() => {
              // Passer avec des données mock
              onUpdate({
                voiceSamples: [],
                voiceId: "voice_mock_" + Date.now(),
                voiceName: "VoixMock",
              });
              onNext();
            }}
            disabled={isLoading}
            className="w-full py-3 rounded-lg border-2 border-gray-300 text-gray-600 font-semibold hover:border-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            Passer cette étape →
          </button>
        </div>
      </div>
    </div>
  );
}
