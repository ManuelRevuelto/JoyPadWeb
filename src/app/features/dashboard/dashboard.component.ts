import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { SocketService } from '../../core/services/socket.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly socketService = inject(SocketService);
  readonly router = inject(Router);

  readonly showJoinModal = signal(false);
  readonly targetRoomId = signal('');
  readonly roomStatus = linkedSignal<'none' | 'checking' | 'ready' | 'empty'>(() => {
    this.targetRoomId();
    return 'none';
  });

  async onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.targetRoomId.set(value);

    if (value.length === 3) {
      this.roomStatus.set('checking');
      try {
        const isActive = await this.socketService.checkRoom(
          this.targetRoomId(),
        );
        this.roomStatus.set(isActive ? 'ready' : 'empty');
      } catch (error) {
        this.roomStatus.set('empty');
      }
    }
  }

  joinRoom() {
    if (this.roomStatus() === 'ready') {
      this.router.navigate(['/remote', `SALA-${this.targetRoomId()}`]);
    }
  }
}
