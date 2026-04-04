import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

async function copyRecursive(src: string, dst: string): Promise<void> {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dst, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const e of entries) {
      await copyRecursive(path.join(src, e.name), path.join(dst, e.name));
    }
  } else {
    await fs.mkdir(path.dirname(dst), { recursive: true });
    await fs.copyFile(src, dst);
  }
}

registerTool({
  definition: {
    name: 'copy_file',
    description: 'Copy a file or directory recursively.',
    category: 'write',
    dangerLevel: 'write',
    emoji: '📋',
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
    await copyRecursive(src, dst);
    return `Copied: ${src} → ${dst}`;
  },
});
