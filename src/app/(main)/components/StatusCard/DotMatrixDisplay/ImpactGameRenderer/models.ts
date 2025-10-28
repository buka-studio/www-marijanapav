export type CellShape = 'circle' | 'square';

export type ControlState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export enum PlayerAction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  Shoot = 'shoot',
}

export type ImpactCell = {
  dx: number;
  dy: number;
};
