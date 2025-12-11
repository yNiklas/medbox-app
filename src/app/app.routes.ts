import { Routes } from '@angular/router';
import {canActivateAuth} from "./guards/auth-guard";

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [canActivateAuth]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'connect-new-stack',
    loadComponent: () => import('./connect-new-stack/connect-new-stack.page').then( m => m.ConnectNewStackPage),
    canActivate: [canActivateAuth]
  },
  {
    path: 'inspect-stack/:id',
    loadComponent: () => import('./inspect-stack/inspect-stack.page').then( m => m.InspectStackPage),
    canActivate: [canActivateAuth]
  }
];
