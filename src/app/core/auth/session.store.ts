import { computed, Injectable, signal } from '@angular/core';
import { Session } from './session.model';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _session = signal<Session | null>(null);
  private readonly _resolved = signal(false);

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly isResolved = this._resolved.asReadonly();
  readonly displayName = computed(() => this._session()?.user.displayName ?? '');

  set(session: Session): void {
    this._session.set(session);
    this._resolved.set(true);
  }

  clear(): void {
    this._session.set(null);
    this._resolved.set(true);
  }

  /** Los permisos vienen del servidor, nunca de localStorage (ver hallazgo 1.2). */
  has(permission: string): boolean {
    return this._session()?.permissions.includes(permission) ?? false;
  }
}
