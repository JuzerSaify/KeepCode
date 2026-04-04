import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

const execAsync = promisify(exec);

registerTool({
  definition: {
    name: 'run_tests',
    description:
      'Run the project test suite. Auto-detects Jest, Vitest, Mocha, pytest, etc. from package.json. Returns pass/fail summary and failing test details.',
    category: 'code',
    dangerLevel: 'execute',
    emoji: '🧪',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Specific test file or directory (optional)',
        },
        watch: {
          type: 'boolean',
          description: 'Run in watch mode (default false)',
        },
        filter: {
          type: 'string',
          description: 'Filter tests by name pattern (passed to -t or --grep)',
        },
        timeout_ms: {
          type: 'number',
          description: 'Test run timeout (default 120000)',
        },
      },
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const { workingDir } = config;
    const timeout = Number(args.timeout_ms ?? 120_000);
    const watch = args.watch === true ? '--watch' : '';
    const filter = args.filter ? `--testNamePattern ${JSON.stringify(String(args.filter))}` : '';
    const pathArg = args.path ? String(args.path) : '';

    try {
      // Read test script from package.json
      const pkgRaw = await fs.readFile(path.join(workingDir, 'package.json'), 'utf8');
      const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };
      const testScript = pkg.scripts?.test;

      let cmd: string;
      if (testScript && !testScript.includes('echo')) {
        cmd = `npm test -- ${watch} ${filter} ${pathArg}`.trim();
      } else {
        // Auto-detect
        const hasVitest = testScript?.includes('vitest');
        cmd = hasVitest
          ? `npx vitest run ${pathArg} ${filter}`
          : `npx jest ${pathArg} ${watch} ${filter} --no-coverage`;
      }

      const { stdout, stderr } = await execAsync(cmd, {
        cwd: workingDir,
        timeout,
        maxBuffer: 5 * 1024 * 1024,
        env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
      });
      return (stdout + stderr).trim();
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string; killed?: boolean };
      if (err.killed) return `Tests timed out after ${timeout}ms`;
      return ((err.stdout ?? '') + (err.stderr ?? '')).trim() || String(err.message);
    }
  },
});
