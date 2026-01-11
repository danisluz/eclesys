import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'system-status',
    pathMatch: 'full'
  },
  {
    path: 'system-status',
    loadComponent: () =>
      import('./system-status/system-status.component').then(
        (component) => component.SystemStatusComponent
      )
  },
  {
    path: '**',
    redirectTo: 'system-status'
  }
];
