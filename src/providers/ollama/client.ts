/** Lightweight fetch-based HTTP client for the Ollama REST API */
export class OllamaClient {
  constructor(private readonly baseUrl: string) {}

  /** Retry a fetch operation up to `maxAttempts` times on transient errors */
  private async withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        // Only retry on connection/network errors, not 4xx/5xx HTTP errors
        const isTransient =
          msg.includes('fetch failed') ||
          msg.includes('ECONNREFUSED') ||
          msg.includes('ECONNRESET') ||
          msg.includes('socket hang up') ||
          msg.includes('network timeout') ||
          msg.includes('UND_ERR');
        if (!isTransient || attempt === maxAttempts) break;
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      }
    }
    throw lastErr;
  }

  async get<T>(path: string): Promise<T> {
    return this.withRetry(async () => {
      const res = await fetch(`${this.baseUrl}${path}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Ollama GET ${path} → ${res.status} ${res.statusText}`);
      return res.json() as Promise<T>;
    });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.withRetry(async () => {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Ollama POST ${path} → ${res.status}: ${text}`);
      }
      return res.json() as Promise<T>;
    });
  }

  async postStream(path: string, body: unknown): Promise<ReadableStream<Uint8Array>> {
    return this.withRetry(async () => {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Ollama stream ${path} → ${res.status}`);
      if (!res.body) throw new Error('No response body');
      return res.body;
    });
  }

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/`, {
        signal: AbortSignal.timeout(3_000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
