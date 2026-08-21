import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { PaginatorComponent } from '@shared/ui/paginator/paginator.component';
import { SkeletonComponent } from '@shared/ui/skeleton/skeleton.component';
import { EeccApi } from '../../data/eecc.api';
import { DEFAULT_PAGE_SIZE, EeccFilter } from '../../domain/eecc-filter';
import { ENVIO_STATUS_LABEL, EnvioStatus } from '../../domain/envio-status';
import { EeccRow } from '../../domain/eecc-row.model';
import { EeccStore } from '../../eecc.store';
import { EeccPdfViewerComponent } from '../eecc-pdf-viewer/eecc-pdf-viewer.component';

interface Mes {
  readonly value: number;
  readonly label: string;
}

const MESES: readonly Mes[] = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

const ANIOS: readonly number[] = [2024, 2025, 2026];

@Component({
  selector: 'app-eecc-list',
  standalone: true,
  imports: [
    DatePipe,
    EmptyStateComponent,
    PaginatorComponent,
    SkeletonComponent,
    EeccPdfViewerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eecc-list.component.html',
  styleUrl: './eecc-list.component.scss',
})
export class EeccListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(EeccApi);
  protected readonly store = inject(EeccStore);

  protected readonly meses = MESES;
  protected readonly anios = ANIOS;

  // Estado del formulario de filtros (controles nativos, sin @angular/forms).
  protected readonly fPoliza = signal('');
  protected readonly fMes = signal<number | null>(null);
  protected readonly fAnio = signal<number | null>(null);

  // URL del documento en el visor; null = modal cerrado.
  protected readonly viewerUrl = signal<string | null>(null);

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly filter = computed(() => parseFilter(this.queryParams()));

  constructor() {
    // La URL manda: la busqueda dispara la carga. Ver documento de arquitectura 6.2.
    effect(() => {
      void this.store.load(this.filter());
    });
  }

  protected buscar(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        policyNumber: this.fPoliza().trim() || null,
        closingMonth: this.fMes(),
        closingYear: this.fAnio(),
      },
    });
  }

  protected onPageChange(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  protected abrirVisor(row: EeccRow): void {
    this.viewerUrl.set(this.api.documentUrl(row.id));
  }

  protected cerrarVisor(): void {
    this.viewerUrl.set(null);
  }

  protected labelOf(s: EnvioStatus): string {
    return ENVIO_STATUS_LABEL[s];
  }

  /** Clase del circulo de estado: verde / amarillo / rojo / gris. */
  protected dotOf(s: EnvioStatus): string {
    switch (s) {
      case 'GENERADO_ENVIADO':
        return 'dot--ok';
      case 'GENERADO_NO_ENVIADO':
        return 'dot--warn';
      case 'PENDIENTE':
        return 'dot--danger';
      default:
        return 'dot--muted';
    }
  }
}

export function parseFilter(pm: ParamMap): EeccFilter {
  const page = Number(pm.get('page') ?? 1);
  const pageSize = Number(pm.get('pageSize') ?? DEFAULT_PAGE_SIZE);
  const policyNumber = pm.get('policyNumber') ?? undefined;
  const month = Number(pm.get('closingMonth'));
  const year = Number(pm.get('closingYear'));

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE,
    ...(policyNumber ? { policyNumber } : {}),
    ...(month >= 1 && month <= 12 ? { closingMonth: month } : {}),
    ...(year > 0 ? { closingYear: year } : {}),
  };
}
