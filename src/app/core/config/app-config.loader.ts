import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppConfig } from './app-config.model';

@Injectable({ providedIn: 'root' })
export class AppConfigLoader {
  /**
   * HttpBackend, no HttpClient: la configuracion se carga antes de que exista
   * sesion, y no tiene sentido pasarla por los interceptores de credenciales
   * y correlacion.
   */
  private readonly http = new HttpClient(inject(HttpBackend));
  // APP_BASE_HREF no lo provee Angular por defecto: siempre devolveria '/'.
  // baseURI resuelve el <base href> real del index.html.
  private readonly baseUri = inject(DOCUMENT).baseURI;
  private config?: AppConfig;

  /** Lanza si el archivo no existe o es invalido: app.config.ts navega a /error-arranque. */
  async load(): Promise<void> {
    const url = new URL('assets/config/app-config.json', this.baseUri).toString();
    const raw = await firstValueFrom(this.http.get<unknown>(url));
    this.config = parseAppConfig(raw, environment.production);
  }

  get(): AppConfig {
    if (!this.config) {
      throw new Error('AppConfig no inicializado: falta provideAppInitializer.');
    }
    return this.config;
  }
}

/**
 * Valida app-config.json y devuelve una configuracion normalizada.
 * Falla temprano y con mensaje claro ante un despliegue con el archivo mal
 * reemplazado, en vez de errores confusos en la primera llamada al API.
 */
export function parseAppConfig(raw: unknown, production: boolean): AppConfig {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('app-config.json: el contenido no es un objeto JSON.');
  }
  const c = raw as Record<string, unknown>;

  const apiBaseUrlVigpCore = requiredString(c, 'apiBaseUrlVigpCore');
  if (!apiBaseUrlVigpCore.startsWith('/') && !isHttpUrl(apiBaseUrlVigpCore)) {
    throw new Error('app-config.json: "apiBaseUrlVigpCore" debe ser relativa ("/api") o una URL http(s).');
  }

  const platformReturnUrl = requiredString(c, 'platformReturnUrl');
  if (!isHttpUrl(platformReturnUrl)) {
    throw new Error('app-config.json: "platformReturnUrl" debe ser una URL http(s).');
  }

  const pageSizeDefault = c['pageSizeDefault'];
  if (typeof pageSizeDefault !== 'number' || !Number.isInteger(pageSizeDefault) || pageSizeDefault < 1) {
    throw new Error('app-config.json: "pageSizeDefault" debe ser un entero mayor a 0.');
  }

  const flags = c['featureFlags'] ?? {};
  if (typeof flags !== 'object' || flags === null || Array.isArray(flags)) {
    throw new Error('app-config.json: "featureFlags" debe ser un objeto.');
  }

  return {
    // Sin "/" final: las rutas se arman como `${apiBaseUrlVigpCore}/recurso`.
    apiBaseUrlVigpCore: apiBaseUrlVigpCore.replace(/\/+$/, ''),
    platformReturnUrl,
    pageSizeDefault,
    featureFlags: Object.freeze({ ...(flags as Record<string, boolean>) }),
    // El build de produccion neutraliza devMock aunque el JSON lo traiga:
    // el bypass no puede existir fuera de desarrollo.
    devMock: production ? false : c['devMock'] === true,
  };
}

function requiredString(c: Record<string, unknown>, key: string): string {
  const v = c[key];
  if (typeof v !== 'string' || v.trim() === '') {
    throw new Error(`app-config.json: falta "${key}" o esta vacio.`);
  }
  return v.trim();
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
