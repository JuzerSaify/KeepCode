export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: { type: string };
  properties?: Record<string, ToolParameter>;
  required?: string[];
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
  dangerLevel: 'safe' | 'write' | 'execute' | 'destructive';
  emoji: string;
}

export type ToolCategory =
  | 'read'
  | 'write'
  | 'execute'
  | 'network'
  | 'git'
  | 'code'
  | 'utility';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  tool_call_id: string;
  name: string;
  output: string;
  error?: boolean;
  durationMs?: number;
}

export type ToolHandler = (
  args: Record<string, unknown>,
  config: import('./agent.js').AgentConfig
) => Promise<string>;

export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

export interface ToolPermission {
  toolName: string;
  approved: boolean;
  remember: boolean;
}
