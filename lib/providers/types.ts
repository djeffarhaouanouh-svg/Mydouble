// Interface abstraite pour les providers de vidéo avatar
// Permet de changer facilement de provider (HeyGen, D-ID, Synthesia, etc.)

export interface CreateAvatarResult {
  avatarId: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  estimatedTimeSeconds?: number;
}

export interface AvatarStatusResult {
  status: 'pending' | 'processing' | 'ready' | 'failed';
  progress?: number;
  errorMessage?: string;
  avatarId?: string;
}

export interface GenerateVideoResult {
  videoId: string;
  videoUrl?: string;
  duration?: number;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  errorMessage?: string;
}

export interface VideoAvatarProvider {
  readonly name: string;

  // Créer un avatar à partir d'une photo
  createAvatar(photoUrl: string, options?: CreateAvatarOptions): Promise<CreateAvatarResult>;

  // Vérifier le statut d'un avatar
  getAvatarStatus(avatarId: string): Promise<AvatarStatusResult>;

  // Générer une vidéo parlante avec lip-sync
  generateTalkingVideo(avatarId: string, audioUrl: string, options?: GenerateVideoOptions): Promise<GenerateVideoResult>;

  // Vérifier le statut d'une vidéo en cours de génération
  getVideoStatus(videoId: string): Promise<GenerateVideoResult>;

  // Générer une vidéo idle loop
  generateIdleVideo(avatarId: string, durationSeconds?: number): Promise<GenerateVideoResult>;
}

export interface CreateAvatarOptions {
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface GenerateVideoOptions {
  aspectRatio?: '16:9' | '9:16' | '1:1';
  resolution?: '720p' | '1080p';
}

// Types pour les erreurs
export class ProviderError extends Error {
  constructor(
    public provider: string,
    public code: string,
    message: string,
    public originalError?: unknown
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'ProviderError';
  }
}
