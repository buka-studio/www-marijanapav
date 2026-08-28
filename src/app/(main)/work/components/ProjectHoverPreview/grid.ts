import type { StaticProject } from '../../constants';

export type HoverPreviewRendererProps = {
  projects: StaticProject[];
  centerIndex: number;
  active?: boolean;
};

export const GRID_SIZE = 3;
export const CENTER_ROW = 1;
export const CENTER_COL = 1;

export function cellHeightFromWidth(cellWidth: number) {
  return cellWidth * 0.75;
}

export function gridMetrics(cellWidth: number, gap: number) {
  const cellHeight = cellHeightFromWidth(cellWidth);
  const strideY = cellHeight + gap;

  return {
    cellWidth,
    cellHeight,
    gap,
    strideX: cellWidth + gap,
    strideY,
    stride: strideY,
    gridWidth: cellWidth * GRID_SIZE + gap * (GRID_SIZE - 1),
    gridHeight: cellHeight * GRID_SIZE + gap * (GRID_SIZE - 1),
  };
}

export function visibleIndexRange(from: number, to: number, length: number) {
  return {
    start: Math.max(0, Math.min(Math.round(from), Math.round(to)) - 2),
    end: Math.min(length - 1, Math.max(Math.round(from), Math.round(to)) + 2),
  };
}

export function projectAt(projects: StaticProject[], index: number) {
  if (index < 0 || index >= projects.length) {
    return null;
  }

  return projects[index];
}
