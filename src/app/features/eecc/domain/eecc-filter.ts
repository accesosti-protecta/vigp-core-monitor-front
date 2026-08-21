export interface EeccFilter {
  readonly page: number;
  readonly pageSize: number;
  readonly policyNumber?: string;
  readonly closingMonth?: number; // 1-12
  readonly closingYear?: number;
}

export const DEFAULT_PAGE_SIZE = 12;

/**
 * Hay busqueda si el usuario fijo al menos un criterio. Sin criterio, la vista
 * muestra "Realice una busqueda para visualizar resultados" y no llama al API.
 */
export function hasSearch(f: EeccFilter): boolean {
  return !!(f.policyNumber || f.closingMonth || f.closingYear);
}
