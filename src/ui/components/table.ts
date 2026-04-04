import Table from 'cli-table3';
import { theme } from '../theme.js';

export interface TableOptions {
  head: string[];
  rows: string[][];
  colWidths?: number[];
}

/** Render a styled table using cli-table3 */
export function renderTable({ head, rows, colWidths }: TableOptions): void {
  const table = new Table({
    head: head.map((h) => theme.brand.bold(h)),
    colWidths,
    style: {
      head: [],    // disable internal chalk — we apply our own
      border: ['dim'],
    },
    chars: {
      top:    '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
      bottom: '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
      left:   '│', 'left-mid': '├', mid: '─', 'mid-mid': '┼',
      right:  '│', 'right-mid': '┤', middle: '│',
    },
  });

  for (const row of rows) {
    table.push(row);
  }

  console.log(table.toString());
}

/** Quick two-column key-value list */
export function renderKV(entries: [string, string][]): void {
  renderTable({
    head: ['Key', 'Value'],
    rows: entries,
    colWidths: [24, 60],
  });
}
