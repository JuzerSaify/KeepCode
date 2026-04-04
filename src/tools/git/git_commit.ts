import { exec } from 'child_process';
import { promisify } from 'util';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

const execAsync = promisify(exec);

registerTool({
  definition: {
    name: 'git_commit',
    description:
      'Stage files and create a git commit. Always runs git diff --staged first and shows what will be committed.',
    category: 'git',
    dangerLevel: 'execute',
    emoji: '💾',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Commit message' },
        add_all: {
          type: 'boolean',
          description: 'Stage all changes (git add -A) before committing (default true)',
        },
        files: {
          type: 'array',
          description: 'Specific files to stage (if add_all is false)',
          items: { type: 'string' },
        },
      },
      required: ['message'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const addAll = args.add_all !== false;
    const message = String(args.message);
    const { workingDir } = config;

    try {
      if (addAll) {
        await execAsync('git add -A', { cwd: workingDir, timeout: 15_000 });
      } else if (Array.isArray(args.files)) {
        const files = args.files.map(String).join(' ');
        await execAsync(`git add ${files}`, { cwd: workingDir, timeout: 15_000 });
      }

      const { stdout: diffOut } = await execAsync('git diff --staged --stat', {
        cwd: workingDir,
        timeout: 15_000,
        maxBuffer: 1024 * 1024,
      });

      if (!diffOut.trim()) return 'Nothing to commit (staging area is empty).';

      const { stdout } = await execAsync(`git commit -m ${JSON.stringify(message)}`, {
        cwd: workingDir,
        timeout: 30_000,
        maxBuffer: 1024 * 1024,
      });

      return `Committed:\n${stdout.trim()}\n\nChanges:\n${diffOut.trim()}`;
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});
