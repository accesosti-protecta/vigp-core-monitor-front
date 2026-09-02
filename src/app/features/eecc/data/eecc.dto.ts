/** Forma que devuelve VIGP Core. Contratos por confirmar (P-01). */
export interface EeccRowDto {
  id: string;
  policyNumber: string;
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

export interface EeccSearchDto extends EeccSummaryDto {
  data: EeccRowDto[];
  // page: number;
  // pageSize: number;
  // total: number;
  // summary: EeccSummaryDto;
}
