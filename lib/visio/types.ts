// Types pour le module Avatar Visio IA

export type VisioState =
  | 'setup'      // Configuration initiale (upload photo/voix)
  | 'ready'      // Avatar prêt, session non démarrée
  | 'idle'       // Session active, vidéo idle en boucle
  | 'recording'  // Utilisateur parle (PTT enfoncé)
  | 'processing' // Audio envoyé, attente réponse
  | 'talking'    // Vidéo réponse en lecture
  | 'error';     // État erreur

export interface VisioSessionState {
  state: VisioState;
  sessionId: string | null;
  sessionStartTime: Date | null;
  usageRemaining: number; // secondes restantes
  avatarStatus: 'none' | 'pending' | 'processing' | 'ready' | 'failed';
  currentVideoUrl: string | null;
  idleVideoUrl: string | null;
  error: string | null;
  lastUserMessage: string | null;
  lastAiResponse: string | null;
}

export interface VisioAsset {
  id: number;
  userId: number;
  photoUrl: string;
  voiceSource: string;
  voiceId: string | null;
  personalityPrompt: string | null;
  idleLoopVideoUrl: string | null;
}

export interface VisioUsageInfo {
  usedSeconds: number;
  quotaSeconds: number;
  remainingSeconds: number;
  percentUsed: number;
  monthYear: string;
}

export interface ConversationResult {
  success: boolean;
  userText: string;
  aiResponse: string;
  videoUrl: string;
  audioUrl?: string;
  duration: number;
  usageRemaining: number;
  error?: string;
}

// Actions pour le reducer de state
export type VisioAction =
  | { type: 'INIT_SESSION'; payload: { sessionId: string; idleVideoUrl: string } }
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'PROCESSING_STARTED' }
  | { type: 'RESPONSE_RECEIVED'; payload: { videoUrl: string; userText: string; aiResponse: string; usageRemaining: number } }
  | { type: 'VIDEO_ENDED' }
  | { type: 'END_SESSION' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_AVATAR_STATUS'; payload: 'none' | 'pending' | 'processing' | 'ready' | 'failed' }
  | { type: 'UPDATE_USAGE'; payload: number };

// Transitions d'état valides
export const validTransitions: Record<VisioState, VisioState[]> = {
  setup: ['ready', 'error'],
  ready: ['idle', 'setup', 'error'],
  idle: ['recording', 'ready', 'error'],
  recording: ['processing', 'idle', 'error'],
  processing: ['talking', 'idle', 'error'],
  talking: ['idle', 'error'],
  error: ['setup', 'ready', 'idle'],
};

// État initial
export const initialVisioState: VisioSessionState = {
  state: 'setup',
  sessionId: null,
  sessionStartTime: null,
  usageRemaining: 0,
  avatarStatus: 'none',
  currentVideoUrl: null,
  idleVideoUrl: null,
  error: null,
  lastUserMessage: null,
  lastAiResponse: null,
};
