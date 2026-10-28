/** Opcion del filtro "Mes de Cierre". */
export interface Mes {
  readonly value: number;
  readonly label: string;
}

/** Opciones de los filtros de periodo: años desde la primera poliza VIGP y los 12 meses. */
export interface EeccPeriods {
  readonly years: readonly number[];
  readonly months: readonly Mes[];
}

export const emptyPeriods: EeccPeriods = { years: [], months: [] };
