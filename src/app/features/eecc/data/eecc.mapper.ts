import { EnvioStatus } from '../domain/envio-status';
import { EeccId, EeccRow } from '../domain/eecc-row.model';
import { EeccSummary, emptySummary } from '../domain/eecc-summary';
import { Page } from '../domain/page.model';
import { EeccRowDto, EeccSearchDto, EeccSummaryDto } from './eecc.dto';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function monthName(m: number): string {
  return MESES[m - 1] ?? String(m);
}

export function toStatus(raw: string | null | undefined): EnvioStatus {
  switch (raw?.toUpperCase()) {
    case 'GENERATED_SENT':
      return 'GENERADO_ENVIADO';
    case 'GENERATED_NOT_SENT':
      return 'GENERADO_NO_ENVIADO';
    case 'PENDING':
      return 'PENDIENTE';
    default:
      console.warn(`[eecc] estado no mapeado: ${raw}`);
      return 'DESCONOCIDO';
  }
}

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toRow(dto: EeccRowDto): EeccRow {
  return {
    id: dto.id as EeccId,
    policyNumber: dto.policyNumber,
    documentNumber: dto.documentNumber,
    contratante: dto.contratante,
    asegurado: dto.asegurado,
    period: `${monthName(dto.closingMonth)} ${dto.closingYear}`,
    contratanteStatus: toStatus(dto.contratanteStatus),
    // null cuando asegurado === contratante: la columna queda vacia.
    aseguradoStatus: dto.aseguradoStatus ? toStatus(dto.aseguradoStatus) : null,
    generatedAt: parseDate(dto.generatedAt),
  };
}

export function toSummary(dto: EeccSummaryDto): EeccSummary {
  return {
    total: dto.total ?? 0,
    generadoEnviado: dto.generadoEnviado ?? 0,
    generadoNoEnviado: dto.generadoNoEnviado ?? 0,
    pendiente: dto.pendiente ?? 0,
  };
}

export interface SearchResult {
  page: Page<EeccRow>;
  summary: EeccSummary;
}

export function toSearchResult(dto: EeccSearchDto): SearchResult {
  return {
    page: {
      items: (dto.items ?? []).map(toRow),
      page: dto.page,
      pageSize: dto.pageSize,
      total: dto.total ?? 0,
    },
    summary: dto.summary ? toSummary(dto.summary) : emptySummary,
  };
}
