'use client';

import { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  idleVideoUrl: string | null;
  talkingVideoUrl: string | null;
  photoUrl?: string | null;
  isPlaying: boolean;
  onVideoEnd: () => void;
  placeholder?: React.ReactNode;
}

export function VideoPlayer({
  idleVideoUrl,
  talkingVideoUrl,
  photoUrl,
  isPlaying,
  onVideoEnd,
  placeholder,
}: VideoPlayerProps) {
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const talkingVideoRef = useRef<HTMLVideoElement>(null);

  // Gérer le switch entre idle et talking
  useEffect(() => {
    if (isPlaying && talkingVideoUrl && talkingVideoRef.current) {
      // Pause idle, play talking
      if (idleVideoRef.current) {
        idleVideoRef.current.pause();
      }
      talkingVideoRef.current.src = talkingVideoUrl;
      talkingVideoRef.current.load();
      talkingVideoRef.current.play().catch(console.error);
    } else if (idleVideoRef.current && idleVideoUrl) {
      // Play idle
      idleVideoRef.current.play().catch(console.error);
      if (talkingVideoRef.current) {
        talkingVideoRef.current.pause();
        talkingVideoRef.current.src = '';
      }
    }
  }, [isPlaying, talkingVideoUrl, idleVideoUrl]);

  // Auto-play idle au mount
  useEffect(() => {
    if (idleVideoRef.current && idleVideoUrl && !isPlaying) {
      idleVideoRef.current.play().catch(console.error);
    }
  }, [idleVideoUrl, isPlaying]);

  const hasVideo = idleVideoUrl || talkingVideoUrl;
  const showPhoto = !idleVideoUrl && photoUrl && !isPlaying;

  return (
    <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
      {/* Photo statique si pas de vidéo idle */}
      {showPhoto && (
        <img
          src={photoUrl}
          alt="Avatar"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Idle loop video */}
      {idleVideoUrl && (
        <video
          ref={idleVideoRef}
          src={idleVideoUrl}
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Talking video */}
      <video
        ref={talkingVideoRef}
        onEnded={onVideoEnd}
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Placeholder si pas de vidéo et pas de photo */}
      {!hasVideo && !photoUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {placeholder || (
            <div className="text-center text-gray-400">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-sm">Avatar non configuré</p>
            </div>
          )}
        </div>
      )}

      {/* Indicateur visuel pour l'état playing */}
      {isPlaying && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-white font-medium">En réponse...</span>
        </div>
      )}
    </div>
  );
}
