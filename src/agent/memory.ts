import { promises as fs } from 'fs';
import path from 'path';
import { MEMORY_FILE, TRAINING_FILE, KNOWLEDGE_DIR } from '../config/defaults.js';
import type { AgentConfig, TrainingData } from '../types/index.js';

/** Loads the .apex/memory.md for injection into the system prompt */
export async function loadMemory(config: AgentConfig): Promise<string> {
  const memPath = path.join(config.workingDir, MEMORY_FILE);
  try {
    return await fs.readFile(memPath, 'utf8');
  } catch {
    return '';
  }
}

/** Load top-N insights from training data relevant to the current task */
export async function loadRelevantInsights(
  config: AgentConfig,
  task: string,
  maxInsights = 6
): Promise<string[]> {
  const tPath = path.join(config.workingDir, TRAINING_FILE);
  try {
    const raw = await fs.readFile(tPath, 'utf8');
    const data = JSON.parse(raw) as TrainingData;
    const taskLower = task.toLowerCase();

    // Score insights by keyword relevance
    const scored = data.globalInsights
      .map((insight) => {
        const words = taskLower.split(/\s+/);
        const matches = words.filter((w) => w.length > 3 && insight.toLowerCase().includes(w));
        return { insight, score: matches.length };
      })
      .filter((x) => x.score > 0 || data.globalInsights.indexOf(x.insight) < 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxInsights);

    return scored.map((x) => x.insight);
  } catch {
    return [];
  }
}

/** Load knowledge files from .apex/knowledge/ */
export async function loadKnowledge(config: AgentConfig): Promise<string> {
  const knowledgeDir = path.join(config.workingDir, KNOWLEDGE_DIR);
  try {
    const files = await fs.readdir(knowledgeDir);
    const parts: string[] = [];
    for (const file of files.slice(0, 5)) {
      const content = await fs.readFile(path.join(knowledgeDir, file), 'utf8');
      parts.push(`### ${file}\n${content.slice(0, 2000)}`);
    }
    return parts.join('\n\n');
  } catch {
    return '';
  }
}

/** Ensure all .apex directories exist */
export async function initApexDirs(workingDir: string): Promise<void> {
  const dirs = [
    path.join(workingDir, '.apex'),
    path.join(workingDir, '.apex/training'),
    path.join(workingDir, '.apex/checkpoints'),
    path.join(workingDir, '.apex/knowledge'),
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}
