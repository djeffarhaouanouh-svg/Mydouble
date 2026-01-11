export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
