import { computed, inject, Injectable, signal } from '@angular/core';
import { AppError, isAppError } from '@core/errors/app-error';
import { EeccApi } from './data/eecc.api';
import { EeccFilter, hasSearch } from './domain/eecc-filter';
import { EeccRow } from './domain/eecc-row.model';
import { EeccSummary, emptySummary } from './domain/eecc-summary';
import { Page } from './domain/page.model';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

@Injectable()
export class EeccStore {
  private readonly api = inject(EeccApi);

  private readonly _page = signal<Page<EeccRow> | null>(null);
  private readonly _summary = signal<EeccSummary>(emptySummary);
  private readonly _status = signal<LoadStatus>('idle');
  private readonly _error = signal<AppError | null>(null);

  /** Descarta respuestas superadas (ver documento de arquitectura, seccion 6.1). */
  private seq = 0;

  readonly summary = this._summary.asReadonly();
  readonly error = this._error.asReadonly();
  readonly rows = computed(() => this._page()?.items ?? []);
  readonly total = computed(() => this._page()?.total ?? 0);
  readonly isLoading = computed(() => this._status() === 'loading');
  readonly isError = computed(() => this._status() === 'error');
  /** idle = todavia no se busco: la vista muestra el mensaje inicial. */
  readonly isIdle = computed(() => this._status() === 'idle');
  readonly isEmpty = computed(
    () => this._status() === 'loaded' && this.rows().length === 0,
  );

  async load(filter: EeccFilter): Promise<void> {
    // Sin criterio de busqueda no se llama al API: estado inicial.
    if (!hasSearch(filter)) {
      this.seq++;
      this._page.set(null);
      this._summary.set(emptySummary);
      this._status.set('idle');
      this._error.set(null);
      return;
    }

    const current = ++this.seq;
    this._status.set('loading');
    this._error.set(null);
    try {
      const res = await this.api.search(filter);
      if (current !== this.seq) return;
      this._page.set(res.page);
      this._summary.set(res.summary);
      this._status.set('loaded');
    } catch (e: unknown) {
      if (current !== this.seq) return;
      this._error.set(
        isAppError(e) ? e : { kind: 'server', message: 'Ocurrio un error al procesar la consulta.' },
      );
      this._status.set('error');
    }
  }
}
