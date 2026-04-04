import { exec } from 'child_process';
import { promisify } from 'util';
import { registerTool } from '../registry.js';
import { BASH_TIMEOUT_MS } from '../../config/defaults.js';
import type { AgentConfig } from '../../types/index.js';

const execAsync = promisify(exec);

registerTool({
  definition: {
    name: 'bash',
    description:
      'Execute a shell command. Returns stdout and stderr. Use for: running tests, installing packages, building code, git operations, checking system state. 120s timeout.',
    category: 'execute',
    dangerLevel: 'execute',
    emoji: '⚡',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: {
          type: 'string',
          description:
            'Working directory for the command (default: agent working directory)',
        },
        timeout_ms: {
          type: 'number',
          description: `Timeout in ms (default: ${BASH_TIMEOUT_MS}, max: 300000)`,
        },
      },
      required: ['command'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const command = String(args.command);
    const cwd = args.cwd
      ? String(args.cwd)
      : config.workingDir;
    const timeout = Math.min(Number(args.timeout_ms ?? BASH_TIMEOUT_MS), 300_000);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 5 * 1024 * 1024,
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
      });

      const out = stdout.trim();
      const err = stderr.trim();
      const parts: string[] = [];
      if (out) parts.push(`STDOUT:\n${out}`);
      if (err) parts.push(`STDERR:\n${err}`);
      return parts.join('\n\n') || '(no output)';
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string; killed?: boolean };
      if (err.killed) return `Error: Command timed out after ${timeout}ms`;
      const out = err.stdout?.trim();
      const stderr = err.stderr?.trim();
      const parts: string[] = [];
      if (out) parts.push(`STDOUT:\n${out}`);
      if (stderr) parts.push(`STDERR:\n${stderr}`);
      if (parts.length === 0) parts.push(`Error: ${err.message ?? 'unknown error'}`);
      return parts.join('\n\n');
    }
  },
});
