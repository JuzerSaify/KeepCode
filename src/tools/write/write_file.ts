import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

registerTool({
  definition: {
    name: 'write_file',
    description:
      'Write content to a file. Creates parent directories if needed. Overwrites existing files. Always use read_file first when modifying an existing file.',
    category: 'write',
    dangerLevel: 'write',
    emoji: '✏️',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['path', 'content'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const filePath = path.resolve(config.workingDir, String(args.path));
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, String(args.content), 'utf8');
    const bytes = Buffer.byteLength(String(args.content), 'utf8');
    return `Written ${bytes} bytes to ${filePath}`;
  },
});
