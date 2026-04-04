import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import { MAX_FILE_READ_BYTES } from '../../config/defaults.js';
import type { AgentConfig } from '../../types/index.js';

registerTool({
  definition: {
    name: 'read_file',
    description:
      'Read the contents of a file. Supports optional line range. Files larger than 512KB are truncated. Use this before editing to understand context.',
    category: 'read',
    dangerLevel: 'safe',
    emoji: '📄',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or relative path to the file' },
        start_line: { type: 'number', description: 'First line to read (1-based, optional)' },
        end_line: { type: 'number', description: 'Last line to read (1-based, optional)' },
      },
      required: ['path'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const filePath = path.resolve(config.workingDir, String(args.path));
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) return `Error: "${filePath}" is a directory. Use list_directory.`;

    const buf = await fs.readFile(filePath);
    const truncated = buf.length > MAX_FILE_READ_BYTES;
    const content = truncated
      ? buf.subarray(0, MAX_FILE_READ_BYTES).toString('utf8')
      : buf.toString('utf8');

    const lines = content.split('\n');
    const total = lines.length;

    const startLine = args.start_line ? Number(args.start_line) : 1;
    const endLine = args.end_line ? Number(args.end_line) : total;
    const slice = lines.slice(startLine - 1, endLine);

    const header = `File: ${filePath} (${total} lines${truncated ? ', truncated' : ''})`;
    const numbered = slice
      .map((l, i) => `${String(startLine + i).padStart(5)}  ${l}`)
      .join('\n');

    return `${header}\n${'─'.repeat(60)}\n${numbered}`;
  },
});
