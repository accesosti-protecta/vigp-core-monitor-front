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

  async load(): Promise<void> {
    const url = new URL('assets/config/app-config.json', this.baseUri).toString();
    const raw = await firstValueFrom(this.http.get<AppConfig>(url));
    // El build de produccion neutraliza devMock aunque el JSON lo traiga:
    // el bypass no puede existir fuera de desarrollo.
    this.config = environment.production ? { ...raw, devMock: false } : raw;
  }

  get(): AppConfig {
    if (!this.config) {
      throw new Error('AppConfig no inicializado: falta provideAppInitializer.');
    }
    return this.config;
  }
}
