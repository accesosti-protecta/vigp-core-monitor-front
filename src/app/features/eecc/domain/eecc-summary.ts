/** Contadores del encabezado de la vista de control. */
export interface EeccSummary {
  readonly total: number;
  readonly generadoEnviado: number;
  readonly generadoNoEnviado: number;
  readonly pendiente: number;
}

export const emptySummary: EeccSummary = {
  total: 0,
  generadoEnviado: 0,
  generadoNoEnviado: 0,
  pendiente: 0,
};
