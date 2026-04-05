import search from '@inquirer/search';
import select from '@inquirer/select';
import chalk from 'chalk';

export interface ModelChoice {
  name: string;
  /** Friendly display name for cloud-provider models (e.g. 'GPT-4o') */
  displayName?: string;
  /** Human-readable size for local Ollama models (e.g. '7.0 GB') */
  size: string;
  /** Context window in tokens, shown as e.g. '128k ctx' for cloud models */
  contextLength?: number;
  toolSupport: boolean;
}

const PROVIDERS = [
  { value: 'ollama',    name: 'Ollama (local)',  description: 'Free · private · offline — any Ollama model' },
  { value: 'openai',   name: 'OpenAI',           description: 'GPT-4o, o3-mini · needs OPENAI_API_KEY' },
  { value: 'anthropic',name: 'Anthropic',        description: 'Claude Sonnet / Haiku · needs ANTHROPIC_API_KEY' },
  { value: 'gemini',   name: 'Google Gemini',    description: 'Gemini 2.5 Flash · needs GEMINI_API_KEY' },
];

/** Searchable interactive model picker — type to filter, ↑↓ to navigate, Enter to select */
export async function pickModel(models: ModelChoice[]): Promise<string> {
  if (models.length === 0) {
    throw new Error('No models available. Run: ollama pull <model>');
  }
  // Non-interactive stdin (piped/CI): skip UI and return first model
  if (!process.stdin.isTTY) return models[0].name;

  const choices = models.map((m) => {
    const rawLabel = m.displayName ?? m.name;
    const meta     = m.contextLength
      ? `${Math.round(m.contextLength / 1000)}k ctx`
      : m.size ? m.size : '';
    const toolTag  = m.toolSupport ? chalk.hex('#10B981')('✓ tools') : chalk.dim('✗ tools');
    const desc     = chalk.dim('  id: ') + chalk.bold(m.name)
                   + (meta ? chalk.dim('  ·  ' + meta) : '')
                   + '  ' + toolTag;
    return {
      name:        chalk.hex('#7C3AED').bold(rawLabel),
      value:       m.name,
      description: desc,
      short:       m.name,
      _raw:        rawLabel.toLowerCase(),
    };
  });

  return search<string>({
    message: 'Select a model  (type to filter)',
    source: (input?: string) => {
      if (!input) return choices;
      const q = input.toLowerCase();
      return choices.filter((c) => c.value.toLowerCase().includes(q) || c._raw.includes(q));
    },
    pageSize: 12,
  });
}

/** Interactive provider picker */
export async function pickProvider(): Promise<string> {
  if (!process.stdin.isTTY) return 'ollama';
  return select<string>({
    message: 'Select AI provider',
    choices: PROVIDERS.map((p) => ({
      name:        chalk.hex('#7C3AED').bold(p.name),
      value:       p.value,
      description: chalk.dim('  ' + p.description),
      short:       p.value,
    })),
  });
}

