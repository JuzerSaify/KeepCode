import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

registerTool({
  definition: {
    name: 'create_directory',
    description: 'Create a directory and all parent directories.',
    category: 'write',
    dangerLevel: 'write',
    emoji: '📂',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path to create' },
      },
      required: ['path'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const dirPath = path.resolve(config.workingDir, String(args.path));
    await fs.mkdir(dirPath, { recursive: true });
    return `Created directory: ${dirPath}`;
  },
});
