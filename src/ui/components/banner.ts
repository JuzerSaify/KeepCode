import chalk from 'chalk';
import boxen from 'boxen';
import { theme } from '../theme.js';
import os from 'os';
import { execSync } from 'child_process';

// KEEP block — rendered in white bold
const KEEP_LINES = [
  '  ██╗  ██╗███████╗███████╗██████╗ ',
  '  ██║ ██╔╝██╔════╝██╔════╝██╔══██╗',
  '  █████╔╝ █████╗  █████╗  ██████╔╝',
  '  ██╔═██╗ ██╔══╝  ██╔══╝  ██╔═══╝ ',
  '  ██║  ██╗███████╗███████╗██║     ',
  '  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ',
];

// Separator
const SEP_LINE = '  ─────────────────────────────────';

// CODE block — rendered in white
const CODE_LINES = [
  '   ██████╗ ██████╗ ██████╗ ███████╗',
  '  ██╔════╝██╔═══██╗██╔══██╗██╔════╝',
  '  ██║     ██║   ██║██║  ██║█████╗  ',
  '  ██║     ██║   ██║██║  ██║██╔══╝  ',
  '  ╚██████╗╚██████╔╝██████╔╝███████╗',
  '   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝',
];

function buildArt(): string {
  const lines = [
    ...KEEP_LINES.map((l) => chalk.white.bold(l)),
    chalk.dim(SEP_LINE),
    ...CODE_LINES.map((l) => chalk.white(l)),
  ];
  return lines.join('\n');
}

/** Try to detect VS Code version from environment or CLI */
export function detectVSCodeVersion(): string | null {
  // Running inside a VS Code terminal
  if (process.env['TERM_PROGRAM'] === 'vscode') {
    const ver = process.env['TERM_PROGRAM_VERSION'];
    if (ver) return `VS Code ${ver}`;
    return 'VS Code (terminal)';
  }
  // Try the CLI
  try {
    const out = execSync('code --version 2>&1', {
      encoding: 'utf8',
      timeout: 2000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    const ver = out.split('\n')[0];
    if (ver && /^\d+\.\d+/.test(ver)) return `VS Code ${ver}`;
  } catch {
    // not installed or not on PATH
  }
  return null;
}

/** Strip ANSI escape codes for length measurement */
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1B\[[0-9;]*m/g, '');
}

export function printBanner(version: string, model: string, cwd: string): void {
  const now      = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const platform = `${process.platform} / Node ${process.version}`;
  const mem      = `${(os.freemem() / 1024 ** 3).toFixed(1)} GB free`;
  const vscode   = detectVSCodeVersion();

  const art     = buildArt();
  const cmdList = ['/help', '/models', '/tools', '/status', '/provider', '/model <name>', '/clear', '/history', '/exit']
    .map((c) => theme.muted(c)).join('  ');

  const lines = [
    art,
    '',
    `  ${theme.label('Version')}  ${theme.muted('v' + version)}    ${chalk.dim(platform)}`,
    `  ${theme.label('Model  ')}  ${theme.accent(model)}`,
    `  ${theme.label('CWD    ')}  ${theme.path(cwd)}`,
    `  ${theme.label('Time   ')}  ${chalk.dim(now)}    ${chalk.dim(mem)}`,
    ...(vscode ? [`  ${theme.label('Editor ')}  ${chalk.dim(vscode)}`] : []),
    '',
    `  ${chalk.dim('Commands:')}  ${cmdList}`,
  ];

  console.log(
    boxen(lines.join('\n'), {
      padding: { top: 1, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: '#ffffff',
    })
  );
}

/**
 * Print a compact sticky session header — call after each agent response
 * to keep model/provider/turn context anchored at the bottom of history.
 */
export function printCompactHeader(model: string, provider: string, turns: number): void {
  const cols = Math.min(process.stdout.columns ?? 80, 100);
  const sep  = chalk.dim('─'.repeat(cols));
  const left = `  ${chalk.white.bold('KeepCode')}  ${chalk.dim('·')}  ${theme.accent(model)}  ${chalk.dim('·')}  ${theme.muted(provider)}`;
  const right = chalk.dim(`${turns} turn${turns !== 1 ? 's' : ''}`);
  const pad   = Math.max(2, cols - stripAnsi(left).length - stripAnsi(right).length - 2);
  console.log(`\n${sep}\n${left}${' '.repeat(pad)}${right}\n${sep}`);
}

