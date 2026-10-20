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
