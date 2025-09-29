import { clamp } from '~/src/math';

import { ImpactCell } from './models';
import { cellsFromData, normalizeCells } from './util';

export default class Player {
  public state = {
    col: 1,
    row: 0,
  };

  public nose = { dx: 0, dy: 0 } as ImpactCell;
  public bulletOffset = { dx: 0, dy: 0 } as ImpactCell;

  public width = 1;
  public height = 1;

  public cells = [] as ImpactCell[];

  constructor(data: string[]) {
    const normalized = normalizeCells(cellsFromData(data));

    this.cells = normalized.cells;
    this.width = normalized.width;
    this.height = normalized.height;

    this.nose = this.getNose();

    this.bulletOffset = { dx: this.nose.dx + 1, dy: this.nose.dy };
  }

  private getNose() {
    const center = Math.floor(this.height / 2);
    return this.cells.reduce((best, cell) => {
      if (!best) {
        return cell;
      }
      if (cell.dx > best.dx) {
        return cell;
      }
      if (cell.dx === best.dx) {
        const bestDist = Math.abs(best.dy - center);
        const cellDist = Math.abs(cell.dy - center);
        if (cellDist < bestDist) {
          return cell;
        }
      }
      return best;
    }, this.cells[0]);
  }

  public updatePosition(colDelta: number, rowDelta: number, maxCols: number, maxRows: number) {
    this.state.col = clamp(0, maxCols, this.state.col + colDelta);

    this.state.row = clamp(
      -Math.floor(this.height / 2),
      maxRows - Math.ceil(this.height / 2),
      this.state.row + rowDelta,
    );

    this.nose = this.getNose();
    this.bulletOffset = { dx: this.nose.dx + 1, dy: this.nose.dy };
  }
}
