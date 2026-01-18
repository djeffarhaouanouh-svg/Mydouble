import {
  VideoAvatarProvider,
  CreateAvatarResult,
  AvatarStatusResult,
  GenerateVideoResult,
  CreateAvatarOptions,
  GenerateVideoOptions,
  ProviderError,
} from './types';

const HEYGEN_API_BASE = 'https://api.heygen.com';

export class HeyGenProvider implements VideoAvatarProvider {
  readonly name = 'heygen';
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.HEYGEN_API_KEY;
    if (!key) {
      throw new ProviderError('heygen', 'CONFIG_ERROR', 'HEYGEN_API_KEY not configured');
    }
    this.apiKey = key;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${HEYGEN_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(
        'heygen',
        `HTTP_${response.status}`,
        `API error: ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  async createAvatar(photoUrl: string, options?: CreateAvatarOptions): Promise<CreateAvatarResult> {
    try {
      // HeyGen Instant Avatar API (Photo Avatar)
      const result = await this.request<{
        code: number;
        data: {
          avatar_id: string;
          status: string;
        };
        message?: string;
      }>('/v2/photo_avatar', 'POST', {
        image_url: photoUrl,
      });

      if (result.code !== 100) {
        throw new ProviderError('heygen', 'CREATE_FAILED', result.message || 'Failed to create avatar');
      }

      return {
        avatarId: result.data.avatar_id,
        status: this.mapStatus(result.data.status),
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError('heygen', 'CREATE_ERROR', 'Failed to create avatar', error);
    }
  }

  async getAvatarStatus(avatarId: string): Promise<AvatarStatusResult> {
    try {
      const result = await this.request<{
        code: number;
        data: {
          avatar_id: string;
          status: string;
          error?: string;
        };
      }>(`/v2/photo_avatar/${avatarId}`);

      return {
        avatarId: result.data.avatar_id,
        status: this.mapStatus(result.data.status),
        errorMessage: result.data.error,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError('heygen', 'STATUS_ERROR', 'Failed to get avatar status', error);
    }
  }

  async generateTalkingVideo(
    avatarId: string,
    audioUrl: string,
    options?: GenerateVideoOptions
  ): Promise<GenerateVideoResult> {
    try {
      // HeyGen Video Generation API
      const result = await this.request<{
        code: number;
        data: {
          video_id: string;
        };
        message?: string;
      }>('/v2/video/generate', 'POST', {
        video_inputs: [
          {
            character: {
              type: 'talking_photo',
              talking_photo_id: avatarId,
            },
            voice: {
              type: 'audio',
              audio_url: audioUrl,
            },
          },
        ],
        dimension: this.mapDimension(options?.aspectRatio),
      });

      if (result.code !== 100) {
        throw new ProviderError('heygen', 'GENERATE_FAILED', result.message || 'Failed to generate video');
      }

      return {
        videoId: result.data.video_id,
        status: 'pending',
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError('heygen', 'GENERATE_ERROR', 'Failed to generate video', error);
    }
  }

  async getVideoStatus(videoId: string): Promise<GenerateVideoResult> {
    try {
      const result = await this.request<{
        code: number;
        data: {
          video_id: string;
          status: string;
          video_url?: string;
          duration?: number;
          error?: string;
        };
      }>(`/v1/video_status.get?video_id=${videoId}`);

      const status = this.mapVideoStatus(result.data.status);

      return {
        videoId: result.data.video_id,
        status,
        videoUrl: result.data.video_url,
        duration: result.data.duration,
        errorMessage: result.data.error,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError('heygen', 'STATUS_ERROR', 'Failed to get video status', error);
    }
  }

  async generateIdleVideo(avatarId: string, durationSeconds: number = 5): Promise<GenerateVideoResult> {
    try {
      // Pour l'idle, on génère une vidéo avec du silence ou un texte minimal
      // HeyGen ne supporte pas directement l'idle, donc on utilise un texte neutre
      const result = await this.request<{
        code: number;
        data: {
          video_id: string;
        };
        message?: string;
      }>('/v2/video/generate', 'POST', {
        video_inputs: [
          {
            character: {
              type: 'talking_photo',
              talking_photo_id: avatarId,
            },
            voice: {
              type: 'text',
              input_text: ' ', // Silence / minimal
              voice_id: 'silent', // Will need to use a real voice ID
            },
          },
        ],
        dimension: {
          width: 512,
          height: 512,
        },
      });

      if (result.code !== 100) {
        throw new ProviderError('heygen', 'IDLE_FAILED', result.message || 'Failed to generate idle video');
      }

      return {
        videoId: result.data.video_id,
        status: 'pending',
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError('heygen', 'IDLE_ERROR', 'Failed to generate idle video', error);
    }
  }

  // Attendre qu'une vidéo soit prête (polling)
  async waitForVideo(videoId: string, maxWaitMs: number = 120000): Promise<GenerateVideoResult> {
    const startTime = Date.now();
    const pollInterval = 3000; // 3 secondes

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.getVideoStatus(videoId);

      if (result.status === 'ready' || result.status === 'failed') {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new ProviderError('heygen', 'TIMEOUT', `Video generation timed out after ${maxWaitMs}ms`);
  }

  private mapStatus(status: string): 'pending' | 'processing' | 'ready' | 'failed' {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'ready':
      case 'success':
        return 'ready';
      case 'processing':
      case 'in_progress':
        return 'processing';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private mapVideoStatus(status: string): 'pending' | 'processing' | 'ready' | 'failed' {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'ready';
      case 'processing':
      case 'pending':
        return 'processing';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private mapDimension(aspectRatio?: string): { width: number; height: number } {
    switch (aspectRatio) {
      case '9:16':
        return { width: 720, height: 1280 };
      case '1:1':
        return { width: 720, height: 720 };
      case '16:9':
      default:
        return { width: 1280, height: 720 };
    }
  }
}

// Factory function pour créer le provider
export function createVideoAvatarProvider(provider: string = 'heygen'): VideoAvatarProvider {
  switch (provider) {
    case 'heygen':
      return new HeyGenProvider();
    // Ajouter d'autres providers ici (D-ID, Synthesia, etc.)
    default:
      throw new ProviderError(provider, 'UNKNOWN_PROVIDER', `Unknown provider: ${provider}`);
  }
}
