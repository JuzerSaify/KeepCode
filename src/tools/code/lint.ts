import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

const execAsync = promisify(exec);

async function tryCommand(cmd: string, cwd: string): Promise<string | null> {
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd,
      timeout: 60_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    return (stdout + stderr).trim();
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return ((err.stdout ?? '') + (err.stderr ?? '')) || (err.message ?? null);
  }
}

registerTool({
  definition: {
    name: 'lint',
    description:
      'Run the project linter (ESLint, Biome, pylint, etc.). Auto-detects the linter from package.json scripts. Pass a specific file or directory to narrow scope.',
    category: 'code',
    dangerLevel: 'execute',
    emoji: '🔎',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to lint (default: entire project)' },
        fix: {
          type: 'boolean',
          description: 'Auto-fix fixable issues (default false)',
        },
      },
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const { workingDir } = config;
    const fix = args.fix === true;
    const target = args.path ? String(args.path) : '.';

    // Read package.json to find lint script
    let lintScript: string | null = null;
    try {
      const raw = await fs.readFile(path.join(workingDir, 'package.json'), 'utf8');
      const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
      lintScript = pkg.scripts?.lint ?? null;
    } catch { /* no package.json */ }

    if (lintScript) {
      const cmd = fix ? 'npm run lint -- --fix' : 'npm run lint';
      const out = await tryCommand(cmd, workingDir);
      return out ?? '(no output)';
    }

    // Try ESLint directly
    const eslintFix = fix ? '--fix' : '';
    const eslintOut = await tryCommand(`npx eslint ${eslintFix} ${target} --format compact`, workingDir);
    if (eslintOut !== null) return eslintOut || '✓ No lint issues found';

    return 'No linter detected. Add a "lint" script to package.json.';
  },
});
