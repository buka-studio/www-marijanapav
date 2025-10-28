type NodeResult = { x: number; y: number; fit: boolean };

export function computeGridArrangement(opts: {
  container: HTMLElement;
  children: Array<{ width: number; height: number }>;
  padding: number;
  gap: number;
}): NodeResult[] {
  const { container, children, padding, gap } = opts;

  const usableW = Math.max(0, container.clientWidth - 2 * padding);
  const usableH = Math.max(0, container.clientHeight - 2 * padding);

  const results: NodeResult[] = children.map(() => ({ x: 0, y: 0, fit: false }));
  if (usableW <= 0 || usableH <= 0 || children.length === 0) {
    return results;
  }

  type Row = { indices: number[]; rowWidth: number; rowHeight: number };
  const rows: Row[] = [];
  let cur: Row = { indices: [], rowWidth: 0, rowHeight: 0 };

  children.forEach((child, i) => {
    const { width, height } = child;
    const nextW = cur.indices.length === 0 ? width : cur.rowWidth + gap + width;
    if (nextW <= usableW) {
      cur.indices.push(i);
      cur.rowWidth = nextW;
      cur.rowHeight = Math.max(cur.rowHeight, height);
    } else {
      if (cur.indices.length > 0) {
        rows.push(cur);
      }
      cur = { indices: [i], rowWidth: width, rowHeight: height };
    }
  });
  if (cur.indices.length > 0) {
    rows.push(cur);
  }

  const rowHeights = rows.map((r) => r.rowHeight);
  let usedRows = 0;
  let accHeight = 0;
  for (let r = 0; r < rows.length; r++) {
    const extraGap = r === 0 ? 0 : gap;
    if (accHeight + extraGap + rowHeights[r] <= usableH) {
      accHeight += extraGap + rowHeights[r];
      usedRows++;
    } else {
      break;
    }
  }

  const contentH = accHeight;
  const originY = padding + (usableH - contentH) / 2;

  let yCursor = originY;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const fitsVertically = r < usedRows;

    const rowContentW = row.rowWidth;
    let xCursor = padding + (usableW - rowContentW) / 2;

    row.indices.forEach((idx, j) => {
      const { width, height } = children[idx];
      const xCenter = xCursor + width / 2;
      const yCenter = yCursor + row.rowHeight / 2;

      results[idx] = {
        x: fitsVertically ? xCenter : 0,
        y: fitsVertically ? yCenter : 0,
        fit: fitsVertically,
      };

      xCursor += width + (j < row.indices.length - 1 ? gap : 0);
    });

    if (r < usedRows) {
      yCursor += row.rowHeight + (r < usedRows - 1 ? gap : 0);
    }
  }

  return results;
}

const preloadedImages = new Map<string, HTMLImageElement>();

export function preloadImage(url: string) {
  if (preloadedImages.has(url)) {
    return;
  }

  const img = new Image();
  img.src = url;
  preloadedImages.set(url, img);
}
