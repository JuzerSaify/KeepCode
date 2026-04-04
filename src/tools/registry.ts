import type { RegisteredTool } from '../types/index.js';

const registry = new Map<string, RegisteredTool>();

export function registerTool(tool: RegisteredTool): void {
  registry.set(tool.definition.name, tool);
}

export function getTool(name: string): RegisteredTool | undefined {
  return registry.get(name);
}

export function getAllTools(): RegisteredTool[] {
  return Array.from(registry.values());
}

export function getToolDefinitions() {
  return getAllTools().map((t) => t.definition);
}
