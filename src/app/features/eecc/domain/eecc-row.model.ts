import { EnvioStatus, isGenerado } from './envio-status';

export type EeccId = string & { readonly __brand: 'EeccId' };

/**
 * Una fila = una poliza en un periodo de cierre, con dos partes: contratante y
 * asegurado. Cuando son la misma persona, el asegurado no tiene estado propio
 * (aseguradoStatus = null) y la columna Estado Asegurado queda vacia.
 */
export interface EeccRow {
  readonly id: EeccId;
  readonly policyNumber: string;
  readonly documentNumber: string; // DNI del contratante
  readonly contratante: string;
  readonly asegurado: string;
  readonly period: string; // "Marzo 2026"
  readonly closingMonth: number;
  readonly closingYear: number;
  readonly contratanteStatus: EnvioStatus;
  readonly aseguradoStatus: EnvioStatus | null;
  readonly generatedAt: Date | null;
}

/** El EECC es por poliza: hay documento si alguna de las partes lo tiene generado (CA9). */
export function hasDocument(row: EeccRow): boolean {
  return isGenerado(row.contratanteStatus) || isGenerado(row.aseguradoStatus);
}
