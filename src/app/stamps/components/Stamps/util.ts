type NodeResult = { x: number; y: number; fit: boolean };

export function computeGridArrangement(opts: {
  container: HTMLElement;
  children: Array<{ width: number; height: number }>;
  paddingX: number;
  paddingY: number;
  gap: number;
}): NodeResult[] {
  const { container, children, paddingX, paddingY, gap } = opts;

  const results: NodeResult[] = children.map(() => ({ x: 0, y: 0, fit: false }));
  if (!container || children.length === 0) {
    return results;
  }

  const usableW = Math.max(0, container.clientWidth - 2 * paddingX);
  const usableH = Math.max(0, container.clientHeight - 2 * paddingY);
  if (usableW <= 0 || usableH <= 0) {
    return results;
  }

  const cellW = Math.max(...children.map((c) => c.width));
  const cellH = Math.max(...children.map((c) => c.height));

  const cols = Math.max(1, Math.floor((usableW + gap) / (cellW + gap)));
  const rowsFit = Math.max(1, Math.floor((usableH + gap) / (cellH + gap)));

  const minRowsNeeded = Math.ceil(children.length / cols);
  const rowsUsed = Math.min(rowsFit, Math.max(1, minRowsNeeded));

  const contentH = rowsUsed * cellH + (rowsUsed - 1) * gap;
  const originY = paddingY + (usableH - contentH) / 2;

  let assigned = 0;
  for (let r = 0; r < rowsUsed; r++) {
    const remaining = children.length - assigned;
    const isLastUsedRow = r === rowsUsed - 1;
    const nInRow = isLastUsedRow ? remaining : Math.min(cols, remaining);
    if (nInRow <= 0) break;

    const rowContentW = nInRow * cellW + (nInRow - 1) * gap;
    const originX = paddingX + (usableW - rowContentW) / 2;
    const yCenter = originY + r * (cellH + gap) + cellH / 2;

    for (let j = 0; j < nInRow; j++) {
      const idx = assigned + j;
      const xCenter = originX + j * (cellW + gap) + cellW / 2;
      results[idx] = { x: xCenter, y: yCenter, fit: true };
    }
    assigned += nInRow;
  }

  return results;
}
