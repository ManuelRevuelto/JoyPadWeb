import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SocketService } from '../../core/services/socket.service';
import { Player } from '../../shared/interfaces/player';
import { CAR_MODELS } from '../../shared/constants/car-models';

@Component({
  selector: 'app-monitor',
  imports: [DecimalPipe],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss',
})
export class MonitorComponent {
  private socketService = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly players = signal<Map<string, Player>>(new Map());
  readonly playerList = computed(() => Array.from(this.players().values()));
  readonly roomId = signal(
    'SALA-' +
      Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0'),
  );

  protected readonly Math = Math;

  // --- AJUSTES DE VELOCIDAD ---
  private readonly acceleration = 0.05;
  private readonly friction = 0.9;
  private readonly maxSpeed = 1.5;

  private hornAudio =
    typeof Audio !== 'undefined' ? new Audio('assets/sounds/horn.mp3') : null;

  constructor() {
    afterNextRender(() => {
      console.log('1');
      this.initializeMonitor();
    });
  }

  initializeMonitor() {
    console.log('2');
    console.log('Joining room:', this.roomId());
    this.socketService.joinRoom(this.roomId());

    const sub = this.socketService.listenToActions().subscribe((data) => {
      this.handleSocketAction(data);
    });

    let animationId = requestAnimationFrame(() => this.gameLoop());

    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
      cancelAnimationFrame(animationId);
      this.socketService.leaveRoom(this.roomId());
      console.log('Monitor cleanup: Sockets disconnected and loop stopped.');
    });
  }

  handleSocketAction(data: any) {
    const { userId, action, name, carColor, carModel } = data;
    if (userId === this.socketService.getSocketId()) return;

    this.players.update((map) => {
      const newMap = new Map(map);

      if (action === 'JOIN') {
        if (!newMap.has(userId)) {
          newMap.set(
            userId,
            this.spawnPlayer(userId, name, carColor, carModel),
          );
        }
      } else if (action === 'UPDATE_USER') {
        const p = newMap.get(userId);
        if (p) {
          p.name = name ?? p.name;
          p.carColor = carColor ?? p.carColor;
          p.carModel = carModel ?? p.carModel;
        }
      } else if (action === 'DISCONNECT') {
        newMap.delete(userId);
      } else {
        const p = newMap.get(userId);
        if (p) {
          if (action === 'STOP') {
            p.activeKeys = {
              UP: false,
              DOWN: false,
              LEFT: false,
              RIGHT: false,
            };
          } else if (action === 'HORN') {
            this.triggerHorn(p);
          } else {
            p.activeKeys[action as keyof typeof p.activeKeys] = true;
          }
        }
      }
      return newMap;
    });
  }

  gameLoop() {
    this.players.update((map) => {
      const newMap = new Map(map);
      for (const [id, p] of newMap) {
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

        p.posX += p.vX;
        p.posY += p.vY;
        p.posX = Math.max(2, Math.min(93, p.posX));
        p.posY = Math.max(2, Math.min(93, p.posY));
        p.lastTransform = this.calculateRotation(p);
      }
      return newMap;
    });
    requestAnimationFrame(() => this.gameLoop());
  }

  spawnPlayer(id: string, name?: string, carColor?: string, carModel?: string) {
    return {
      id,
      posX: 50,
      posY: 50,
      vX: 0,
      vY: 0,
      activeKeys: { UP: false, DOWN: false, LEFT: false, RIGHT: false },
      facingRight: true,
      lastTransform: 'rotate(0deg) scaleX(1)',
      carColor: carColor || 'red',
      name: name || 'Guest',
      carModel: carModel || 'sedan',
      isHonking: false,
    };
  }

  triggerHorn(p: Player) {
    p.isHonking = true;
    setTimeout(() => (p.isHonking = false), 300);
    if (this.hornAudio) {
      this.hornAudio.currentTime = 0;
      this.hornAudio.play().catch(() => {});
    }
  }

  getCarIcon(modelId: string): string {
    const model = Object.values(CAR_MODELS).find((m) => m.id === modelId);
    return model ? model.icon : CAR_MODELS.SEDAN.icon;
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

    const scale = p.isHonking ? 1.2 : 1;
    return `rotate(${rotate}deg) scaleX(${scaleX}) scale(${scale})`;
  }
}
