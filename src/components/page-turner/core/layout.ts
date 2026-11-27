/**
 * How pages map onto leaves. Two columns: a leaf carries two pages, and the first page stands alone on the right
 * like a cover. One column: every page is the front of its own leaf, backs blank.
 * `page` counts from 1, as people see pages; `index` counts from 0, as elements are indexed.
 */

type Columns = 1 | 2;

function leafCount(pages: number, columns: Columns): number {
  return columns === 2 ? Math.ceil(pages / 2) : pages;
}

/** Most leaves that may be turned, so the last page never turns away to nothing. */
function turnLimit(pages: number, columns: Columns): number {
  return columns === 2 ? Math.floor(pages / 2) : Math.max(0, pages - 1);
}

/** How many leaves lie on the left when `page` is in view. */
function turnedFor(page: number, columns: Columns): number {
  return columns === 2 ? Math.ceil((page - 1) / 2) : page - 1;
}

/** The first page in view when `turned` leaves lie on the left. */
function pageFor(turned: number, columns: Columns): number {
  if (columns === 1) return turned + 1;
  return turned === 0 ? 1 : turned * 2;
}

/** The page indexes on a leaf's two sides; -1 for a blank side. */
function facesOf(leaf: number, columns: Columns, pages: number): { front: number; back: number } {
  if (columns === 1) return { front: leaf, back: -1 };
  const back = leaf * 2 + 1;
  return { front: leaf * 2, back: back < pages ? back : -1 };
}

/** Which side the page at `index` rests on while `page` is in view, if it shows at all. */
function sideOf(index: number, page: number, columns: Columns): 'left' | 'right' | undefined {
  const turned = turnedFor(page, columns);
  if (columns === 1) return index === turned ? 'right' : undefined;
  if (index === turned * 2) return 'right';
  if (index === turned * 2 - 1) return 'left';
  return undefined;
}

export { facesOf, leafCount, pageFor, sideOf, turnedFor, turnLimit };
export type { Columns };
