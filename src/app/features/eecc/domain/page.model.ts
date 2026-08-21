export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  /** Requerido: sin total no hay paginador (P-07). */
  readonly total: number;
}
