import { HttpContext, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { CORRELATION_ID } from '../http/correlation.context';
import { toAppError } from './error-mapper';

function reqWith(id: string): HttpRequest<unknown> {
  return new HttpRequest('GET', '/api/eecc', {
    context: new HttpContext().set(CORRELATION_ID, id),
  });
}

describe('toAppError', () => {
  it('conserva el correlationId aunque no haya respuesta', () => {
    // status 0 = red caida: no hay cabeceras de donde leerlo.
    const err = toAppError(new HttpErrorResponse({ status: 0 }), reqWith('abc-123'));
    expect(err.kind).toBe('network');
    expect(err.correlationId).toBe('abc-123');
  });

  it('502 no cae en el mensaje generico', () => {
    const err = toAppError(new HttpErrorResponse({ status: 502 }), reqWith('x'));
    expect(err.message).toContain('no esta disponible');
  });

  it('no filtra detalle tecnico al usuario', () => {
    const err = toAppError(
      new HttpErrorResponse({ status: 500, error: 'ORA-00942: table or view does not exist' }),
      reqWith('x'),
    );
    expect(err.message).not.toContain('ORA-');
    expect(err.message).toBe('Ocurrio un error al procesar la consulta.');
  });
});
