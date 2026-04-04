import cliProgress, { type SingleBar } from 'cli-progress';
import { theme } from '../theme.js';

/** Thin wrapper around cli-progress for consistent Apex theming */
export class ProgressBar {
  private bar: SingleBar;

  constructor(label: string, total = 100) {
    this.bar = new cliProgress.SingleBar(
      {
        format:
          `  ${theme.brand(label)} ` +
          `{bar} ` +
          `${theme.muted('{percentage}%')} ` +
          `${theme.dim('{value}/{total}')}`,
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true,
        clearOnComplete: false,
      },
      cliProgress.Presets.shades_classic
    );
    this.bar.start(total, 0);
  }

  update(value: number, payload?: Record<string, unknown>): void {
    this.bar.update(value, payload);
  }

  increment(delta = 1): void {
    this.bar.increment(delta);
  }

  stop(): void {
    this.bar.stop();
  }
}

/** Simple spinner-like dots progress for indeterminate tasks */
export function startIndeterminate(label: string): () => void {
  const frames = ['⠋', '⠙', '⠸', '⠴', '⠦', '⠇'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r  ${theme.brand(frames[i % frames.length])} ${label} `);
    i++;
  }, 80);
  return () => {
    clearInterval(interval);
    process.stdout.write('\r\x1B[K');
  };
}
