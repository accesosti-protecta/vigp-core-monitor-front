import { Routes } from '@angular/router';

export const routes: Routes = [
  // Las rutas de rechazo van ANTES de la ruta vacia: un path '' sin
  // pathMatch 'full' coincide por prefijo y las capturaria.
  {
    path: 'sin-permiso',
    loadComponent: () =>
      import('@core/pages/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: 'sesion-expirada',
    loadComponent: () => import('@core/pages/expired.component').then((m) => m.ExpiredComponent),
  },
  {
    path: 'error-arranque',
    loadComponent: () =>
      import('@core/pages/boot-failure.component').then((m) => m.BootFailureComponent),
  },
  {
    path: '',
    loadChildren: () => import('@features/eecc/eecc.routes').then((m) => m.EECC_ROUTES),
  },
  { path: '**', redirectTo: 'sin-permiso' },
];
