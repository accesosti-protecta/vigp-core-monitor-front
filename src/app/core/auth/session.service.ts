import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigLoader } from '../config/app-config.loader';
import { MOCK_SESSION } from '../config/dev-mock';
import { Session, SessionDto } from './session.model';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(SessionStore);
  /**
   * Se inyecta el loader, no APP_CONFIG: el token resuelve leyendo la config
   * al construir el servicio, y en el arranque este servicio se instancia
   * antes de que la config exista. Se consulta al usarla, no al construirse.
   */
  private readonly loader = inject(AppConfigLoader);

  async bootstrap(): Promise<void> {
    // SOLO DESARROLLO: sin backend, siembra una sesion falsa. Ver dev-mock.ts.
    if (this.loader.get().devMock) {
      this.store.set(MOCK_SESSION);
      return;
    }

    const base = this.loader.get().apiBaseUrl;
    const dto = await firstValueFrom(this.http.get<SessionDto>(`${base}/session`));
    this.store.set(toSession(dto));
  }

  markAnonymous(): void {
    this.store.clear();
  }
}

export function toSession(dto: SessionDto): Session {
  return {
    user: { username: dto.username, displayName: dto.displayName, profile: dto.profile },
    permissions: Object.freeze([...(dto.permissions ?? [])]),
  };
}
