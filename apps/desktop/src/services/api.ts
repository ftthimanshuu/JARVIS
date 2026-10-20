import { HealthResponse } from '../types/jarvis';

const BACKEND_URL = 'http://127.0.0.1:48765';

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
