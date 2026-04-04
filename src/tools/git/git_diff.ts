import { exec } from 'child_process';
import { promisify } from 'util';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

const execAsync = promisify(exec);

registerTool({
  definition: {
    name: 'git_diff',
    description:
      'Show git diff for staged or unstaged changes, or diff a specific file. Useful for reviewing what changed before committing.',
    category: 'git',
    dangerLevel: 'safe',
    emoji: '🔀',
    parameters: {
      type: 'object',
      properties: {
        staged: {
          type: 'boolean',
          description: 'Show staged (cached) diff (default: false = unstaged)',
        },
        path: {
          type: 'string',
          description: 'Specific file path to diff (optional)',
        },
        commit: {
          type: 'string',
          description: 'Compare against specific commit/ref (optional)',
        },
      },
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const parts = ['git diff'];
    if (args.staged) parts.push('--cached');
    if (args.commit) parts.push(String(args.commit));
    if (args.path) parts.push('--', String(args.path));

    try {
      const { stdout } = await execAsync(parts.join(' '), {
        cwd: config.workingDir,
        timeout: 30_000,
        maxBuffer: 2 * 1024 * 1024,
      });
      return stdout.trim() || '(no differences)';
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});
