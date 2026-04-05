import boxen from 'boxen';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { theme } from './theme.js';
import type { AgentEvent } from '../types/index.js';

type SpinColor = 'cyan' | 'magenta' | 'yellow' | 'blue' | 'white' | 'green' | 'red';

// ── Status display config ─────────────────────────────────────────────────
const STATUS_CFG: Record<string, {
  icon: string; label: string;
  color: (s: string) => string;
  spin: SpinColor;
  spinner: string;
}> = {
  thinking:     { icon: '◆', label: 'Thinking',    color: theme.accent,   spin: 'cyan',    spinner: 'dots12'      },
  planning:     { icon: '◈', label: 'Planning',    color: theme.brand,    spin: 'magenta', spinner: 'bouncingBar' },
  calling_tool: { icon: '⚙', label: 'Tools',       color: theme.warning,  spin: 'yellow',  spinner: 'dots8Bit'    },
  observing:    { icon: '◎', label: 'Analyzing',   color: theme.info,     spin: 'blue',    spinner: 'arc'         },
  compressing:  { icon: '⟳', label: 'Compressing', color: theme.muted,    spin: 'white',   spinner: 'squish'      },
  complete:     { icon: '✓', label: 'Complete',    color: theme.success,  spin: 'green',   spinner: 'dots2'       },
  error:        { icon: '✗', label: 'Error',       color: theme.error,    spin: 'red',     spinner: 'dots2'       },
  aborted:      { icon: '⊘', label: 'Aborted',     color: theme.muted,    spin: 'white',   spinner: 'dots2'       },
  idle:         { icon: '◌', label: 'Idle',        color: theme.muted,    spin: 'white',   spinner: 'dots2'       },
};

const STATUS_HINTS: Record<string, string> = {
  thinking:     'processing',
  planning:     'building strategy',
  observing:    'reviewing results',
  compressing:  'trimming context',
  calling_tool: 'invoking tools',
};

/** Compact gradient separator bar */
const GRAD_SEP = chalk.hex('#7C3AED')('──') + chalk.hex('#6D28D9')('──') + chalk.hex('#4F46E5')('──') + chalk.hex('#06B6D4')('──') + chalk.hex('#0891B2')('──') + chalk.hex('#06B6D4')('──') + chalk.hex('#4F46E5')('──') + chalk.hex('#7C3AED')('──');

// ── Inline markdown helpers ───────────────────────────────────────────────────

