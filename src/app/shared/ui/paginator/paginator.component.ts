import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pag" role="navigation" aria-label="Paginacion de resultados">
      <button type="button" [disabled]="page() <= 1" (click)="go(page() - 1)">Anterior</button>
      <span class="pag__info">
        Pagina {{ page() }} de {{ lastPage() }} · {{ total() }} registros
      </span>
      <button type="button" [disabled]="page() >= lastPage()" (click)="go(page() + 1)">
        Siguiente
      </button>
    </nav>
  `,
  styles: [
    `
      .pag { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; }
      .pag__info { font-size: 0.875rem; color: #5f6368; }
      button { padding: 0.375rem 0.875rem; cursor: pointer; }
      button:disabled { cursor: not-allowed; opacity: 0.5; }
    `,
  ],
})
export class PaginatorComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();

  /** Requiere `total` del backend. Sin el, esto no se puede calcular (P-07). */
  protected readonly lastPage = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected go(p: number): void {
    if (p >= 1 && p <= this.lastPage()) this.pageChange.emit(p);
  }
}
