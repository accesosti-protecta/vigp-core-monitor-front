import { inject, Injectable, signal } from '@angular/core';
import { AppConfigLoader } from '../config/app-config.loader';

const STORAGE_KEY_USER = 'vigp_user_name';
const STORAGE_KEY_CLIENT_FIRSTNAME = 'firstname';
const STORAGE_KEY_CLIENT_LASTNAME = 'lastname';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly loader = inject(AppConfigLoader);
  private readonly _displayName = signal<string>('');
  private readonly _clientFirstname = signal<string>('');
  private readonly _clientLastname = signal<string>('');

  readonly displayName = this._displayName.asReadonly();
  readonly clientFirstname = this._clientFirstname.asReadonly();
  readonly clientLastname = this._clientLastname.asReadonly();

  init(): void {
    // 1. Verificar si viene en los query params de la redirección
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const nombre = params.get('nombre');
      const apellido = params.get('apellido');
      const firstname = params.get('firstname');
      const lastname = params.get('lastname');

      if (firstname || lastname) {
        this.setClientName(firstname ?? '', lastname ?? '');
      } else {
        this._clientFirstname.set(sessionStorage.getItem(STORAGE_KEY_CLIENT_FIRSTNAME) ?? '');
        this._clientLastname.set(sessionStorage.getItem(STORAGE_KEY_CLIENT_LASTNAME) ?? '');
      }

      if (nombre || apellido) {
        const fullName = [nombre, apellido].filter(Boolean).join(' ').trim();
        this.setUser(fullName);
        this.cleanUrlParams(['nombre', 'apellido', 'firstname', 'lastname']);
        return;
      }

      if (firstname || lastname) {
        this.cleanUrlParams(['firstname', 'lastname']);
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

  setClientName(firstname: string, lastname: string): void {
    this._clientFirstname.set(firstname);
    this._clientLastname.set(lastname);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (firstname) sessionStorage.setItem(STORAGE_KEY_CLIENT_FIRSTNAME, firstname);
      else sessionStorage.removeItem(STORAGE_KEY_CLIENT_FIRSTNAME);
      if (lastname) sessionStorage.setItem(STORAGE_KEY_CLIENT_LASTNAME, lastname);
      else sessionStorage.removeItem(STORAGE_KEY_CLIENT_LASTNAME);
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
