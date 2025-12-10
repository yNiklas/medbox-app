import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'connect-new-stack',
    loadComponent: () => import('./connect-new-stack/connect-new-stack.page').then( m => m.ConnectNewStackPage)
  },
  {
    path: 'inspect-stack/:id',
    loadComponent: () => import('./inspect-stack/inspect-stack.page').then( m => m.InspectStackPage)
  }
];
