export type AppErrorKind =
  | 'network'
  | 'input'
  | 'expired'
  | 'forbidden'
  | 'notfound'
  | 'server';

export interface AppError {
  readonly kind: AppErrorKind;
  /** Mensaje funcional. Nunca detalle tecnico (propuesta funcional, seccion 9). */
  readonly message: string;
  /** Codigo que el usuario le dicta a Soporte. */
  readonly correlationId?: string;
}

export function isAppError(e: unknown): e is AppError {
  return typeof e === 'object' && e !== null && 'kind' in e && 'message' in e;
}
