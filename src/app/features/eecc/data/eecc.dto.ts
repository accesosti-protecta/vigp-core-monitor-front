/** Forma que devuelve VIGP Core. Contratos por confirmar (P-01). */
export interface EeccRowDto {
  policyNumber: string | number;
  contractorDocNumber: string;
  contractorFullName: string;
  insuredFullName: string;
  closingPeriodMonth: number;
  closingPeriodYear: number;
  contractorEeccStatus: number;
  insuredEeccStatus: number | null;
  generationDate: string | null;
}

export interface EeccSummaryDto {
  totalRecords: number;
  totalGenerated: number;
  totalGeneratedNotSent: number;
  totalPending: number;
}

/** Respuesta de GetMonitoringEeccDocument (formato de document/download-account-statement). */
export interface EeccDocumentDto {
  success: boolean;
  message?: string;
  policyNumber: number;
  period: { year: number; month: number };
  document: {
    contentType: string;
    fileSize: number;
    base64Content: string;
  } | null;
}

/** Respuesta de GetMonitoringEeccPeriods: opciones de los filtros de periodo. */
export interface EeccPeriodsDto {
  years: number[];
  months: { value: number; label: string }[];
}

export interface EeccSearchDto extends EeccSummaryDto {
  data: EeccRowDto[];
  // page: number;
  // pageSize: number;
  // total: number;
  // summary: EeccSummaryDto;
}
