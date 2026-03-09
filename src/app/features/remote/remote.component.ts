import {
  afterNextRender,
  Component,
  DestroyRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../../core/services/socket.service';
import { UserConfig } from '../../shared/interfaces/userConfig';

@Component({
  selector: 'app-remote',
  imports: [],
  templateUrl: './remote.component.html',
  styleUrl: './remote.component.scss',
})
export class RemoteComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly socketService = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isConfigOpen = signal(false);
  readonly roomId = signal(this.route.snapshot.params['id']);

  readonly userConfig = signal<UserConfig>({
    name: 'Piloto',
    carColor: '#ff0000',
    carModel: 'sedan',
  });

  readonly activeButtons = signal<Record<string, boolean>>({
    UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false,
    HORN: false,
  });

  constructor() {
    afterNextRender(() => {
      this.loadSavedConfig();
      this.connectToRoom();
    });
  }

  loadSavedConfig() {
    const savedName = localStorage.getItem('playerName');
    const savedColor = localStorage.getItem('carColor');
    const savedModel = localStorage.getItem('carModel');

    if (savedName || savedColor || savedModel) {
      this.userConfig.set({
        name: savedName || 'Piloto',
        carColor: savedColor || '#ff0000',
        carModel: (savedModel as any) || 'sedan',
      });
    }
  }

  connectToRoom() {
    const config = this.userConfig();
    this.socketService.joinRoom(
      this.roomId(),
      { ...config, role: 'remote' }
    );
    console.log('✅ Remote conectado a sala:', this.roomId());

    const sub = this.socketService.onSystemEvent().subscribe((event) => {
      if (event === 'MONITOR_DISCONNECTED') {
        console.warn('📺 Monitor has left. Disconecting...');
        this.router.navigate(['/']);
      }
    });

    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
      this.socketService.leaveRoom(this.roomId());
    });
  }

  startMove(action: string) {
    if (this.activeButtons()[action]) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    this.activeButtons.update((btns) => ({ ...btns, [action]: true }));
    this.socketService.sendAction(this.roomId(), action);
  }

  stopMove(action?: string) {
    this.activeButtons.update((btns) => {
      {
        if (action) {
          if (!btns[action]) return btns;
          return { ...btns, [action]: false };
        }
        return {
          UP: false,
          DOWN: false,
          LEFT: false,
          RIGHT: false,
          HORN: false,
        };
      }
    });
    this.socketService.sendAction(this.roomId(), 'STOP');
  }

  returnHome() {
    this.router.navigate(['/']);
  }

  toggleConfig() {
    this.isConfigOpen.update((v) => !v);
  }

  updateConfig(key: keyof UserConfig, value: string) {
    this.userConfig.update((prev) => {
      const nuevo = { ...prev, [key]: value };

      localStorage.setItem('playerName', nuevo.name);
      localStorage.setItem('carColor', nuevo.carColor);
      localStorage.setItem('carModel', nuevo.carModel);

      this.socketService.sendAction(this.roomId(), 'UPDATE_USER', nuevo);

      return nuevo;
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const action = this.mapKeyEvent(event.key);
    if (action) {
      event.preventDefault();
      this.startMove(action);
      return;
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    const action = this.mapKeyEvent(event.key);
    if (action) this.stopMove(action);
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  onGlobalRelease() {
    this.stopMove();
  }

  private mapKeyEvent(key: string): string | null {
    const k = key.toUpperCase();
    if (k === 'ARROWUP' || k === 'W') return 'UP';
    if (k === 'ARROWDOWN' || k === 'S') return 'DOWN';
    if (k === 'ARROWLEFT' || k === 'A') return 'LEFT';
    if (k === 'ARROWRIGHT' || k === 'D') return 'RIGHT';
    if (k === 'ENTER' || k === ' ') return 'HORN';
    return null;
  }
}
