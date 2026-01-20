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

  // Toujours utiliser une vidéo loop par défaut si pas fournie
  const finalIdleVideoUrl = idleVideoUrl || '/video-1.mp4';

  // Gérer le switch entre idle et talking
  useEffect(() => {
    if (isPlaying && talkingVideoUrl && talkingVideoRef.current) {
      console.log('[VideoPlayer] 🎬 REMPLACEMENT vidéo loop par:', talkingVideoUrl);
      console.log('[VideoPlayer] État: isPlaying=', isPlaying, 'talkingVideoUrl=', talkingVideoUrl);
      
      // Pause idle, play talking
      if (idleVideoRef.current) {
        idleVideoRef.current.pause();
        idleVideoRef.current.currentTime = 0;
        console.log('[VideoPlayer] ✅ Vidéo idle mise en pause');
      }
      
      // Forcer le rechargement de la vidéo talking
      const talkingVideo = talkingVideoRef.current;
      talkingVideo.src = talkingVideoUrl;
      talkingVideo.load(); // Force le rechargement
      console.log('[VideoPlayer] ✅ Source vidéo talking mise à jour:', talkingVideoUrl);
      
      // Attendre que la vidéo soit chargée avant de jouer
      const handleCanPlay = () => {
        console.log('[VideoPlayer] ✅ Vidéo prête à jouer, démarrage...');
        talkingVideo.play().catch((err) => {
          console.error('[VideoPlayer] ❌ Erreur lecture:', err);
        });
        talkingVideo.removeEventListener('canplay', handleCanPlay);
      };
      
      const handleError = (err: Event) => {
        console.error('[VideoPlayer] ❌ Erreur chargement vidéo:', err);
      };
      
      talkingVideo.addEventListener('canplay', handleCanPlay);
      talkingVideo.addEventListener('error', handleError);
      
      // Si la vidéo est déjà chargée, jouer directement
      if (talkingVideo.readyState >= 3) {
        console.log('[VideoPlayer] ✅ Vidéo déjà chargée, lecture immédiate');
        talkingVideo.play().catch(console.error);
      }
      
      // Cleanup
      return () => {
        talkingVideo.removeEventListener('canplay', handleCanPlay);
        talkingVideo.removeEventListener('error', handleError);
      };
    } else if (!isPlaying && idleVideoRef.current) {
      // Play idle quand on revient à l'état idle
      console.log('[VideoPlayer] Retour à la vidéo idle');
      if (talkingVideoRef.current) {
        talkingVideoRef.current.pause();
        talkingVideoRef.current.src = '';
        talkingVideoRef.current.load();
      }
      idleVideoRef.current.currentTime = 0;
      idleVideoRef.current.play().catch(console.error);
    }
  }, [isPlaying, talkingVideoUrl, finalIdleVideoUrl]);

  // Auto-play idle au mount et quand idleVideoUrl change
  useEffect(() => {
    if (idleVideoRef.current && !isPlaying) {
      // S'assurer que la vidéo loop joue toujours
      idleVideoRef.current.play().catch((err) => {
        console.error('[VideoPlayer] Erreur auto-play idle:', err);
      });
    }
  }, [finalIdleVideoUrl, isPlaying]);

  const hasVideo = finalIdleVideoUrl || talkingVideoUrl;
  const showPhoto = !finalIdleVideoUrl && photoUrl && !isPlaying;

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

      {/* Idle loop video - TOUJOURS affichée */}
      <video
        ref={idleVideoRef}
        src={finalIdleVideoUrl}
        loop
        muted
        playsInline
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isPlaying ? 'opacity-0' : 'opacity-100'
        }`}
      />

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
