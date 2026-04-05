import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_CONFIG, KEEPCODE_DIR } from './defaults.js';
import type { AgentConfig, AIProvider } from '../types/index.js';

interface ConfigFile {
  model?: string;
  provider?: AIProvider;
  apiKey?: string;
  apiBaseUrl?: string;
  /** @deprecated renamed to apiBaseUrl */
  ollamaUrl?: string;
  temperature?: number;
  maxIterations?: number;
  contextWindow?: number;
  maxTokens?: number;
  autoApprove?: boolean;
  verbose?: boolean;
}

/**
 * Loads .keepcode/config.json from the project root, merging with defaults.
 * CLI flags take precedence over config file values.
 */
export async function loadConfig(workingDir: string): Promise<Partial<AgentConfig>> {
  const configPath = path.join(workingDir, KEEPCODE_DIR, 'config.json');
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const file = JSON.parse(raw) as ConfigFile;
    return {
      model:         file.model,
      provider:      file.provider,
      apiKey:        file.apiKey,
      // backward compat: ollamaUrl was renamed to apiBaseUrl
      apiBaseUrl:    file.apiBaseUrl ?? file.ollamaUrl,
      temperature:   file.temperature,
      maxIterations: file.maxIterations,
      contextWindow: file.contextWindow,
      maxTokens:     file.maxTokens,
      autoApprove:   file.autoApprove,
      verbose:       file.verbose,
    };
  } catch {
    return {};
  }
}

/**
 * Persist a partial config update (model, provider, apiBaseUrl, etc.) to
 * .keepcode/config.json, merging with whatever is already on disk.
 */
export async function saveConfig(workingDir: string, updates: Partial<ConfigFile>): Promise<void> {
  const dir = path.join(workingDir, KEEPCODE_DIR);
  const configPath = path.join(dir, 'config.json');
  let existing: ConfigFile = {};
  try {
    existing = JSON.parse(await fs.readFile(configPath, 'utf8')) as ConfigFile;
  } catch { /* file may not exist yet, that's fine */ }
  const merged = { ...existing, ...updates };
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
}

/**
 * Write the default config file to .keepcode/config.json if it doesn't exist.
 */
export async function initConfig(workingDir: string): Promise<void> {
  const dir = path.join(workingDir, KEEPCODE_DIR);
  const configPath = path.join(dir, 'config.json');
  try {
    await fs.access(configPath);
  } catch {
    await fs.mkdir(dir, { recursive: true });
    const defaults = { ...DEFAULT_CONFIG };
    await fs.writeFile(configPath, JSON.stringify(defaults, null, 2) + '\n', 'utf8');
  }
}
