import { Routes } from '@angular/router';
import { EeccStore } from './eecc.store';

export const EECC_ROUTES: Routes = [
  {
    path: '',
    providers: [EeccStore],
    title: 'Control de Envio de EECC',
    loadComponent: () =>
      import('./ui/eecc-list/eecc-list.component').then((m) => m.EeccListComponent),
  },
];
