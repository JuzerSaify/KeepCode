import type { OllamaClient } from './client.js';
import type {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaStreamChunk,
  OllamaTool,
  OllamaChatMessage,
} from '../../types/index.js';
import type { Message, ToolDefinition, ToolCall, AgentConfig } from '../../types/index.js';

function toOllamaMessages(messages: Message[]): OllamaChatMessage[] {
  return messages.map((m) => {
    const content = Array.isArray(m.content)
      ? m.content.map((b) => (b.type === 'text' ? b.text ?? '' : '')).join('\n')
      : m.content;
    return { role: m.role, content };
  });
}

function toOllamaTools(tools: ToolDefinition[]): OllamaTool[] {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

export async function chat(
  client: OllamaClient,
  messages: Message[],
  tools: ToolDefinition[],
  config: AgentConfig
): Promise<OllamaChatResponse> {
  const body: OllamaChatRequest = {
    model: config.model,
    messages: toOllamaMessages(messages),
    tools: tools.length > 0 ? toOllamaTools(tools) : undefined,
    stream: false,
    options: {
      temperature: config.temperature,
      num_ctx: config.contextWindow,
      num_predict: config.maxTokens,
    },
  };
  return client.post<OllamaChatResponse>('/api/chat', body);
}

export async function* chatStream(
  client: OllamaClient,
  messages: Message[],
  tools: ToolDefinition[],
  config: AgentConfig
): AsyncGenerator<OllamaStreamChunk> {
  const body: OllamaChatRequest = {
    model: config.model,
    messages: toOllamaMessages(messages),
    tools: tools.length > 0 ? toOllamaTools(tools) : undefined,
    stream: true,
    options: {
      temperature: config.temperature,
      num_ctx: config.contextWindow,
      num_predict: config.maxTokens,
    },
  };

  const stream = await client.postStream('/api/chat', body);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          yield JSON.parse(trimmed) as OllamaStreamChunk;
        } catch {
          // skip malformed line
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function parseToolCalls(response: OllamaChatResponse): ToolCall[] {
  const raw = response.message?.tool_calls;
  if (!raw || raw.length === 0) return [];
  return raw.map((tc, i) => ({
    id: `call_${Date.now()}_${i}`,
    name: tc.function.name,
    arguments: tc.function.arguments ?? {},
  }));
}
