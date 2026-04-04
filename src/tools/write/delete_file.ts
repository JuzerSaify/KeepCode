import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

registerTool({
  definition: {
    name: 'delete_file',
    description:
      'Delete a file or empty directory. Cannot delete non-empty directories. Confirm the target before deleting.',
    category: 'write',
    dangerLevel: 'destructive',
    emoji: '🗑️',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to delete' },
      },
      required: ['path'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const target = path.resolve(config.workingDir, String(args.path));
    const stat = await fs.stat(target);
    if (stat.isDirectory()) {
      await fs.rmdir(target);
      return `Deleted directory: ${target}`;
    } else {
      await fs.unlink(target);
      return `Deleted file: ${target}`;
    }
  },
});
