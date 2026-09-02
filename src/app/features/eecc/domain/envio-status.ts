/**
 * Tres estados del envio del EECC, segun la leyenda de la vista de control.
 * DESCONOCIDO es defensivo: un estado nuevo del backend no debe romper la tabla.
 */
export type EnvioStatus =
  | 'GENERADO_ENVIADO'
  | 'GENERADO_NO_ENVIADO'
  | 'PENDIENTE'
  | 'DESCONOCIDO';

export const ENVIO_STATUS_LABEL: Readonly<Record<EnvioStatus, string>> = {
  GENERADO_ENVIADO: 'Generado Enviado',
  GENERADO_NO_ENVIADO: 'Generado No Enviado',
  PENDIENTE: 'Pendiente',
  DESCONOCIDO: 'Estado no reconocido',
};
