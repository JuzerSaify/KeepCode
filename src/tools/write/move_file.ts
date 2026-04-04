import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

registerTool({
  definition: {
    name: 'move_file',
    description: 'Move or rename a file or directory.',
    category: 'write',
    dangerLevel: 'write',
    emoji: '🚚',
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source path' },
        destination: { type: 'string', description: 'Destination path' },
      },
      required: ['source', 'destination'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const src = path.resolve(config.workingDir, String(args.source));
    const dst = path.resolve(config.workingDir, String(args.destination));
    await fs.mkdir(path.dirname(dst), { recursive: true });
    await fs.rename(src, dst);
    return `Moved: ${src} → ${dst}`;
  },
});
