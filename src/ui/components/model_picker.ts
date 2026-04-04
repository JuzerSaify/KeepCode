import readline from 'readline';
import { theme } from '../theme.js';

export interface ModelChoice {
  name: string;
  size: string;
  toolSupport: boolean;
}

/** Interactive keyboard-driven model picker */
export async function pickModel(models: ModelChoice[]): Promise<string> {
  if (models.length === 0) {
    throw new Error('No Ollama models available. Run: ollama pull <model>');
  }

  return new Promise((resolve) => {
    let selected = 0;

    const render = () => {
      // Clear previous lines
      process.stdout.write('\x1B[2J\x1B[0f');

      console.log(theme.brand.bold('\n  Select a model:\n'));
      models.forEach((m, i) => {
        const cursor = i === selected ? theme.brand('▶ ') : '  ';
        const name   = i === selected ? theme.bold(m.name) : theme.muted(m.name);
        const size   = theme.dim(` (${m.size})`);
        const tools  = m.toolSupport ? theme.success(' ✓ tools') : theme.muted(' ✗ tools');
        console.log(`  ${cursor}${name}${size}${tools}`);
      });

      console.log(theme.dim('\n  ↑↓ navigate  Enter select  q quit'));
    };

    render();

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const onKey = (_chunk: string, key: { name: string; ctrl: boolean }) => {
      if (!key) return;

      if (key.name === 'up') {
        selected = (selected - 1 + models.length) % models.length;
        render();
      } else if (key.name === 'down') {
        selected = (selected + 1) % models.length;
        render();
      } else if (key.name === 'return') {
        cleanup();
        resolve(models[selected].name);
      } else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
        cleanup();
        process.exit(0);
      }
    };

    const cleanup = () => {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.off('keypress', onKey);
      process.stdin.pause();
    };

    if (!process.stdin.isTTY) {
      // Non-interactive stdin (piped): skip UI, return first model
      cleanup();
      resolve(models[0].name);
      return;
    }

    process.stdin.on('keypress', onKey);
    process.stdin.resume();
  });
}
