import { theme } from '../theme.js';

/** Compute a minimal line diff between two text blobs and print it */
export function showDiff(before: string, after: string, filePath?: string): void {
  const beforeLines = before.split('\n');
  const afterLines  = after.split('\n');

  if (filePath) {
    console.log(theme.accent.bold(`\n  Diff: ${filePath}`));
  }

  const maxLen = Math.max(beforeLines.length, afterLines.length);

  // Simple linear diff: mark removed / added lines
  const removed = new Set(beforeLines.filter((l) => !afterLines.includes(l)));
  const added   = new Set(afterLines.filter((l) => !beforeLines.includes(l)));

  let i = 0;
  let j = 0;
  const out: string[] = [];

  while (i < beforeLines.length || j < afterLines.length) {
    const bl = beforeLines[i];
    const al = afterLines[j];

    if (bl === al) {
      // unchanged
      if (maxLen < 50 || out.length < 3) {
        out.push(theme.muted(`  ${bl ?? ''}`));
      }
      i++; j++;
    } else if (bl !== undefined && removed.has(bl) && !afterLines.includes(bl)) {
      out.push(theme.error(`- ${bl}`));
      i++;
    } else if (al !== undefined && added.has(al) && !beforeLines.includes(al)) {
      out.push(theme.success(`+ ${al}`));
      j++;
    } else {
      if (bl !== undefined) { out.push(theme.error(`- ${bl}`)); i++; }
      if (al !== undefined) { out.push(theme.success(`+ ${al}`)); j++; }
    }
  }

  // Trim context lines — only show a window around changes
  console.log(out.slice(0, 80).join('\n'));
}

/** Show a two-column side-by-side diff for short files */
export function showSideBySide(
  before: string,
  after: string,
  cols = 60
): void {
  const bl = before.split('\n');
  const al = after.split('\n');
  const max = Math.max(bl.length, al.length);

  console.log(
    theme.error.bold('  BEFORE'.padEnd(cols)) +
    theme.success.bold('  AFTER')
  );
  console.log(theme.dim('-'.repeat(cols * 2 + 4)));

  for (let i = 0; i < max; i++) {
    const left  = (bl[i] ?? '').slice(0, cols - 2);
    const right = (al[i] ?? '').slice(0, cols - 2);
    const leftPad = left.padEnd(cols);
    const diff    = left !== right;
    console.log(
      (diff ? theme.error(leftPad) : theme.muted(leftPad)) +
      '  ' +
      (diff ? theme.success(right) : theme.muted(right))
    );
  }
}
