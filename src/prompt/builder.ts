import path from 'path';
import { promises as fs } from 'fs';
import { identitySection } from './sections/identity.js';
import { principlesSection } from './sections/principles.js';
import { toolsGuideSection } from './sections/tools_guide.js';
import { taskPatternsSection } from './sections/task_patterns.js';
import { antiPatternsSection } from './sections/anti_patterns.js';
import { loadMemory, loadRelevantInsights } from '../agent/memory.js';
import type { AgentConfig } from '../types/index.js';

/** Detect project context for injection into the system prompt */
async function detectProjectContext(workingDir: string): Promise<string> {
  const lines: string[] = [];

  // Git branch
  try {
    const { execSync } = await import('child_process');
    const branch = execSync('git -C ' + JSON.stringify(workingDir) + ' rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    lines.push(`Git branch: ${branch}`);
  } catch {
    // not a git repo — fine
  }

  // package.json
  try {
    const pkgPath = path.join(workingDir, 'package.json');
    const raw = await fs.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    const name = pkg['name'] as string | undefined;
    const version = pkg['version'] as string | undefined;
    const scripts = pkg['scripts'] as Record<string, string> | undefined;
    if (name) lines.push(`Project: ${name}${version ? ` v${version}` : ''}`);
    if (scripts) {
      const scriptNames = Object.keys(scripts).slice(0, 8).join(', ');
      lines.push(`NPM scripts: ${scriptNames}`);
    }
  } catch {
    // no package.json
  }

  // tsconfig presence
  try {
    await fs.access(path.join(workingDir, 'tsconfig.json'));
    lines.push('Language: TypeScript');
  } catch {
    try {
      await fs.access(path.join(workingDir, 'pyproject.toml'));
      lines.push('Language: Python (pyproject.toml)');
    } catch {
      try {
        await fs.access(path.join(workingDir, 'Cargo.toml'));
        lines.push('Language: Rust');
      } catch {
        // no language detected
      }
    }
  }

  // KEEPCODE.md / APEX.md or README.md project notes
  const contextFiles = ['KEEPCODE.md', 'APEX.md', 'AGENTS.md', 'CLAUDE.md', '.copilot-instructions.md'];
  for (const fn of contextFiles) {
    try {
      const content = await fs.readFile(path.join(workingDir, fn), 'utf8');
      const trimmed = content.slice(0, 2000).trim();
      if (trimmed) {
        lines.push(`\n### ${fn}\n${trimmed}`);
        break; // only use the first match
      }
    } catch {
      // not found
    }
  }

  return lines.length > 0
    ? `\n## PROJECT CONTEXT\n${lines.join('\n')}`
    : '';
}

/**
 * Assemble the full system prompt for a given agent config and task.
 * Sections: identity → principles → tools_guide → task_patterns → anti_patterns
 *           → project context → memory → training insights
 */
export async function buildSystemPrompt(
  config: AgentConfig,
  task: string
): Promise<string> {
  const sections: string[] = [
    identitySection(config.model, config.sessionId, config.workingDir),
    principlesSection(),
    toolsGuideSection(),
    taskPatternsSection(),
    antiPatternsSection(),
  ];

  // Project context
  const projCtx = await detectProjectContext(config.workingDir);
  if (projCtx) sections.push(projCtx);

  // Memory
  const memory = await loadMemory(config);
  if (memory.trim()) {
    sections.push(`\n## PERSISTENT MEMORY\nThe following notes were written in previous sessions.\n\n${memory.trim()}`);
  }

  // Training insights
  const insights = await loadRelevantInsights(config, task);
  if (insights.length > 0) {
    const list = insights.map((ins, i) => `${i + 1}. ${ins}`).join('\n');
    sections.push(
      `\n## LESSONS FROM PRIOR RUNS\nApply these insights derived from your previous task history:\n\n${list}`
    );
  }

  sections.push(
    `\n## CURRENT WORKING DIRECTORY\n${config.workingDir}`
  );

  return sections.join('\n\n').trim();
}
