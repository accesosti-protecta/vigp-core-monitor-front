import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { PaginatorComponent } from '@shared/ui/paginator/paginator.component';
import { SkeletonComponent } from '@shared/ui/skeleton/skeleton.component';
import { EeccApi } from '../../data/eecc.api';
import { fallbackPeriods } from '../../data/eecc.mapper';
import { DEFAULT_PAGE_SIZE, EeccFilter } from '../../domain/eecc-filter';
import { EeccPeriods, emptyPeriods } from '../../domain/eecc-periods';
import { ENVIO_STATUS_LABEL, EnvioStatus } from '../../domain/envio-status';
import { EeccId, EeccRow, hasDocument } from '../../domain/eecc-row.model';
import { isAppError } from '@core/errors/app-error';
import { EeccStore } from '../../eecc.store';
import { EeccPdfViewerComponent } from '../eecc-pdf-viewer/eecc-pdf-viewer.component';

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

  protected readonly hasDocument = hasDocument;

  // Opciones de Año y Mes de Cierre: vienen del API (años desde la primera poliza VIGP).
  private readonly periods = signal<EeccPeriods>(emptyPeriods);
  protected readonly meses = computed(() => this.periods().months);
  protected readonly anios = computed(() => this.periods().years);

  // Estado del formulario de filtros (controles nativos, sin @angular/forms).
  protected readonly fPoliza = signal('');
  protected readonly fMes = signal<number | null>(null);
  protected readonly fAnio = signal<number | null>(null);
  protected readonly fAnioError = signal(false);
  protected readonly fMesError = signal(false);
  protected readonly fStateDownload = signal(false);

  // PDF abierto en el visor; null = modal cerrado.
  protected readonly viewerDoc = signal<ArrayBuffer | null>(null);
  // Fila cuyo documento se esta consultando (deshabilita su lupa).
  protected readonly loadingDocId = signal<EeccId | null>(null);
  // Mensaje informativo cuando el EECC no esta disponible (CA07).
  protected readonly docNotice = signal<string | null>(null);

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly filter = computed(() => parseFilter(this.queryParams()));

  constructor() {
    // Los filtros arrancan con la busqueda de la URL (recarga, volver atras, enlace compartido).
    const initial = this.filter();
    this.fPoliza.set(initial.policyNumber ?? '');
    this.fMes.set(initial.closingMonth ?? null);
    this.fAnio.set(initial.closingYear ?? null);
    void this.loadPeriods();

    // Guarda firstname y lastname de la URL en sessionStorage y luego los elimina de la URL.
    effect(() => {
      const params = this.queryParams();
      const firstname = params.get('firstname');
      const lastname = params.get('lastname');

      if (firstname) sessionStorage.setItem('firstname', firstname);
      if (lastname) sessionStorage.setItem('lastname', lastname);

      // Si llegaron en la URL, los quitamos sin dejar rastro en el historial.
      if (firstname || lastname) {
        const clean: Record<string, string | null> = {};
        params.keys.forEach((k) => {
          if (k !== 'firstname' && k !== 'lastname') {
            clean[k] = params.get(k);
          }
        });
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: clean,
          replaceUrl: true,
        });
      }
    });

    // La URL manda: la busqueda dispara la carga. Ver documento de arquitectura 6.2.
    effect(() => {
      void this.store.load(this.filter());
      this.fStateDownload.set(this.store.total() > 0);
    });
  }

  /** Si el API falla se usa el año actual y los 12 meses, para no bloquear la busqueda. */
  private async loadPeriods(): Promise<void> {
    try {
      this.periods.set(await this.api.getPeriods());
    } catch {
      this.periods.set(fallbackPeriods(new Date().getFullYear()));
      this.docNotice.set('No se pudieron cargar los periodos disponibles; se muestra solo el año actual.');
    }
  }

  protected buscar(): void {
    this.validAnioMes();
    if (this.fMesError() || this.fAnioError()) return;
    this.docNotice.set(null);
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

  /** Solo abre el modal con el documento ya obtenido: nunca un visor vacio (CA07). */
  protected async abrirVisor(row: EeccRow): Promise<void> {
    if (this.loadingDocId()) return;
    this.docNotice.set(null);
    this.loadingDocId.set(row.id);
    try {
      this.viewerDoc.set(await this.api.getDocument(row));
    } catch (e: unknown) {
      this.docNotice.set(
        isAppError(e) && e.kind !== 'notfound'
          ? e.message
          : `El EECC de la poliza ${row.policyNumber} (${row.period}) no se encuentra disponible para su visualizacion.`,
      );
    } finally {
      this.loadingDocId.set(null);
    }
  }

  /** Cierra el modal; la grilla y la busqueda (en la URL) se mantienen (CA06). */
  protected cerrarVisor(): void {
    this.viewerDoc.set(null);
  }

  protected cerrarAviso(): void {
    this.docNotice.set(null);
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

  protected validAnioMes(): void {

    const mesInvalid = this.fMes() === null;
    const anioInvalid = this.fAnio() === null;

    this.fMesError.set(mesInvalid);
    this.fAnioError.set(anioInvalid);

  }

  protected onMesChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.fMes.set(Number(value) || null);
    this.fMesError.set(false);
  }

  protected onAnioChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.fAnio.set(Number(value) || null);
    this.fAnioError.set(false);
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


// Prueba de accesos