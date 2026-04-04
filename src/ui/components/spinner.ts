import ora, { type Ora } from 'ora';
import { theme } from '../theme.js';

export class Spinner {
  private ora: Ora;

  constructor(text: string) {
    this.ora = ora({
      text,
      spinner: 'dots',
      color: 'magenta',
    });
  }

  start(text?: string): this {
    if (text) this.ora.text = text;
    this.ora.start();
    return this;
  }

  text(t: string): this {
    this.ora.text = t;
    return this;
  }

  succeed(text?: string): void {
    this.ora.succeed(text ? theme.success(text) : undefined);
  }

  fail(text?: string): void {
    this.ora.fail(text ? theme.error(text) : undefined);
  }

  warn(text?: string): void {
    this.ora.warn(text ? theme.warning(text) : undefined);
  }

  info(text?: string): void {
    this.ora.info(text ? theme.info(text) : undefined);
  }

  stop(): void {
    this.ora.stop();
  }

  clear(): void {
    this.ora.clear();
  }
}