/** Apply inline markdown: ***bold-italic***, **bold**, *italic*, `inline code` */
function renderInline(s: string): string {
  return s
    .replace(/\*\*\*(.+?)\*\*\*/g, (_, t) => chalk.white.bold.italic(t))
    .replace(/\*\*(.+?)\*\*/g,     (_, t) => chalk.white.bold(t))
    .replace(/\*(.+?)\*/g,         (_, t) => chalk.italic(t))
    .replace(/`([^`\n]+)`/g,       (_, t) => chalk.hex('#F9FAFB').bgHex('#374151')(` ${t} `));
}

/**
 * Full markdown → styled terminal renderer.
 * Handles H1–H4, bold, italic, inline code, fenced code blocks,
 * tables, ordered/unordered lists (nested), blockquotes, and hr.
 */
function renderMd(content: string, indent = '  '): void {
  const cols = Math.min(process.stdout.columns ?? 80, 100);
  const raw  = content.trim().split('\n');
  let   inFence  = false;
  let   fenceLang = '';
  const tableRows: string[] = [];

  const flushTable = (): void => {
    if (tableRows.length === 0) return;
    let isHeader = true;
    for (const row of tableRows) {
      // Skip separator rows like |---|---|
      if (/^\|?[\s\-:|]+\|$/.test(row.trim())) continue;
      const cells = row.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      if (isHeader) {
        isHeader = false;
        console.log(`${indent}${cells.map((c) => chalk.white.bold(c)).join(chalk.dim('  │  '))}`);
        console.log(`${indent}${chalk.dim('─'.repeat(Math.min(cols - indent.length, 70)))}`);
      } else {
        console.log(`${indent}${cells.map((c) => chalk.hex('#E5E7EB')(c)).join(chalk.dim('  │  '))}`);
      }
    }
    tableRows.length = 0;
  };

  for (const rawLine of raw) {
    // ── Fenced code block ────────────────────────────────────────────────────
    if (/^```/.test(rawLine)) {
      if (!inFence) {
        flushTable();
        inFence    = true;
        fenceLang  = rawLine.slice(3).trim();
        const tag  = fenceLang ? chalk.hex('#F59E0B')(` ${fenceLang} `) : '';
        const fill = chalk.dim('─'.repeat(Math.max(2, Math.min(cols - indent.length - fenceLang.length - 6, 44))));
        console.log(`${indent}${chalk.dim('╭──')}${tag}${fill}`);
      } else {
        console.log(`${indent}${chalk.dim('╰' + '─'.repeat(Math.min(cols - indent.length - 2, 46)))}`);
        inFence   = false;
        fenceLang = '';
      }
      continue;
    }
    if (inFence) {
      console.log(`${indent}${chalk.dim('│')} ${chalk.hex('#F9FAFB')(rawLine)}`);
      continue;
    }

    // ── Table rows ────────────────────────────────────────────────────────────
    if (/^\|/.test(rawLine)) { tableRows.push(rawLine); continue; }
    flushTable();

    const line = rawLine;
    if (line.trim() === '')    { console.log(); continue; }

    // ── Horizontal rule ──────────────────────────────────────────────────────
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      console.log(`${indent}${chalk.dim('─'.repeat(Math.min(cols - indent.length, 70)))}`);
      continue;
    }

    // ── Headings ─────────────────────────────────────────────────────────────
    if (/^# /.test(line)) {
      const text = renderInline(line.replace(/^# /, ''));
      console.log(`\n${indent}${chalk.white.bold.underline(text)}`);
      console.log(`${indent}${chalk.dim('═'.repeat(Math.min(line.length - 2, cols - indent.length - 2)))}`);
      continue;
    }
    if (/^## /.test(line)) {
      console.log(`\n${indent}${chalk.hex('#06B6D4').bold('◈  ' + renderInline(line.replace(/^## /, '')))}`);
      continue;
    }
    if (/^### /.test(line)) {
      console.log(`${indent}${chalk.hex('#7C3AED').bold('▸  ' + renderInline(line.replace(/^### /, '')))}`);
      continue;
    }
    if (/^#### /.test(line)) {
      console.log(`${indent}${chalk.dim('·  ' + renderInline(line.replace(/^#### /, '')))}`);
      continue;
    }

    // ── Blockquote ───────────────────────────────────────────────────────────
    if (/^> /.test(line)) {
      console.log(`${indent}${chalk.dim('▎')} ${chalk.italic.hex('#9CA3AF')(renderInline(line.replace(/^> /, '')))}`);
      continue;
    }

    // ── Unordered list (nested) ───────────────────────────────────────────────
    const ulM = line.match(/^(\s*)[-*+] (.+)$/);
    if (ulM) {
      const depth  = Math.floor(ulM[1].length / 2);
      const bullet = depth === 0 ? chalk.hex('#7C3AED')('●')
                   : depth === 1 ? chalk.hex('#06B6D4')('○')
                   : chalk.dim('▪');
      console.log(`${indent}${'  '.repeat(depth)}${bullet} ${chalk.white(renderInline(ulM[2]))}`);
      continue;
    }

    // ── Ordered list ─────────────────────────────────────────────────────────
    const olM = line.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
    if (olM) {
      const depth = Math.floor(olM[1].length / 2);
      console.log(`${indent}${'  '.repeat(depth)}${chalk.hex('#06B6D4').bold(olM[2] + '.')} ${chalk.white(renderInline(olM[3]))}`);
      continue;
    }

    // ── Indented code (4-space) ───────────────────────────────────────────────
    if (/^ {4}/.test(line)) {
      console.log(`${indent}${chalk.dim('│')} ${chalk.hex('#F9FAFB')(line.trimStart())}`);
      continue;
    }

    // ── Normal paragraph ─────────────────────────────────────────────────────
    console.log(`${indent}${chalk.white(renderInline(line))}`);
  }

  flushTable();
}
export class EventRenderer {
  private tokenBuffer   = '';
  private inStream      = false;
  private lastStatus    = '';
  private spinner: Ora | null = null;
  private spinnerBaseText = '';
  private toolStartMs   = 0;
  private runStartMs    = Date.now();
  private curIter       = 0;
  private maxIter       = 0;
  private totalIn       = 0;
  private totalOut      = 0;
  /** Buffered thought — held until onComplete or discarded if tool calls follow */
  private pendingThought = '';
  /** Stored tool info for result display */
  private pendingToolName = '';
  private pendingToolArgs: Record<string, unknown> = {};

