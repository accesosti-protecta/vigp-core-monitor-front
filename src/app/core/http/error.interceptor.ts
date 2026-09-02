import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { toAppError } from '../errors/error-mapper';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        // Navegacion a pantalla interna, no redireccion automatica a PD:
        // ver seccion 5.5 del documento de arquitectura (modificacion declarada).
        if (err.status === 401) void router.navigate(['/sesion-expirada']);
        if (err.status === 403) void router.navigate(['/sin-permiso']);
        return throwError(() => toAppError(err, req));
      }
      return throwError(() => err);
    }),
  );
};
