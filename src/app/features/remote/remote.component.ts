import {
  Component,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../../core/services/socket.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-remote',
  standalone: true,
  imports: [],
  templateUrl: './remote.component.html',
  styleUrl: './remote.component.scss',
})
export class RemoteComponent implements OnInit {
  roomId: string = '';
  playerName: string = '';
  moveInterval: any;

  activeButtons: { [key: string]: boolean } = {
    UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false,
    HORN: false,
  };

  private platformId = inject(PLATFORM_ID);
  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.roomId = this.route.snapshot.params['id'];

      const savedName = localStorage.getItem('playerName');
      const name = prompt('Introduce tu nombre de piloto:', savedName || '');
      this.playerName = name || 'Piloto-' + Math.floor(Math.random() * 100);
      localStorage.setItem('playerName', this.playerName);

      this.socketService.joinRoom(this.roomId, this.playerName);
      console.log('✅ Remote conectado a sala:', this.roomId);
    }
  }

  startMove(action: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    this.stopMove();
    this.activeButtons[action] = true;

    this.socketService.sendAction(this.roomId, action);
    this.moveInterval = setInterval(() => {
      this.socketService.sendAction(this.roomId, action);
    }, 100);
  }

  stopMove() {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }

    this.activeButtons = {
      UP: false,
      DOWN: false,
      LEFT: false,
      RIGHT: false,
      HORN: false,
    };
    this.socketService.sendAction(this.roomId, 'STOP');
  }

  honk() {
    this.socketService.sendAction(this.roomId, 'HORN');
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toUpperCase();
    if (key === 'ENTER') {
      event.preventDefault();
      this.startMove('HORN');
      return;
    }

    let action = '';
    if (key === 'ARROWUP') action = 'UP';
    if (key === 'ARROWDOWN') action = 'DOWN';
    if (key === 'ARROWLEFT') action = 'LEFT';
    if (key === 'ARROWRIGHT') action = 'RIGHT';

    if (action && !this.activeButtons[action]) {
      this.startMove(action);
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    const key = event.key.toUpperCase();
    if (
      ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'ENTER'].includes(key)
    ) {
      this.stopMove();
    }
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  // @HostListener('window:blur')
  onGlobalRelease() {
    this.stopMove();
  }
}
