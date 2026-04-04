import type { Message, AgentConfig } from './agent.js';
import type { ToolDefinition, ToolCall } from './tool.js';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface OllamaChatMessage {
  role: string;
  content: string;
  tool_calls?: Array<{
    function: { name: string; arguments: Record<string, unknown> };
  }>;
}

export interface OllamaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: ToolDefinition['parameters'];
  };
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  tools?: OllamaTool[];
  stream: boolean;
  options?: {
    temperature?: number;
    num_ctx?: number;
    num_predict?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
  done_reason?: string;
  eval_count?: number;
  prompt_eval_count?: number;
}

export interface OllamaStreamChunk {
  model: string;
  message: Partial<OllamaChatMessage>;
  done: boolean;
  eval_count?: number;
}

export interface IProvider {
  name: string;
  isAlive(): Promise<boolean>;
  fetchModels(): Promise<OllamaModel[]>;
  chat(
    messages: Message[],
    tools: ToolDefinition[],
    config: AgentConfig
  ): Promise<OllamaChatResponse>;
  parseToolCalls(response: OllamaChatResponse): ToolCall[];
}
