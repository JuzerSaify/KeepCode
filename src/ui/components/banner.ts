import boxen from 'boxen';
import { theme } from '../theme.js';
import os from 'os';

const ASCII = `
 █████╗ ██████╗ ███████╗██╗  ██╗
██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝
███████║██████╔╝█████╗   ╚███╔╝ 
██╔══██║██╔═══╝ ██╔══╝   ██╔██╗ 
██║  ██║██║     ███████╗██╔╝ ██╗
╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝`.trim();

export function printBanner(version: string, model: string, cwd: string): void {
  const now      = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const platform = `${process.platform} / Node ${process.version}`;
  const mem      = `${(os.freemem() / 1024 ** 3).toFixed(1)}GB free`;

  const art      = theme.brand(ASCII);
  const content  = [
    art,
    '',
    `  ${theme.label('Version')}  ${theme.muted('v' + version)}    ${theme.dim(platform)}`,
    `  ${theme.label('Model  ')}  ${theme.accent(model)}`,
    `  ${theme.label('CWD    ')}  ${theme.path(cwd)}`,
    `  ${theme.label('Time   ')}  ${theme.dim(now)}    ${theme.dim(mem)}`,
    '',
    `  ${theme.dim('Commands:')}  ${theme.muted('/help')}  ${theme.muted('/models')}  ${theme.muted('/status')}  ${theme.muted('/clear')}  ${theme.muted('/model <name>')}  ${theme.muted('/exit')}`,
  ].join('\n');

  console.log(
    boxen(content, {
      padding: { top: 1, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: '#7C3AED',
    })
  );
}
