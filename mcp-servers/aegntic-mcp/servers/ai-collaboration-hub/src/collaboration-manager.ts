import { ConversationMessage, CollaborationSession, ApprovalRequest } from './types.js';
import { OpenRouterClient } from './openrouter-client.js';
import * as readlineSync from 'readline-sync';

export class CollaborationManager {
  private sessions: Map<string, CollaborationSession> = new Map();
  private geminiClient: OpenRouterClient;
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();

  constructor(geminiClient: OpenRouterClient) {
    this.geminiClient = geminiClient;
  }

  createSession(limits?: Partial<CollaborationSession['limits']>): string {
    const sessionId = `session_${Date.now()}`;
    const session: CollaborationSession = {
      id: sessionId,
      startTime: new Date(),
      messages: [],
      active: true,
      limits: { maxExchanges: 50, timeoutMinutes: 60, requireApproval: true, ...limits }
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async sendToGemini(sessionId: string, content: string, context?: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session?.active) {
      throw new Error('Session not found or inactive');
    }

    if (session.limits.requireApproval) {
      console.log(`\n🔄 Claude → Gemini: ${content.substring(0, 100)}...`);
      const approved = readlineSync.keyInYNStrict('Approve this message?');
      
      if (!approved) {
        throw new Error('Message not approved by user');
      }
    }

    const response = await this.geminiClient.sendMessage(content, context);
    console.log(`\n🤖 Gemini: ${response.substring(0, 200)}...`);
    return response;
  }  addMessage(sessionId: string, message: ConversationMessage): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push(message);
    }
  }

  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  getConversationLog(sessionId: string): ConversationMessage[] {
    return this.sessions.get(sessionId)?.messages || [];
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.active = false;
      console.log(`📝 Session ended: ${sessionId}`);
    }
  }
}