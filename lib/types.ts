export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Personality {
  tone: string;
  humor: string;
  emojis: string;
  messageLength: string;
  interests: string[];
  // Nouveaux champs pour le questionnaire détaillé
  description?: string; // Description détaillée de la personnalité
  rawAnswers?: Record<string, string>; // Réponses brutes du questionnaire
  scores?: Record<string, number>; // Scores calculés pour chaque trait
}

export interface StyleRules {
  tone?: string;
  expressions?: string[];
  sentenceStructure?: string;
  punctuation?: string;
  details?: string;
  textExamples?: string[]; // Exemples de texte réel extrait pour que Claude puisse imiter
  extractedTextCount?: number; // Nombre de textes extraits
}

export interface DoubleIA {
  id: number;
  userId: string;
  name: string;
  status: 'active' | 'inactive';
  is_public: boolean;
  share_slug?: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  doubleId: number;
  userId?: string;
  created_at: string;
  updated_at: string;
}

export interface Trait {
  name: string;
  score: number;
  evolution?: number;
  gradient: string;
  colorClass: string;
}

export interface Enneagram {
  type: number;
  label: string;
  name: string;
  desc: string;
  defauts?: string; // Défauts du type générés par Claude
  enfance?: string; // Comment se construit le type pendant l'enfance généré par Claude
}

export interface Advice {
  number: string;
  title: string;
  content: string;
  highlight?: boolean;
}

export interface Diagnostic {
  traits: Trait[];
  enneagram: Enneagram;
  advice: Advice[];
  summary: string;
}
