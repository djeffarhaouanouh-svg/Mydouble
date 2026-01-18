'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { VoiceActivityDetector } from '../lib/vad';

type ButtonState = 'idle' | 'recording' | 'processing' | 'talking' | 'disabled';

interface PushToTalkButtonProps {
  state: ButtonState;
  onRecordStart: () => void;
  onRecordEnd: (audioBlob: Blob) => void;
  disabled?: boolean;
  enableVAD?: boolean;
  vadSilenceDuration?: number;
}

export function PushToTalkButton({
  state,
  onRecordStart,
  onRecordEnd,
  disabled = false,
  enableVAD = true,
  vadSilenceDuration = 2000,
}: PushToTalkButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [volume, setVolume] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isDisabled = disabled || state === 'processing' || state === 'talking' || state === 'disabled';

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (vadRef.current) {
      vadRef.current.stop();
      vadRef.current = null;
    }

    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsPressed(false);
    setVolume(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (isDisabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        if (audioBlob.size > 0) {
          onRecordEnd(audioBlob);
        }

        audioChunksRef.current = [];
      };

      // Démarrer le VAD si activé
      if (enableVAD) {
        vadRef.current = new VoiceActivityDetector({
          onSilence: () => {
            stopRecording();
          },
          silenceDuration: vadSilenceDuration,
        });
        await vadRef.current.start(stream);

        // Mettre à jour le volume pour l'animation
        volumeIntervalRef.current = setInterval(() => {
          if (vadRef.current) {
            setVolume(vadRef.current.getAverageVolume());
          }
        }, 50);
      }

      mediaRecorder.start(100);
      setIsPressed(true);
      onRecordStart();
    } catch (error) {
      console.error('Erreur accès microphone:', error);
    }
  }, [isDisabled, onRecordStart, onRecordEnd, enableVAD, vadSilenceDuration, stopRecording]);

  const handlePressStart = useCallback(() => {
    if (!isDisabled && !isPressed) {
      startRecording();
    }
  }, [isDisabled, isPressed, startRecording]);

  const handlePressEnd = useCallback(() => {
    if (isPressed) {
      stopRecording();
    }
  }, [isPressed, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // Style selon l'état
  const getButtonStyle = () => {
    if (isDisabled) {
      return 'bg-gray-400 cursor-not-allowed';
    }

    switch (state) {
      case 'recording':
        return 'bg-red-500 shadow-red-500/50';
      case 'processing':
        return 'bg-amber-500';
      case 'talking':
        return 'bg-green-500';
      default:
        return 'bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:scale-105';
    }
  };

  // Scale animation basée sur le volume
  const volumeScale = state === 'recording' ? 1 + (volume / 255) * 0.15 : 1;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={(e) => {
          e.preventDefault();
          handlePressStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handlePressEnd();
        }}
        disabled={isDisabled}
        className={`
          relative w-20 h-20 rounded-full
          flex items-center justify-center
          transition-all duration-200 ease-out
          shadow-lg
          ${getButtonStyle()}
        `}
        style={{
          transform: `scale(${volumeScale})`,
        }}
      >
        {/* Pulse animation pendant l'enregistrement */}
        {state === 'recording' && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
            <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50" />
          </>
        )}

        {/* Icon */}
        {state === 'processing' ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isDisabled ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic
            className={`w-8 h-8 text-white ${state === 'recording' ? 'animate-pulse' : ''}`}
          />
        )}
      </button>

      {/* Label */}
      <span className="text-sm font-medium text-gray-600">
        {state === 'recording'
          ? 'Relâchez pour envoyer...'
          : state === 'processing'
            ? 'Traitement en cours...'
            : state === 'talking'
              ? 'Avatar en réponse...'
              : isDisabled
                ? 'Non disponible'
                : 'Maintenez pour parler'}
      </span>
    </div>
  );
}
