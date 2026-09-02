import { EnvioStatus } from './envio-status';

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
  readonly contratanteStatus: EnvioStatus;
  readonly aseguradoStatus: EnvioStatus | null;
  readonly generatedAt: Date | null;
}
