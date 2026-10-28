import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '@core/config/app-config.token';
import { EeccFilter } from '../domain/eecc-filter';
import { EeccRow } from '../domain/eecc-row.model';
import { AppError } from '@core/errors/app-error';
import { EeccPeriods } from '../domain/eecc-periods';
import { EeccDocumentDto, EeccPeriodsDto, EeccSearchDto } from './eecc.dto';
import { SearchResult, toPeriods, toSearchResult } from './eecc.mapper';

/** Frontera con el backend. Sin logica de negocio y sin conocer el Router. */
@Injectable({ providedIn: 'root' })
export class EeccApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiBaseUrlVigpCore}/monitoringEecc/GetMonitoringEeccData`;
  private readonly documentUrl = `${this.config.apiBaseUrlVigpCore}/monitoringEecc/GetMonitoringEeccDocument`;
  private readonly periodsUrl = `${this.config.apiBaseUrlVigpCore}/monitoringEecc/GetMonitoringEeccPeriods`;

  async search(filter: EeccFilter): Promise<SearchResult> {
    // SOLO DESARROLLO: datos falsos sin backend. Ver dev-mock.ts.
    //if (this.config.devMock) return mockSearch(filter);

    let params = new HttpParams()
      .set('Page', filter.page)
      .set('PageSize', filter.pageSize);
    if (filter.policyNumber) params = params.set('PolicyNumber', filter.policyNumber);
    if (filter.closingMonth) params = params.set('ClosingPeriodMonth', filter.closingMonth);
    if (filter.closingYear) params = params.set('ClosingPeriodYear', filter.closingYear);

    const dto = await firstValueFrom(this.http.get<EeccSearchDto>(this.base, { params }));
    return toSearchResult(dto, filter);

  }

  /** Opciones de los filtros Año y Mes de Cierre (años desde la primera poliza VIGP). */
  async getPeriods(): Promise<EeccPeriods> {
    const dto = await firstValueFrom(this.http.get<EeccPeriodsDto>(this.periodsUrl));
    return toPeriods(dto);
  }

  /**
   * Bytes del PDF del EECC para el visor de solo lectura. Se piden por XHR y no
   * como URL de iframe: asi el documento nunca pasa por el visor nativo del
   * navegador (que ofrece Descargar/Imprimir). El API responde JSON con el PDF
   * en Base64 (mismo formato que document/download-account-statement).
   * Rechaza con AppError 'notfound' cuando el EECC no existe.
   */
  async getDocument(row: EeccRow): Promise<ArrayBuffer> {
    // SOLO DESARROLLO: PDF de ejemplo sin backend. Ver dev-mock.ts.
    //if (this.config.devMock) return mockDocument(row);

    const params = new HttpParams()
      .set('PolicyNumber', row.policyNumber)
      .set('ClosingPeriodYear', row.closingYear)
      .set('ClosingPeriodMonth', row.closingMonth);

    const dto = await firstValueFrom(
      this.http.get<EeccDocumentDto>(this.documentUrl, {
        params,
        headers: { [VIEWER_HEADER]: '1' },
      }),
    );

    const base64 = dto?.document?.base64Content;
    if (!dto?.success || !base64) {
      const notFound: AppError = { kind: 'notfound', message: 'No se encontro el EECC solicitado.' };
      throw notFound;
    }
    return base64ToArrayBuffer(base64);
  }
}

/** El backend solo sirve el documento a peticiones que la incluyen. */
const VIEWER_HEADER = 'X-EECC-Viewer';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
