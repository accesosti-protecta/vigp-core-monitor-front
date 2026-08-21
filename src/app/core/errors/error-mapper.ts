import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { CORRELATION_ID } from '../http/correlation.context';
import { AppError } from './app-error';

/**
 * Traduce un fallo HTTP a un mensaje que el usuario pueda leer.
 * El correlationId sale del contexto del request, no de las cabeceras de la
 * respuesta: cuando la red se cae no hay respuesta de donde leerlo.
 */
export function toAppError(e: HttpErrorResponse, req: HttpRequest<unknown>): AppError {
  const correlationId = req.context.get(CORRELATION_ID) || undefined;

  switch (e.status) {
    case 0:
      return {
        kind: 'network',
        message: 'No se pudo conectar. Verifique su conexion a la red corporativa.',
        correlationId,
      };
    case 400:
      return { kind: 'input', message: 'Los criterios de busqueda no son validos.', correlationId };
    // 'expired' como kind propio: el interceptor lo convierte a AppError, asi
    // que quien lo reciba ya no puede distinguirlo por el status HTTP.
    case 401:
      return { kind: 'expired', message: 'Su sesion expiro.', correlationId };
    case 403:
      return { kind: 'forbidden', message: 'No tiene permisos para ver esta informacion.', correlationId };
    case 404:
      return { kind: 'notfound', message: 'No se encontro el EECC solicitado.', correlationId };
    // 502 va aparte del default: lo devuelve el reverse proxy cuando VIGP Core
    // no responde, y el mensaje generico sugeriria culpa del usuario.
    case 502:
    case 503:
    case 504:
      return { kind: 'server', message: 'El servicio no esta disponible en este momento.', correlationId };
    default:
      return { kind: 'server', message: 'Ocurrio un error al procesar la consulta.', correlationId };
  }
}
