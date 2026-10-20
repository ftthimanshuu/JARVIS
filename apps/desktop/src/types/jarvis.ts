export type AssistantState = 'ready' | 'working' | 'needs_approval' | 'error' | 'connecting';

export interface HealthResponse {
  status: 'UP' | 'DOWN' | 'CONNECTING';
  version?: string;
  timestamp?: string;
  uptimeSeconds?: number;
  port?: number;
  latencyMs?: number;
  message?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  category: 'system' | 'gmail' | 'security';
  description?: string;
}

export interface GoogleAuthStatus {
  connected: boolean;
  email?: string;
  configured: boolean;
}

export interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  urgency: 'high' | 'normal' | 'low';
  suggestedAction?: string;
}

export interface DraftResponse {
  draftId: string;
  status: string;
  message: string;
  to: string;
  subject: string;
}
