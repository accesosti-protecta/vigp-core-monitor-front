import { inject, Injectable, signal } from '@angular/core';
import { AppConfigLoader } from '../config/app-config.loader';

const STORAGE_KEY_USER = 'vigp_user_name';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly loader = inject(AppConfigLoader);
  private readonly _displayName = signal<string>('');

  readonly displayName = this._displayName.asReadonly();

  init(): void {
    // 1. Verificar si viene en los query params de la redirección
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const nombre = params.get('nombre');
      const apellido = params.get('apellido');

      if (nombre || apellido) {
        const fullName = [nombre, apellido].filter(Boolean).join(' ').trim();
        this.setUser(fullName);
        this.cleanUrlParams(['nombre', 'apellido']);
        return;
      }

      // 2. Si no viene en la URL, revisar sessionStorage (ej. tras recargar F5 o navegar entre rutas)
      const stored = sessionStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        this._displayName.set(stored);
        return;
      }
    }

    // 3. Fallback en desarrollo si devMock está activo
    if (this.loader.get().devMock) {
      this.setUser('Usuario de Desarrollo');
    }
  }

  setUser(name: string): void {
    this._displayName.set(name);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (name) {
        sessionStorage.setItem(STORAGE_KEY_USER, name);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_USER);
      }
    }
  }

  clear(): void {
    this._displayName.set('');
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(STORAGE_KEY_USER);
    }
  }

  private cleanUrlParams(keysToRemove: string[]): void {
    try {
      const url = new URL(window.location.href);
      let changed = false;
      for (const key of keysToRemove) {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          changed = true;
        }
      }
      if (changed) {
        window.history.replaceState({}, document.title, url.pathname + (url.search || '') + url.hash);
      }
    } catch {
      // Ignorar errores en entornos sin soporte de History API
    }
  }
}
