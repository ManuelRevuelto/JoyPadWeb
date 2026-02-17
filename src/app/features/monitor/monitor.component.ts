import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { SocketService } from '../../core/services/socket.service';
import {
  DecimalPipe,
  isPlatformBrowser,
  JsonPipe,
  KeyValuePipe,
} from '@angular/common';
import { Player } from '../../shared/interfaces/player';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [DecimalPipe, KeyValuePipe],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss',
})
export class MonitorComponent implements OnInit {
  players: { [id: string]: Player } = {};
  activeKeys: { [key: string]: boolean } = {
    UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false,
  };

  protected readonly Math = Math;
  roomId = '';

  // --- AJUSTES DE VELOCIDAD ---
  posX = 50;
  posY = 50;
  vX = 0;
  vY = 0;
  lastTransform = 'rotate(0deg) scaleX(1)';

  maxSpeed = 1.5;
  acceleration = 0.05;
  friction = 0.9;

  debugVel = 0;
  facingRight = true;

  private platformId = inject(PLATFORM_ID);

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // this.roomId = 'SALA-TEST';
      this.roomId = 'SALA-' + Math.floor(Math.random() * 1000);
      this.socketService.joinRoom(this.roomId);

      this.socketService.listenToActionsWithId().subscribe((data) => {
        const { userId, action, name } = data;

        if (userId === this.socketService.getSocketId()) return;

        if (action === 'DISCONNECT') {
          delete this.players[userId];
          console.log(`Coche eliminado: ${userId}`);
          return;
        }

        if (action === 'JOIN') {
          this.spawnPlayer(userId, name);
          return;
        }

        const p = this.players[userId];

        // Actualizamos las teclas del jugador específico
        if (action === 'STOP') {
          p.activeKeys = { UP: false, DOWN: false, LEFT: false, RIGHT: false };
        } else {
          p.activeKeys[action] = true;
        }
      });

      this.gameLoop();
    }
  }

  spawnPlayer(id: string, name?: string) {
    this.players[id] = {
      id,
      posX: 50,
      posY: 50,
      vX: 0,
      vY: 0,
      activeKeys: { UP: false, DOWN: false, LEFT: false, RIGHT: false },
      facingRight: true,
      lastTransform: 'rotate(0deg) scaleX(1)',
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      name: name || 'Player',
    };
  }

  gameLoop() {
    for (let id in this.players) {
      const p = this.players[id];

      // Aplicar física individual
      if (p.activeKeys['UP']) p.vY -= this.acceleration;
      if (p.activeKeys['DOWN']) p.vY += this.acceleration;
      if (p.activeKeys['LEFT']) p.vX -= this.acceleration;
      if (p.activeKeys['RIGHT']) p.vX += this.acceleration;

      p.vX *= this.friction;
      p.vY *= this.friction;

      const currentVel = Math.sqrt(p.vX * p.vX + p.vY * p.vY);
      if (currentVel > this.maxSpeed) {
        const ratio = this.maxSpeed / currentVel;
        p.vX *= ratio;
        p.vY *= ratio;
      }

      // Actualizar posición
      p.posX += p.vX;
      p.posY += p.vY;

      // Límites de pantalla para cada coche
      p.posX = Math.max(2, Math.min(93, p.posX));
      p.posY = Math.max(2, Math.min(93, p.posY));

      // Actualizar rotación
      p.lastTransform = this.calculateRotation(p);
    }
    requestAnimationFrame(() => this.gameLoop());
  }

  calculateRotation(p: Player): string {
    let rotate = 0;
    let scaleX = -1;
    if (Math.abs(p.vY) > Math.abs(p.vX)) {
      rotate = -90;
      if (p.vY > 0.1) scaleX = 1;
    } else {
      rotate = 0;
      if (p.vX < -0.1) scaleX = 1;
    }
    return `rotate(${rotate}deg) scaleX(${scaleX})`;
  }
}
