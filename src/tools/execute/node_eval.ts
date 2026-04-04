import { createContext, runInContext } from 'vm';
import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

registerTool({
  definition: {
    name: 'node_eval',
    description:
      'Evaluate a JavaScript/TypeScript snippet in a sandboxed Node.js context. Useful for quick calculations, data transformations, or testing logic snippets. No file system access. Returns the last expression value.',
    category: 'execute',
    dangerLevel: 'execute',
    emoji: '🧮',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code to evaluate' },
      },
      required: ['code'],
    },
  },
  handler: async (args: Record<string, unknown>, _config: AgentConfig) => {
    const code = String(args.code);
    const sandbox = {
      console: {
        log: (...a: unknown[]) => logs.push(a.map(String).join(' ')),
        error: (...a: unknown[]) => logs.push('ERROR: ' + a.map(String).join(' ')),
      },
      result: undefined as unknown,
    };
    const logs: string[] = [];
    const ctx = createContext(sandbox);

    try {
      const val = runInContext(code, ctx, { timeout: 5000 });
      const output: string[] = [];
      if (logs.length > 0) output.push(logs.join('\n'));
      if (val !== undefined) output.push(String(val));
      return output.join('\n') || '(no output)';
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});
