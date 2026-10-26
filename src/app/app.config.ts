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
        // Si falla la configuracion, la app no puede continuar.
        try {
          await config.load();
        } catch {
          void router.navigateByUrl('/error-arranque');
          return;
        }

        // Inicializa usuario desde redireccion URL / sessionStorage / mock
        session.init();
      })();
    }),
  ],
};
