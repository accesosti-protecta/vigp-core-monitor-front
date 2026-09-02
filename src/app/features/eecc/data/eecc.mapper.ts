import { EnvioStatus } from '../domain/envio-status';
import { EeccId, EeccRow } from '../domain/eecc-row.model';
import { EeccSummary, emptySummary } from '../domain/eecc-summary';
import { Page } from '../domain/page.model';
import { EeccRowDto, EeccSearchDto, EeccSummaryDto } from './eecc.dto';
import { EeccFilter } from '../domain/eecc-filter';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function monthName(m: number): string {
  return MESES[m - 1] ?? String(m);
}

export function toStatus(raw: number | null | undefined): EnvioStatus {
  switch (raw) {
    case 3:
      return 'GENERADO_ENVIADO';
    case 2:
      return 'GENERADO_NO_ENVIADO';
    case 1:
      return 'PENDIENTE';
    default:
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
    documentNumber: dto.contractorDocNumber,
    contratante: dto.contractorFullName,
    asegurado: dto.insuredFullName,
    period: `${monthName(dto.closingPeriodMonth)} ${dto.closingPeriodYear}`,
    contratanteStatus: toStatus(dto.contractorEeccStatus),
    // null cuando asegurado === contratante: la columna queda vacia.
    aseguradoStatus: dto.insuredEeccStatus === 0 ? null : toStatus(dto.insuredEeccStatus),
    generatedAt: parseDate(dto.generationDate),
  };
}

export function toSummary(dto: EeccSummaryDto): EeccSummary {
  return {
    total: dto.totalRecords ?? 0,
    generadoEnviado: dto.totalGenerated ?? 0,
    generadoNoEnviado: dto.totalGeneratedNotSent ?? 0,
    pendiente: dto.totalPending ?? 0,
  };
}

export interface SearchResult {
  page: Page<EeccRow>;
  summary: EeccSummary;
}

export function toSearchResult(dto: EeccSearchDto, filter: EeccFilter): SearchResult {
  return {
    page: {
      items: (dto.data ?? []).map(toRow),
      page: filter.page,
      pageSize: filter.pageSize,
      total: dto.totalRecords ?? 0,
    },
    // summary: dto.summary ? toSummary(dto.summary) : emptySummary,
    summary: dto.totalRecords > 0 ? toSummary({
      totalRecords: dto.totalRecords,
      totalGenerated: dto.totalGenerated,
      totalGeneratedNotSent: dto.totalGeneratedNotSent,
      totalPending: dto.totalPending,
    }) : emptySummary,
  };
}
