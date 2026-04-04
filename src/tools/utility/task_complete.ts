import { registerTool } from '../registry.js';
import type { AgentConfig } from '../../types/index.js';

export const TASK_COMPLETE_SIGNAL = 'APEX_TASK_COMPLETE:';

registerTool({
  definition: {
    name: 'task_complete',
    description:
      'Signal that the task is fully complete. Call this ONLY when you have verified that everything works correctly. Provide a clear summary of what was accomplished.',
    category: 'utility',
    dangerLevel: 'safe',
    emoji: '✅',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Summary of what was accomplished and any important notes',
        },
        artifacts: {
          type: 'array',
          description: 'List of files created or modified',
          items: { type: 'string' },
        },
      },
      required: ['summary'],
    },
  },
  handler: async (args: Record<string, unknown>, _config: AgentConfig) => {
    const artifacts = Array.isArray(args.artifacts)
      ? `\n\nFiles changed:\n${args.artifacts.map((a) => `  • ${a}`).join('\n')}`
      : '';
    return `${TASK_COMPLETE_SIGNAL} ${String(args.summary)}${artifacts}`;
  },
});
