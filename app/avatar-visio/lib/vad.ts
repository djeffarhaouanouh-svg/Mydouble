// Voice Activity Detection (VAD) pour le browser
// Détecte le silence et coupe automatiquement l'enregistrement

export interface VADOptions {
  onSilence: () => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  silenceThreshold?: number; // Volume threshold (0-255)
  silenceDuration?: number; // ms de silence avant trigger
}

export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private animationFrame: number | null = null;
  private isActive = false;
  private isSpeaking = false;

  private onSilence: () => void;
  private onVoiceStart?: () => void;
  private onVoiceEnd?: () => void;
  private silenceThreshold: number;
  private silenceDuration: number;

  constructor(options: VADOptions) {
    this.onSilence = options.onSilence;
    this.onVoiceStart = options.onVoiceStart;
    this.onVoiceEnd = options.onVoiceEnd;
    this.silenceThreshold = options.silenceThreshold || 25;
    this.silenceDuration = options.silenceDuration || 2000;
  }

  async start(stream: MediaStream): Promise<void> {
    if (this.isActive) return;

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.isActive = true;
    this.detectVoice();
  }

  private detectVoice(): void {
    if (!this.analyser || !this.isActive) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculer le volume moyen
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

    if (average > this.silenceThreshold) {
      // Voix détectée
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.onVoiceStart?.();
      }

      // Annuler le timer de silence
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
    } else {
      // Silence détecté
      if (this.isSpeaking && !this.silenceTimeout) {
        this.silenceTimeout = setTimeout(() => {
          this.isSpeaking = false;
          this.onVoiceEnd?.();
          this.onSilence();
        }, this.silenceDuration);
      }
    }

    this.animationFrame = requestAnimationFrame(() => this.detectVoice());
  }

  stop(): void {
    this.isActive = false;

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.isSpeaking = false;
  }

  getAverageVolume(): number {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  }
}
