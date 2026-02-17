import { Routes } from '@angular/router';
import { MonitorComponent } from './features/monitor/monitor.component';
import { RemoteComponent } from './features/remote/remote.component';

export const routes: Routes = [
  { path: 'monitor', component: MonitorComponent },
  { path: 'remote/:id', component: RemoteComponent },
  { path: '', redirectTo: '/monitor', pathMatch: 'full' },
  { path: '**', redirectTo: '/monitor' }
];
