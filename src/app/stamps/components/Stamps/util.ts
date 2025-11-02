import useMatchMedia from '~/src/hooks/useMatchMedia';

type NodeResult = { x: number; y: number; fit: boolean; id: string };

export function calcArea({ width, height }: { width: number; height: number }) {
  return width * height;
}

export function computeGridArrangement(opts: {
  container: HTMLElement;
  children: Array<{ width: number; height: number; id: string }>;
  paddingX: number;
  paddingY: number;
  gap: number;
}): NodeResult[] {
  const { container, children: originalChildren, paddingX, paddingY, gap } = opts;

  const children = [...originalChildren].sort((a, b) => calcArea(b) - calcArea(a));

  const results: NodeResult[] = children.map((c) => ({ x: 0, y: 0, fit: false, id: c.id }));
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

  const capacity = cols * rowsFit;
  const overflowCount = Math.max(0, children.length - capacity);

  const rowsUsed = Math.min(rowsFit, Math.ceil(Math.min(children.length, capacity) / cols));
  const contentH = rowsUsed * cellH + (rowsUsed - 1) * gap;
  const originY = paddingY + (usableH - contentH) / 2;

  const placed = Math.min(children.length, capacity);
  for (let r = 0; r < rowsUsed; r++) {
    const baseIdx = r * cols;
    const remaining = placed - baseIdx;
    const nInRow = Math.max(0, Math.min(cols, remaining));
    if (nInRow <= 0) break;

    const rowContentW = nInRow * cellW + (nInRow - 1) * gap;
    const originX = paddingX + (usableW - rowContentW) / 2;
    const yCenter = originY + r * (cellH + gap) + cellH / 2;

    for (let j = 0; j < nInRow; j++) {
      const idx = baseIdx + j;
      const xCenter = originX + j * (cellW + gap) + cellW / 2;
      results[idx] = { x: xCenter, y: yCenter, fit: true, id: children[idx].id };
    }
  }

  if (overflowCount > 0) {
    for (let idx = placed; idx < children.length; idx++) {
      const base = idx % placed;
      const { x, y } = results[base];
      results[idx] = { x, y, fit: false, id: children[idx].id };
    }
  }

  return results;
}

export function useIsMobile(defaultState?: boolean) {
  const isMobile = useMatchMedia('(max-width: 1023px)', defaultState);

  return isMobile;
}
