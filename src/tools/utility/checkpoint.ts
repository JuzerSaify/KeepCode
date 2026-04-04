import { promises as fs } from 'fs';
import path from 'path';
import { registerTool } from '../registry.js';
import { CHECKPOINTS_DIR } from '../../config/defaults.js';
import type { AgentConfig, Message } from '../../types/index.js';

export interface Checkpoint {
  id: string;
  timestamp: string;
  description: string;
  messages: Message[];
  workingDir: string;
}

export async function saveCheckpoint(
  config: AgentConfig,
  messages: Message[],
  description: string
): Promise<string> {
  const dir = path.join(config.workingDir, CHECKPOINTS_DIR);
  await fs.mkdir(dir, { recursive: true });
  const id = `ckpt_${Date.now()}`;
  const checkpoint: Checkpoint = {
    id,
    timestamp: new Date().toISOString(),
    description,
    messages,
    workingDir: config.workingDir,
  };
  await fs.writeFile(
    path.join(dir, `${id}.json`),
    JSON.stringify(checkpoint, null, 2),
    'utf8'
  );
  return id;
}

export async function loadCheckpoint(
  config: AgentConfig,
  id: string
): Promise<Checkpoint | null> {
  const filePath = path.join(config.workingDir, CHECKPOINTS_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as Checkpoint;
  } catch {
    return null;
  }
}

registerTool({
  definition: {
    name: 'create_checkpoint',
    description:
      'Save a checkpoint of the current conversation state. Useful before risky operations so you can reference what was done up to this point.',
    category: 'utility',
    dangerLevel: 'write',
    emoji: '💿',
    parameters: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description of this checkpoint',
        },
      },
      required: ['description'],
    },
  },
  handler: async (args: Record<string, unknown>, config: AgentConfig) => {
    const id = `ckpt_${Date.now()}`;
    const dir = path.join(config.workingDir, CHECKPOINTS_DIR);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${id}.json`),
      JSON.stringify({ id, description: args.description, timestamp: new Date().toISOString() }, null, 2),
      'utf8'
    );
    return `Checkpoint saved: ${id} — "${args.description}"`;
  },
});
