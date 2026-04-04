import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', '.next', '__pycache__', 'coverage']);

function globToRegex(pattern: string): RegExp {
  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') {
      re += '.*';
      i++;
    } else if (c === '*') {
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if ('.+^${}()|[]\\'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp(re + '$');
}

async function globWalk(base: string, dir: string, regex: RegExp): Promise<string[]> {
  let results: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (e.isDirectory()) {
      results = results.concat(await globWalk(base, full, regex));
    } else if (regex.test(rel) || regex.test(e.name)) {
      results.push(full);
    }
  }
  return results;
}

registerTool({
  definition: {
    name: 'glob',
    description:
      'Find files matching a glob pattern. Supports ** for recursive matching. Examples: **/*.ts, src/**/*.test.js, *.json',
    category: 'read',
    dangerLevel: 'safe',
    emoji: '🗂️',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern e.g. **/*.ts' },
        base: {
          type: 'string',
          description: 'Base directory to search from (default: cwd)',
        },
      },
      required: ['pattern'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const base = path.resolve(config.workingDir, String(args.base ?? '.'));
    const pattern = String(args.pattern);
    const regex = globToRegex(pattern);
    const results = await globWalk(base, base, regex);
    if (results.length === 0) return `No files matched "${pattern}" in ${base}`;
    return results.map((r) => path.relative(config.workingDir, r)).join('\n');
  },
});
