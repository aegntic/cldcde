export interface ConversationMessage {
  id: string;
  timestamp: Date;
  from: 'claude' | 'gemini' | 'user';
  content: string;
  approved: boolean;
  context?: string;
}

export interface CollaborationSession {
  id: string;
  startTime: Date;
  messages: ConversationMessage[];
  active: boolean;
  limits: {
    maxExchanges: number;
    timeoutMinutes: number;
    requireApproval: boolean;
  };
}

export interface GeminiConfig {
  apiKey?: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
}

export interface ApprovalRequest {
  messageId: string;
  from: 'claude' | 'gemini';
  to: 'claude' | 'gemini';
  content: string;
  context?: string;
}