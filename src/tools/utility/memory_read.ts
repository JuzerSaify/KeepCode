import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import { MEMORY_FILE } from '../../config/defaults.js';
import type { AgentConfig } from '../../types/index.js';

registerTool({
  definition: {
    name: 'memory_read',
    description:
      'Read the persistent memory file (.apex/memory.md). Contains notes from previous sessions and tool-written entries.',
    category: 'utility',
    dangerLevel: 'safe',
    emoji: '🧠',
    parameters: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Optional key to filter entries by (searches for ## key headers)',
        },
      },
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const memPath = path.join(config.workingDir, MEMORY_FILE);
    try {
      const content = await fs.readFile(memPath, 'utf8');
      if (!args.key) return content;
      const key = String(args.key).toLowerCase();
      const sections = content.split(/^## /m);
      const match = sections.find((s) => s.toLowerCase().startsWith(key));
      return match ? `## ${match}` : `No memory entry found for key: ${args.key}`;
    } catch {
      return '(Memory is empty)';
    }
  },
});
