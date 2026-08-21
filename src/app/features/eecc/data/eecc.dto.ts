/** Forma que devuelve VIGP Core. Contratos por confirmar (P-01). */
export interface EeccRowDto {
  id: string;
  policyNumber: string;
  documentNumber: string;
  contratante: string;
  asegurado: string;
  closingMonth: number;
  closingYear: number;
  contratanteStatus: string;
  aseguradoStatus: string | null;
  generatedAt: string | null;
}

export interface EeccSummaryDto {
  total: number;
  generadoEnviado: number;
  generadoNoEnviado: number;
  pendiente: number;
}

export interface EeccSearchDto {
  items: EeccRowDto[];
  page: number;
  pageSize: number;
  total: number;
  summary: EeccSummaryDto;
}
