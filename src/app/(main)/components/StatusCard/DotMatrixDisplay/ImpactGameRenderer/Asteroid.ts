import { ImpactCell } from './models';
import { cellsFromData, normalizeCells } from './util';

export default class Asteroid {
  public id!: number;
  public state = {
    col: 1,
    row: 0,
    hp: 1,
    speed: 1,
    progress: 1,
  };

  public width = 1;
  public height = 1;
  public cells: ImpactCell[] = [];

  constructor(
    data: string[],
    id: number,
    baseSpeed: number = 0.4,
    maxPosition?: { col: number; row: number },
  ) {
    const normalized = normalizeCells(cellsFromData(data));

    this.cells = normalized.cells;
    this.width = normalized.width;
    this.height = normalized.height;

    this.id = id;

    this.state.col = Math.max(maxPosition?.col ?? 0, 0) + this.width;

    const maxStartRow = Math.max(0, this.height - (maxPosition?.row ?? 0));
    this.state.row = Math.floor(Math.random() * (maxStartRow + 1));

    this.state.hp = Math.max(1, Math.floor(this.cells.length / 3));
    this.state.speed = baseSpeed + Math.random() * 0.3;
  }

  public updatePosition(colDelta: number, rowDelta: number, maxCols: number, maxRows: number) {
    this.state.col = Math.min(maxCols - this.width, Math.max(0, this.state.col + colDelta));
    this.state.row = Math.min(maxRows - this.height, Math.max(0, this.state.row + rowDelta));
  }
}
