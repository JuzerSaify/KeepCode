import { registerTool } from '../registry.js';
import { MAX_FETCH_BYTES } from '../../config/defaults.js';
import type { AgentConfig } from '../../types/index.js';

registerTool({
  definition: {
    name: 'fetch_url',
    description:
      'Fetch content from a URL. Returns the response body as text. Truncates at 120KB. Use for: documentation, APIs, raw GitHub files, issue trackers.',
    category: 'network',
    dangerLevel: 'safe',
    emoji: '🌐',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
        headers: {
          type: 'object',
          description: 'Optional HTTP headers as key-value pairs',
        },
      },
      required: ['url'],
    },
  },
  handler: async (args: Record<string, unknown>, _config: AgentConfig) => {
    const url = String(args.url);
    const headers = (args.headers ?? {}) as Record<string, string>;

    // SSRF guard: block private/metadata IP ranges
    try {
      const parsed = new URL(url);
      const h = parsed.hostname;
      if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0$|::1$)/.test(h) ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(h)) {
        return `SECURITY: Blocked request to private/internal address: ${h}`;
      }
    } catch {
      return `Error: Invalid URL: ${url}`;
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'KeepCode-Agent/1.3',
        ...headers,
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      return `HTTP ${res.status} ${res.statusText} from ${url}`;
    }

    const buf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') ?? '';
    const bytes = new Uint8Array(buf);
    const truncated = bytes.length > MAX_FETCH_BYTES;
    const slice = truncated ? bytes.subarray(0, MAX_FETCH_BYTES) : bytes;
    const text = new TextDecoder().decode(slice);

    return `${url} [${res.status}] [${contentType}]${truncated ? ' [truncated]' : ''}\n${'─'.repeat(40)}\n${text}`;
  },
});
