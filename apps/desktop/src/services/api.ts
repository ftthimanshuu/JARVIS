import { HealthResponse, GoogleAuthStatus, EmailSummary, DraftResponse } from '../types/jarvis';

const BACKEND_URL = 'http://127.0.0.1:48765';
const STARTUP_TOKEN = 'dev-token-replace-in-production';

function getAuthHeaders(): Record<string, string> {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-JARVIS-Token': STARTUP_TOKEN,
  };
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (response.ok) {
      const data = await response.json();
      return {
        status: data.status === 'UP' ? 'UP' : 'DOWN',
        version: data.version || '1.0.0',
        timestamp: data.timestamp || new Date().toISOString(),
        port: 48765,
        latencyMs,
        message: 'Spring Boot backend operational',
      };
    } else {
      return {
        status: 'DOWN',
        port: 48765,
        latencyMs,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      status: 'DOWN',
      port: 48765,
      latencyMs,
      message: err.name === 'AbortError' ? 'Connection timed out' : 'Backend offline (127.0.0.1:48765)',
    };
  }
}

export async function getGoogleAuthStatus(): Promise<GoogleAuthStatus> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/google/status`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
    return { connected: false, configured: false };
  } catch (e) {
    return { connected: false, configured: false };
  }
}

export async function getGoogleAuthUrl(): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/auth/google/url`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to get Google Auth URL');
  }
  const data = await res.json();
  return data.authUrl;
}

export async function disconnectGoogle(): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/auth/google/disconnect`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to disconnect Google account');
  }
}

export async function getRecentEmails(maxResults = 10): Promise<EmailSummary[]> {
  const res = await fetch(`${BACKEND_URL}/api/emails/recent?maxResults=${maxResults}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch emails');
  }
  const data = await res.json();
  return data.emails || [];
}

export async function createGmailDraft(
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<DraftResponse> {
  const res = await fetch(`${BACKEND_URL}/api/emails/draft`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ to, subject, body, threadId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save draft in Gmail');
  }
  return await res.json();
}

export async function getAiConfig(): Promise<import('../types/jarvis').AiConfig> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/config`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
    return { configured: false, model: 'openai/gpt-oss-120b' };
  } catch {
    return { configured: false, model: 'openai/gpt-oss-120b' };
  }
}

export async function saveAiConfig(apiKey: string, model?: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/ai/config`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ apiKey, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save AI configuration');
  }
}

export async function summarizeEmail(
  from: string,
  subject: string,
  snippet: string
): Promise<import('../types/jarvis').EmailAiSummary> {
  const res = await fetch(`${BACKEND_URL}/api/ai/summarize`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ from, subject, snippet }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'AI summarization failed');
  }
  return await res.json();
}

export async function generateAiDraft(
  from: string,
  subject: string,
  snippet: string,
  guidance?: string
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/ai/draft-reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ from, subject, snippet, guidance }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'AI draft generation failed');
  }
  const data = await res.json();
  return data.draft;
}

export async function sendChatPrompt(prompt: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'AI assistant failed to respond');
  }
  const data = await res.json();
  return data.reply;
}


