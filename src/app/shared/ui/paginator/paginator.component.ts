import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Numero de pagina o el separador "..." entre bloques. */
export type PageItem = number | 'gap';

/** Paginas consecutivas visibles alrededor de la actual. */
const WINDOW = 5;

/**
 * Botones numericos del paginador: un bloque de hasta 5 paginas alrededor de
 * la actual, mas la primera y la ultima con "..." cuando quedan lejos.
 * Ej. pagina 1 de 22: 1 2 3 4 5 ... 22 | pagina 10: 1 ... 8 9 10 11 12 ... 22.
 */
export function pageItems(page: number, last: number): PageItem[] {
  if (last <= WINDOW + 2) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const start = Math.min(Math.max(page - Math.floor(WINDOW / 2), 1), last - WINDOW + 1);
  const end = start + WINDOW - 1;
  const items: PageItem[] = [];
  if (start > 1) items.push(1);
  // "..." solo si oculta 2 o mas paginas; si oculta una, se muestra el numero.
  if (start === 3) items.push(2);
  else if (start > 3) items.push('gap');
  for (let p = start; p <= end; p++) items.push(p);
  if (end === last - 2) items.push(last - 1);
  else if (end < last - 2) items.push('gap');
  if (end < last) items.push(last);
  return items;
}

@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pag" role="navigation" aria-label="Paginacion de resultados">
      <button type="button" class="pag__item pag__nav" [disabled]="page() <= 1" (click)="go(page() - 1)">
        Anterior
      </button>
      @for (item of items(); track $index) {
        @if (item === 'gap') {
          <span class="pag__item pag__gap" aria-hidden="true">...</span>
        } @else {
          <button type="button" class="pag__item pag__num" [class.pag__num--active]="item === page()"
                  [attr.aria-current]="item === page() ? 'page' : null" [attr.aria-label]="'Pagina ' + item"
                  (click)="go(item)">
            {{ item }}
          </button>
        }
      }
      <button type="button" class="pag__item pag__nav" [disabled]="page() >= lastPage()" (click)="go(page() + 1)">
        Siguiente
      </button>
    </nav>
  `,
  styles: [
    `
      :host { display: block; padding: 0.75rem 0; }
      .pag {
        display: inline-flex;
        align-items: stretch;
        border: 1px solid #d6d0e8;
        border-radius: 4px;
        overflow: hidden;
        background: #ebe7f7;
      }
      .pag__item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2.25rem;
        height: 2.5rem;
        padding: 0 0.625rem;
        border: 0;
        border-left: 1px solid #d6d0e8;
        background: transparent;
        color: #3c3a4f;
        font: inherit;
        font-size: 1rem;
      }
      .pag__item:first-child { border-left: 0; }
      button.pag__item { cursor: pointer; }
      button.pag__item:hover:not(:disabled):not(.pag__num--active) { background: #ddd6f5; }
      .pag__item:focus-visible { outline: 2px solid #6f3fdb; outline-offset: -2px; }
      .pag__nav { padding: 0 0.875rem; text-transform: uppercase; letter-spacing: 0.01em; }
      .pag__nav:disabled { cursor: default; background: #d9d0f6; color: #8c7fb5; }
      .pag__gap { background: #d9d0f6; color: #8c7fb5; }
      .pag__num--active { background: #6f3fdb; color: #fff; cursor: default; }
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

  protected readonly items = computed(() => pageItems(this.page(), this.lastPage()));

  protected go(p: number): void {
    if (p >= 1 && p <= this.lastPage() && p !== this.page()) this.pageChange.emit(p);
  }
}
