import {
  afterNextRender,
  inject,
  Injectable,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { UserConfig } from '../../shared/interfaces/userConfig';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket?: Socket;

  private readonly systemEventSubject = new Subject<string>();
  private readonly gameActionSubject = new Subject<any>();

  constructor() {
    afterNextRender(() => {
      this.initSocket();
    });
  }

  initSocket() {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname.startsWith('192.168.');
    const URL = isLocal
      ? `http://${window.location.hostname}:4000`
      : window.location.origin;

    this.socket = io(URL, {
      transports: ['websocket'],
      secure: !isLocal,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('pc-receive', (data) => {
      this.gameActionSubject.next(data);
    });

    this.socket.on('player-joined', (data) => {
      this.gameActionSubject.next({ ...data, action: 'JOIN' });
    });

    this.socket.on('user-updated', (data) => {
      this.gameActionSubject.next({ ...data, action: 'UPDATE_USER' });
    });

    this.socket.on('player-left', (id: string) => {
      this.gameActionSubject.next({ userId: id, action: 'DISCONNECT' });
    });

    this.socket.on('monitor-left', () => {
      this.systemEventSubject.next('MONITOR_DISCONNECTED');
    });

    this.socket.on('connect_error', () => {
      console.error('❌ Error de conexión al servidor de sockets');
    });
  }

  checkRoom(roomId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve(false);

      this.socket.emit(
        'check-room',
        { roomId },
        (response: { active: boolean }) => {
          resolve(response.active);
        },
      );
    });
  }

  joinRoom(
    roomId: string,
    config?: Partial<UserConfig> & { role?: 'remote' | 'monitor' },
  ) {
    if (!this.socket || this.socket.disconnected) {
      this.initSocket();
    }

    const payload = {
      roomId,
      name: config?.name || `Monitor ${roomId}`,
      carColor: config?.carColor || '',
      carModel: config?.carModel || '',
      role: config?.role || 'monitor',
    };

    if (this.socket?.connected) {
      this.socket.emit('join-room', payload);
    } else {
      this.socket?.once('connect', () => {
        this.socket?.emit('join-room', payload);
      });
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave-room', { roomId });
      this.socket.disconnect();
      console.log(`🚪 Abandonando sala: ${roomId}`);
    }
  }

  sendAction(roomId: string, action: string, data?: any) {
    if (this.socket) {
      this.socket.emit('controller-input', { roomId, action, data });
    }
  }

  listenToActions(): Observable<any> {
    return this.gameActionSubject.asObservable();
  }

  onSystemEvent(): Observable<string> {
    return this.systemEventSubject.asObservable();
  }

  getSocketId(): string {
    return this.socket?.id || '';
  }
}