  handle(event: AgentEvent): void {
    switch (event.type) {
      case 'status_change':    this.onStatus(event.status, event.message); break;
      case 'token':            this.onToken(event.token); break;
      case 'thought':          this.onThought(event.content); break;
      case 'plan':             this.onPlan(event.steps); break;
      case 'tool_call':        this.onToolCall(event.call.name, event.call.arguments); break;
      case 'tool_result':      this.onToolResult(event.result.name, event.result.output, event.result.error); break;
      case 'compress':         this.onCompress(event.fromTokens, event.toTokens); break;
      case 'error':            this.onError(event.message, event.recoverable); break;
      case 'complete':         this.onComplete(event.summary, event.state.iterations, event.state.toolCallCount, event.state.tokenCount, event.state.inputTokenCount); break;
      case 'abort':            this.onAbort(); break;
      case 'iteration_start':  this.onIteration(event.iteration, event.maxIterations); break;
      case 'token_usage':      this.onTokenUsage(event.totalInputTokens, event.totalOutputTokens); break;
      case 'training_insight': this.onInsight(event.insight); break;
    }
  }

  private stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
      this.spinnerBaseText = '';
    }
  }

  private startSpinner(text: string, color: SpinColor = 'cyan', spinnerName = 'dots2'): void {
    this.stopSpinner();
    this.spinnerBaseText = text;
    this.spinner = ora({ text, spinner: spinnerName as never, color }).start();
  }

  private flushStream(): void {
    if (this.inStream) {
      process.stdout.write('\n');
      this.tokenBuffer = '';
      this.inStream = false;
    }
  }

  private elapsedMs(from: number): string {
    const d = Date.now() - from;
    return d < 1000 ? `${d}ms` : `${(d / 1000).toFixed(1)}s`;
  }

  /**
   * Extract a compact preview string from tool arguments.
   * Shows the single most relevant argument — file path, command, URL, etc.
   */
  private formatToolArg(name: string, args: Record<string, unknown>): string {
    const MAX  = 52;
    const str  = (v: unknown): string => String(v ?? '').trim();
    const tr   = (s: string): string  => s.length > MAX ? s.slice(0, MAX) + '…' : s;
    switch (name) {
      case 'read_file': case 'write_file': case 'edit_file': case 'patch_file':
      case 'delete_file': case 'copy_file': case 'move_file': case 'append_file':
      case 'regex_replace': case 'read_json': case 'write_json': case 'read_lines':
      case 'diff_files':
        return tr(str(args.path ?? args.source ?? ''));
      case 'bash':
        return tr(str(args.command ?? '').split('\n')[0]);
      case 'node_eval':
        return tr(str(args.code ?? '').split('\n')[0]);
      case 'list_directory': case 'summarize_directory':
        return tr(str(args.path ?? args.directory ?? '.'));
      case 'list_files': case 'glob':
        return tr(str(args.pattern ?? args.glob ?? ''));
      case 'search_files':
        return tr(str(args.pattern ?? args.query ?? args.regex ?? ''));
      case 'fetch_url': case 'http_request':
        return tr(str(args.url ?? ''));
      case 'git_commit':
        return tr(str(args.message ?? ''));
      case 'git_diff': case 'git_log':
        return tr(str(args.path ?? args.ref ?? args.branch ?? ''));
      case 'memory_read': case 'memory_write':
        return tr(str(args.key ?? args.path ?? ''));
      case 'think':
        return tr(str(args.thought ?? '').split('\n')[0]);
      case 'plan':
        return tr(str(args.title ?? args.goal ?? ''));
      case 'task_complete':
        return '';
      default: {
        const first = Object.values(args)[0];
        return first ? tr(str(first).split('\n')[0]) : '';
      }
    }
  }

  private onStatus(status: string, message?: string): void {
    this.flushStream();
    const key = `${status}:${message ?? ''}`;
    if (key === this.lastStatus) return;
    this.lastStatus = key;

    const cfg  = STATUS_CFG[status] ?? { icon: '◆', label: status, color: theme.muted, spin: 'white' as SpinColor, spinner: 'dots2' };
    const hint = message ?? STATUS_HINTS[status] ?? '';
    const iter = this.maxIter > 0 ? chalk.dim(`  [${this.curIter}/${this.maxIter}]`) : '';
    const text = `${cfg.color(`${cfg.icon}  ${cfg.label}`)}${iter}${hint ? `  ${chalk.dim(hint)}` : ''}`;

    this.startSpinner(text, cfg.spin, cfg.spinner);
  }

  private onToken(token: string): void {
    // Buffer silently — full content surfaces via onThought / onComplete
    this.tokenBuffer += token;
  }

  private onThought(content: string): void {
    // Buffer the response — don't render yet.
    // If a tool call follows, this is intermediate reasoning and will be discarded.
    this.stopSpinner();
    this.pendingThought = content.trim();
    // Show a quiet spinner so the terminal doesn't go blank
    this.startSpinner(
      `${chalk.hex('#06B6D4')('◆')}  ${chalk.dim('Preparing response…')}`,
      'cyan', 'dots12'
    );
  }

  private onPlan(steps: string[]): void {
    this.stopSpinner();
    this.flushStream();
    this.pendingThought = '';
    this.lastStatus = '';
    if (steps.length === 0) return;
    const cols = Math.min(process.stdout.columns ?? 80, 100);
    console.log(`\n  ${chalk.hex('#7C3AED').bold('◈  Plan')}  ${GRAD_SEP}`);
    for (let i = 0; i < steps.length; i++) {
      console.log(`  ${chalk.hex('#06B6D4').bold(`${String(i + 1).padStart(2)}.`)}  ${chalk.white(steps[i])}`);
    }
    console.log(`  ${chalk.dim('─'.repeat(Math.min(cols - 4, 60)))}`);
  }

  private onToolCall(name: string, args: Record<string, unknown>): void {
    // Discard any buffered thought — it was intermediate reasoning before this tool call
    this.pendingThought = '';
    this.stopSpinner();
    this.flushStream();
    this.lastStatus    = '';
    this.toolStartMs   = Date.now();
    this.pendingToolName = name;
    this.pendingToolArgs = args;

    const arg  = this.formatToolArg(name, args);
    const text = `${chalk.hex('#F59E0B')('⚙')}  ${chalk.white.bold(name)}${arg ? `  ${chalk.dim(arg)}` : ''}`;
    this.startSpinner(`  ${text}`, 'yellow', 'dots8Bit');
  }

  private onToolResult(name: string, output: string, error?: boolean): void {
    const ms = this.elapsedMs(this.toolStartMs);
    this.stopSpinner();

    const arg      = this.formatToolArg(this.pendingToolName, this.pendingToolArgs);
    const nameStr  = chalk.white(name);
    const argStr   = arg ? chalk.dim(`  ${arg}`) : '';
    const msStr    = chalk.dim(`  ${ms}`);

    if (error) {
      const safe      = (output ?? '').trim();
      const firstLine = safe.split('\n')[0].slice(0, 160);
      console.log(`  ${chalk.hex('#EF4444')('⚙')}  ${nameStr}${argStr}  ${chalk.hex('#EF4444')('✗')}${msStr}`);
      if (firstLine) {
        console.log(`     ${chalk.hex('#EF4444').dim(firstLine)}`);
      }
      const rest = safe.split('\n').slice(1, 8);
      for (const l of rest) {
        if (l.trim()) console.log(`     ${chalk.hex('#EF4444').dim(l.slice(0, 160))}`);
      }
    } else {
      console.log(`  ${chalk.hex('#F59E0B')('⚙')}  ${nameStr}${argStr}  ${chalk.hex('#10B981')('✓')}${msStr}`);
    }
  }

  private onCompress(from: number, to: number): void {
    this.stopSpinner();
    this.flushStream();
    const pct = Math.round((1 - to / from) * 100);
    console.log(
      `\n  ${chalk.hex('#3B82F6')('↺')}  ${chalk.dim('Context compressed  ')}` +
      `${chalk.hex('#F59E0B')(String(from))} ${chalk.dim('→')} ${chalk.hex('#10B981')(String(to))} ` +
      `${chalk.dim(`tokens  (${pct}% freed)`)}`
    );
  }

  private onError(message: string, recoverable: boolean): void {
    this.stopSpinner();
    this.flushStream();
    this.pendingThought = '';
    this.lastStatus = '';
    const color = recoverable ? '#F59E0B' : '#EF4444';
    const label = recoverable ? '⚠  Warning' : '✗  Error';
    console.log(
      '\n' +
      boxen(`  ${chalk.hex(color)(message)}`, {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: color,
        title: `  ${label}  `,
        titleAlignment: 'left',
      })
    );
  }

  private onComplete(summary: string, iterations: number, toolCalls: number, tokenCount: number, inputTokenCount = 0): void {
    this.stopSpinner();
    this.flushStream();
    this.lastStatus = '';

    const totalMs = Date.now() - this.runStartMs;
    const elapsed = totalMs < 60_000
      ? `${(totalMs / 1000).toFixed(1)}s`
      : `${Math.floor(totalMs / 60_000)}m ${Math.floor((totalMs % 60_000) / 1000)}s`;

    const clean = (summary ?? '').replace(/^(APEX_TASK_COMPLETE|KEEPCODE_TASK_COMPLETE):?\s*/i, '').trim();

    // Use buffered pending thought (from last iteration) or fall back to summary
    const content = this.pendingThought || clean;
    this.pendingThought = '';

    // ── Render response ───────────────────────────────────────────────────────
    if (content) {
      const cols = Math.min(process.stdout.columns ?? 80, 100);
      const sep  = chalk.dim('─'.repeat(Math.max(2, cols - 18)));
      console.log(`\n  ${chalk.hex('#06B6D4').bold('◆  Response')}  ${sep}`);
      renderMd(content);
    }

    // ── Stats footer ──────────────────────────────────────────────────────────
    const dot   = chalk.dim('  ·  ');
    const stats = [
      chalk.dim(`${iterations} iter${iterations !== 1 ? 's' : ''}`),
      chalk.dim(`${toolCalls} tool${toolCalls !== 1 ? 's' : ''}`),
      chalk.dim(`↑${(inputTokenCount ?? 0).toLocaleString()} in`),
      chalk.dim(`↓${tokenCount.toLocaleString()} out`),
      theme.accent(elapsed),
    ].join(dot);

    const cols = Math.min(process.stdout.columns ?? 80, 100);
    const rule = chalk.hex('#10B981').dim('─'.repeat(Math.max(2, cols - 4)));
    console.log(`\n  ${rule}`);
    console.log(`  ${chalk.hex('#10B981')('✔')}  ${chalk.hex('#10B981').bold('Done')}${dot}${stats}\n`);

    this.runStartMs = Date.now(); // reset for next run in REPL
  }

  private onAbort(): void {
    this.stopSpinner();
    this.flushStream();
    this.pendingThought = '';
    this.lastStatus = '';
    console.log(`\n  ${theme.warning('⊗')}  ${theme.warning.bold('Aborted.')}\n`);
  }

  private onIteration(n: number, max: number): void {
    this.curIter = n;
    this.maxIter = max;
    this.lastStatus = ''; // allow same status to re-render with updated iter count
  }

  private onTokenUsage(totalIn: number, totalOut: number): void {
    this.totalIn  = totalIn;
    this.totalOut = totalOut;
    if (this.spinner?.isSpinning && this.spinnerBaseText) {
      this.spinner.text = this.spinnerBaseText +
        chalk.dim(`  ↑${totalIn.toLocaleString()} ↓${totalOut.toLocaleString()}`);
    }
  }

  private onInsight(insight: string): void {
    this.stopSpinner();
    this.flushStream();
    console.log(`\n  ${chalk.hex('#7C3AED')('✦')}  ${chalk.dim('Insight:')} ${chalk.hex('#9CA3AF').italic(insight)}`);
  }
}
