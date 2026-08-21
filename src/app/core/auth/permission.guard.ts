import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

/**
 * Esto es experiencia de usuario, no seguridad.
 * Cada endpoint de VIGP Core debe revalidar sesion y permiso por su cuenta:
 * un guard evita una pantalla vacia, no impide una llamada con curl.
 */
export const permissionGuard =
  (permission: string): CanActivateFn =>
  () => {
    const store = inject(SessionStore);
    const router = inject(Router);
    return store.has(permission) ? true : router.createUrlTree(['/sin-permiso']);
  };
