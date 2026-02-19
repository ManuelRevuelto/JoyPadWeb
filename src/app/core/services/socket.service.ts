import {
  inject,
  Injectable,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket!: Socket;
  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  private isBrowser = isPlatformBrowser(this.platformId);

  private actionWithIdSubject = new Subject<{
    userId: string;
    action: string;
  }>();

  private isLocal =
    this.isBrowser &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.') ||
      window.location.hostname.endsWith('.local'));

  private readonly URL = this.isLocal
    ? `http://${window.location.hostname}:4000`
    : this.isBrowser
      ? window.location.origin
      : '';

  constructor() {
    if (this.isBrowser) {
      this.zone.runOutsideAngular(() => {
        this.socket = io(this.URL, {
          transports: ['websocket', 'polling'],
          secure: !this.isLocal,
          reconnectionAttempts: 5,
        });

        this.socket.on('pc-receive', (data) => {
          console.log('📨 Socket recibió del servidor:', data);
          this.zone.run(() => {
            this.actionWithIdSubject.next(data);
          });
        });

        this.socket.on('player-left', (id: string) => {
          this.zone.run(() => {
            this.actionWithIdSubject.next({ userId: id, action: 'DISCONNECT' });
          });
        });

        this.socket.on('connect_error', (err) => {
          console.error('❌ Error de conexión Socket:', err.message);
        });
      });
    }
  }

  joinRoom(roomId: string, name?: string) {
    if (this.socket) {
      this.socket.emit('join-room', { roomId, name });
    }
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  sendAction(roomId: string, action: string) {
    if (this.socket) {
      this.socket.emit('controller-input', { roomId, action });
    }
  }

  listenToActionsWithId(): Observable<{
    userId: string;
    action: string;
    name?: string;
  }> {
    return this.actionWithIdSubject.asObservable();
  }

  getSocketId(): string {
    return this.socket?.id || '';
  }
}
