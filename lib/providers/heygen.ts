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
const HEYGEN_UPLOAD_BASE = 'https://upload.heygen.com';

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
    body?: Record<string, unknown>,
    baseUrl: string = HEYGEN_API_BASE
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`;

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

  // Upload an image and get the image_key for Avatar IV
  private async uploadImage(imageUrl: string): Promise<string> {
    // First fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new ProviderError('heygen', 'FETCH_ERROR', 'Failed to fetch image from URL');
    }

    const imageBlob = await imageResponse.blob();
    const contentType = imageBlob.type || 'image/jpeg';

    // Upload to HeyGen
    const uploadResponse = await fetch(`${HEYGEN_UPLOAD_BASE}/v1/asset`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': contentType,
      },
      body: imageBlob,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new ProviderError(
        'heygen',
        `HTTP_${uploadResponse.status}`,
        `Upload error: ${uploadResponse.statusText} - ${errorText}`
      );
    }

    const result = await uploadResponse.json() as {
      code: number;
      data: {
        id: string;
        image_key: string;
        url: string;
      };
      message?: string;
    };

    if (result.code !== 100 || !result.data.image_key) {
      throw new ProviderError('heygen', 'UPLOAD_FAILED', result.message || 'Failed to upload image');
    }

    return result.data.image_key;
  }

  async createAvatar(photoUrl: string, _options?: CreateAvatarOptions): Promise<CreateAvatarResult> {
    try {
      // Upload image to HeyGen and get image_key
      // Avatar IV API uses image_key directly for video generation
      const imageKey = await this.uploadImage(photoUrl);

      return {
        avatarId: imageKey, // image_key is used as avatarId for Avatar IV
        status: 'ready',
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError('heygen', 'CREATE_ERROR', 'Failed to create avatar', error);
    }
  }

  async getAvatarStatus(avatarId: string): Promise<AvatarStatusResult> {
    // Avatar IV doesn't require training, so image_key is always ready
    return {
      avatarId,
      status: 'ready',
    };
  }

  async generateTalkingVideo(
    avatarId: string,
    audioUrl: string,
    options?: GenerateVideoOptions
  ): Promise<GenerateVideoResult> {
    try {
      // Avatar IV API - generates video from photo with audio
      const result = await this.request<{
        error: string | null;
        data: {
          video_id: string;
        };
      }>('/v2/video/av4/generate', 'POST', {
        image_key: avatarId, // avatarId is the image_key from upload
        audio_url: audioUrl,
        video_title: `avatar-video-${Date.now()}`,
        video_orientation: options?.aspectRatio === '9:16' ? 'portrait' : 'landscape',
      });

      if (result.error) {
        throw new ProviderError('heygen', 'GENERATE_FAILED', result.error);
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

  async generateIdleVideo(_avatarId: string, _durationSeconds: number = 5): Promise<GenerateVideoResult> {
    // Avatar IV doesn't support idle videos directly
    // Return a placeholder result - idle should be handled client-side with a static image
    throw new ProviderError(
      'heygen',
      'NOT_SUPPORTED',
      'Idle video generation is not supported with Avatar IV. Use a static image instead.'
    );
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
