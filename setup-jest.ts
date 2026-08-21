import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// jsdom no implementa crypto.randomUUID.
// Se define solo esa propiedad: hacer spread de globalThis.crypto perderia
// getRandomValues y subtle, que viven en el prototipo.
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis.crypto ?? globalThis, 'randomUUID', {
    value: () => '00000000-0000-4000-8000-000000000000',
    configurable: true,
    writable: true,
  });
}
