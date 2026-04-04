import { exec } from 'child_process';
import { promisify } from 'util';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

const execAsync = promisify(exec);

registerTool({
  definition: {
    name: 'git_log',
    description: 'Show recent git commit history with author, date, and message.',
    category: 'git',
    dangerLevel: 'safe',
    emoji: '📜',
    parameters: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Number of commits to show (default 10)' },
        path: { type: 'string', description: 'Filter to commits affecting this path' },
        oneline: {
          type: 'boolean',
          description: 'One-line format (default true)',
        },
      },
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const count = Number(args.count ?? 10);
    const oneline = args.oneline !== false;
    const format = oneline ? '--oneline' : '--format="%h  %an  %ar  %s"';
    const pathFilter = args.path ? `-- ${String(args.path)}` : '';

    try {
      const { stdout } = await execAsync(
        `git log ${format} -${count} ${pathFilter}`,
        { cwd: config.workingDir, timeout: 15_000, maxBuffer: 1024 * 1024 }
      );
      return stdout.trim() || '(no commits)';
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});
