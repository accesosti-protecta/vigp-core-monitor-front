import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { SessionService } from '@core/auth/session.service';
import { AppConfigLoader } from '@core/config/app-config.loader';
import { isAppError } from '@core/errors/app-error';
import { GlobalErrorHandler } from '@core/errors/global-error.handler';
import { correlationIdInterceptor } from '@core/http/correlation-id.interceptor';
import { credentialsInterceptor } from '@core/http/credentials.interceptor';
import { errorInterceptor } from '@core/http/error.interceptor';
import { routes } from './app.routes';

registerLocaleData(localeEsPe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([credentialsInterceptor, correlationIdInterceptor, errorInterceptor]),
    ),
    { provide: LOCALE_ID, useValue: 'es-PE' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    provideAppInitializer(() => {
      // inject() se resuelve ANTES de cualquier await: el contexto de
      // inyeccion es sincrono y se pierde al suspender la funcion.
      const config = inject(AppConfigLoader);
      const session = inject(SessionService);
      const router = inject(Router);

      return (async () => {
        // La config va en su propio try: si falla, las pantallas de sesion
        // expirada y sin permiso tampoco pueden renderizar (inyectan APP_CONFIG).
        try {
          await config.load();
        } catch {
          void router.navigateByUrl('/error-arranque');
          return;
        }

        try {
          await session.bootstrap();
        } catch (e: unknown) {
          // Sin este catch la app no arranca y el usuario ve pantalla en
          // blanco. El caso mas probable de todos es un marcador viejo.
          // El interceptor ya convirtio el error: aca llega un AppError,
          // no un HttpErrorResponse.
          session.markAnonymous();
          const expired = isAppError(e) && e.kind === 'expired';
          void router.navigateByUrl(expired ? '/sesion-expirada' : '/error-arranque');
        }
      })();
    }),
  ],
};
