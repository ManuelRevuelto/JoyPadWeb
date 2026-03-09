import { Routes } from '@angular/router';
import { MonitorComponent } from './features/monitor/monitor.component';
import { RemoteComponent } from './features/remote/remote.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'monitor', component: MonitorComponent },
  { path: 'remote/:id', component: RemoteComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
