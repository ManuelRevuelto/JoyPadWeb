export interface Player {
  id: string;
  posX: number;
  posY: number;
  vX: number;
  vY: number;
  activeKeys: { [key: string]: boolean };
  facingRight: boolean;
  lastTransform: string;
  color: string;
  name: string;
}
