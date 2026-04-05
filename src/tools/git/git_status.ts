import { exec } from 'child_process';
import { promisify } from 'util';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

const execAsync = promisify(exec);

async function git(args: string, cwd: string): Promise<string> {
  const { stdout, stderr } = await execAsync(`git ${args}`, {
    cwd,
    timeout: 30_000,
    maxBuffer: 2 * 1024 * 1024,
  });
  return (stdout + stderr).trim();
}

registerTool({
  definition: {
    name: 'git_status',
    description:
      'Show git status: staged, unstaged, untracked files, and current branch. Run this first when working with git.',
    category: 'git',
    dangerLevel: 'safe',
    emoji: '📊',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Repository path (default: working directory)',
        },
      },
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const cwd = args.path ? String(args.path) : config.workingDir;
    try {
      const branch = await git('branch --show-current', cwd);
      const status = await git('status --short', cwd);
      // Use try/catch instead of shell redirect (2>/dev/null) for cross-platform safety
      const ahead = await git('rev-list HEAD @{upstream}..HEAD --count', cwd).catch(() => '0');
      return `Branch: ${branch}\nAhead by: ${ahead.trim()} commits\n\n${status || '(clean)'}`;
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});
