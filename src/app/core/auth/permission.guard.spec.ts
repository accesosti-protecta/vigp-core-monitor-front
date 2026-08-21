import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { permissionGuard } from './permission.guard';
import { PERM_EECC_CONSULTA } from './session.model';
import { SessionStore } from './session.store';

describe('permissionGuard', () => {
  let store: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    store = TestBed.inject(SessionStore);
  });

  const run = () =>
    TestBed.runInInjectionContext(
      () => (permissionGuard(PERM_EECC_CONSULTA) as () => boolean | UrlTree)(),
    );

  it('deja pasar con el permiso', () => {
    store.set({
      user: { username: 'u', displayName: 'U', profile: 'OPERACIONES' },
      permissions: [PERM_EECC_CONSULTA],
    });
    expect(run()).toBe(true);
  });

  it('redirige sin el permiso', () => {
    store.set({
      user: { username: 'u', displayName: 'U', profile: 'OTRO' },
      permissions: [],
    });
    expect(run()).toBeInstanceOf(UrlTree);
  });

  it('los permisos vienen del store, no de localStorage', () => {
    localStorage.setItem('currentUser', JSON.stringify({ permissions: [PERM_EECC_CONSULTA] }));
    store.clear();
    expect(store.has(PERM_EECC_CONSULTA)).toBe(false);
    localStorage.clear();
  });
});
