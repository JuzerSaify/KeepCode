import type { OllamaClient } from './client.js';
import type { OllamaModel, OllamaTagsResponse } from '../../types/index.js';

export async function fetchModels(client: OllamaClient): Promise<OllamaModel[]> {
  const data = await client.get<OllamaTagsResponse>('/api/tags');
  return (data.models ?? []).sort((a, b) => b.size - a.size);
}

export function formatModelSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)}GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)}MB`;
  return `${bytes}B`;
}

export function detectToolSupport(model: OllamaModel): boolean {
  const n = model.name.toLowerCase();
  return (
    n.includes('llama3') ||
    n.includes('llama-3') ||
    n.includes('qwen2.5') ||
    n.includes('qwen2') ||
    n.includes('mistral-nemo') ||
    n.includes('command-r') ||
    n.includes('hermes') ||
    n.includes('firefunction')
  );
}
