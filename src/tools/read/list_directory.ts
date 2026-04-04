import { promises as fs, Dirent } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

const IGNORE = new Set(['.git', 'node_modules', 'dist', '.next', '__pycache__', '.venv', 'venv']);

async function listDir(dirPath: string, depth: number, maxDepth: number): Promise<string[]> {
  if (depth > maxDepth) return [`${'  '.repeat(depth)}...`];
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const lines: string[] = [];
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const indent = '  '.repeat(depth);
    if (e.isDirectory()) {
      lines.push(`${indent}${e.name}/`);
      const sub = await listDir(path.join(dirPath, e.name), depth + 1, maxDepth);
      lines.push(...sub);
    } else {
      lines.push(`${indent}${e.name}`);
    }
  }
  return lines;
}

registerTool({
  definition: {
    name: 'list_directory',
    description:
      'List files and directories. Skips .git, node_modules, dist, etc. Use depth to control recursion.',
    category: 'read',
    dangerLevel: 'safe',
    emoji: '📁',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path to list' },
        depth: { type: 'number', description: 'Recursion depth (default 2, max 6)' },
      },
      required: ['path'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const dirPath = path.resolve(config.workingDir, String(args.path ?? '.'));
    const depth = Math.min(Number(args.depth ?? 2), 6);
    const lines = await listDir(dirPath, 0, depth);
    if (lines.length === 0) return `Directory "${dirPath}" is empty.`;
    return `${dirPath}\n${lines.join('\n')}`;
  },
});
