type Columns = 1 | 2;

function leafCount(pages: number, columns: Columns): number {
  return columns === 2 ? Math.ceil(pages / 2) : pages;
}

function turnLimit(pages: number, columns: Columns): number {
  return columns === 2 ? Math.floor(pages / 2) : Math.max(0, pages - 1);
}

function turnedFor(page: number, columns: Columns): number {
  return columns === 2 ? Math.ceil((page - 1) / 2) : page - 1;
}

function pageFor(turned: number, columns: Columns): number {
  if (columns === 1) return turned + 1;
  return turned === 0 ? 1 : turned * 2;
}

function facesOf(leaf: number, columns: Columns, pages: number): { front: number; back: number } {
  if (columns === 1) return { front: leaf, back: -1 };
  const back = leaf * 2 + 1;
  return { front: leaf * 2, back: back < pages ? back : -1 };
}

function sideOf(index: number, page: number, columns: Columns): 'left' | 'right' | undefined {
  const turned = turnedFor(page, columns);
  if (columns === 1) return index === turned ? 'right' : undefined;
  if (index === turned * 2) return 'right';
  if (index === turned * 2 - 1) return 'left';
  return undefined;
}

export { facesOf, leafCount, pageFor, sideOf, turnedFor, turnLimit };
export type { Columns };
