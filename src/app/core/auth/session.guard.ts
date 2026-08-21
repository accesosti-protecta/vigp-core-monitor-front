import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

export const sessionGuard: CanActivateFn = () => {
  const store = inject(SessionStore);
  const router = inject(Router);
  return store.isAuthenticated() ? true : router.createUrlTree(['/sesion-expirada']);
};
