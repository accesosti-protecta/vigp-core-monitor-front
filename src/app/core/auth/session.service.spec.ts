import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { AppConfigLoader } from '../config/app-config.loader';

describe('SessionService', () => {
  let service: SessionService;
  let mockLoader: { get: jest.Mock };

  beforeEach(() => {
    sessionStorage.clear();
    mockLoader = {
      get: jest.fn().mockReturnValue({ devMock: false }),
    };

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: AppConfigLoader, useValue: mockLoader },
      ],
    });

    service = TestBed.inject(SessionService);
  });

  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('debe inicializarse con nombre vacio', () => {
    expect(service.displayName()).toBe('');
  });

  it('debe capturar nombre y apellido desde la URL y guardarlo en sessionStorage', () => {
    window.history.replaceState({}, '', '/?nombre=Juan&apellido=Perez');

    service.init();

    expect(service.displayName()).toBe('Juan Perez');
    expect(sessionStorage.getItem('vigp_user_name')).toBe('Juan Perez');
    // Verifica que los parametros se limpien de la URL
    expect(window.location.search).not.toContain('nombre=Juan');
  });

  it('debe recuperar el usuario desde sessionStorage si no viene en la URL', () => {
    sessionStorage.setItem('vigp_user_name', 'Maria Garcia');
    window.history.replaceState({}, '', '/');

    service.init();

    expect(service.displayName()).toBe('Maria Garcia');
  });

  it('debe usar fallback si devMock esta activo y no hay datos en URL ni sessionStorage', () => {
    mockLoader.get.mockReturnValue({ devMock: true });
    window.history.replaceState({}, '', '/');

    service.init();

    expect(service.displayName()).toBe('Usuario de Desarrollo');
    expect(sessionStorage.getItem('vigp_user_name')).toBe('Usuario de Desarrollo');
  });

  it('debe limpiar los datos con clear()', () => {
    service.setUser('Carlos Lopez');
    expect(service.displayName()).toBe('Carlos Lopez');
    expect(sessionStorage.getItem('vigp_user_name')).toBe('Carlos Lopez');

    service.clear();

    expect(service.displayName()).toBe('');
    expect(sessionStorage.getItem('vigp_user_name')).toBeNull();
  });
});
