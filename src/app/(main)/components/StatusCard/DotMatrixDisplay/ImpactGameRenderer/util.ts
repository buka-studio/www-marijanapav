import { ImpactCell } from './models';

export function shuffleInPlace<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function cellsFromData(data: string[]): ImpactCell[] {
  const cells: ImpactCell[] = [];
  data.forEach((row, rowIdx) => {
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      if (row[colIdx] === '1') {
        cells.push({ dx: colIdx, dy: rowIdx });
      }
    }
  });
  return cells;
}

export function normalizeCells(cells: ImpactCell[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const cell of cells) {
    minX = Math.min(minX, cell.dx);
    minY = Math.min(minY, cell.dy);
    maxX = Math.max(maxX, cell.dx);
    maxY = Math.max(maxY, cell.dy);
  }
  const normalized = cells.map(({ dx, dy }) => ({ dx: dx - minX, dy: dy - minY }));
  return {
    cells: normalized,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}
