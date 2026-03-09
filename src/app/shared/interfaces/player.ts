export interface Player {
  id: string;
  posX: number;
  posY: number;
  vX: number;
  vY: number;
  activeKeys: { [key: string]: boolean };
  facingRight: boolean;
  lastTransform: string;
  carColor: string;
  name: string;
  carModel: string;
  isHonking: boolean;
}
