import { ErrorHandler, Injectable } from '@angular/core';
import { newCorrelationId } from '../http/correlation.context';

/**
 * Sin esto, una excepcion no capturada en un template deja pantalla en blanco
 * y sin codigo de referencia: justo cuando Soporte mas lo necesita.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly _lastRef = { value: '' };

  get lastRef(): string {
    return this._lastRef.value;
  }

  handleError(error: unknown): void {
    const ref = newCorrelationId().slice(0, 8);
    this._lastRef.value = ref;
    // TODO(P-10): enviar a la telemetria corporativa cuando este definida.
    console.error(`[eecc:${ref}]`, error);
  }
}
