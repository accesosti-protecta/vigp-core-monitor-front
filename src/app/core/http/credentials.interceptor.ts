import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Unico contacto del frontend con la sesion: pedirle al navegador que envie
 * la cookie. No la lee, no la escribe, no la almacena.
 *
 * Bajo mismo origen (AD-04) es redundante; se deja porque cuesta una linea y
 * evita una falla silenciosa si alguna vez se separan los origenes.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ withCredentials: true }));
