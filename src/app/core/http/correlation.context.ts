import { HttpContextToken } from '@angular/common/http';

/** Id de correlacion del request en curso, disponible aunque no haya respuesta. */
export const CORRELATION_ID = new HttpContextToken<string>(() => '');

export function newCorrelationId(): string {
  // randomUUID exige contexto seguro (HTTPS), que ya es requisito.
  return globalThis.crypto.randomUUID();
}
