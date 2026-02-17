import { inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);

  private actionWithIdSubject = new Subject<{
    userId: string;
    action: string;
  }>();

  private readonly URL = isPlatformBrowser(this.platformId)
    ? `http://${window.location.hostname}:4000`
    : 'http://localhost:4000';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        this.socket = io(this.URL);

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
      });
    }
  }

  joinRoom(roomId: string, name?: string) {
    if (this.socket) {
      this.socket.emit('join-room', { roomId, name });
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
