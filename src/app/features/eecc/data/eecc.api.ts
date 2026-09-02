import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '@core/config/app-config.token';
import { mockDocumentUrl } from '@core/config/dev-mock';
import { EeccFilter } from '../domain/eecc-filter';
import { EeccSearchDto } from './eecc.dto';
import { SearchResult, toSearchResult } from './eecc.mapper';

/** Frontera con el backend. Sin logica de negocio y sin conocer el Router. */
@Injectable({ providedIn: 'root' })
export class EeccApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiBaseUrl}/monitoringEecc/GetMonitoringEeccData`;

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

  /** URL del PDF del EECC. El componente la sanitiza antes de usarla en el iframe. */
  documentUrl(id: string): string {
    if (this.config.devMock) return mockDocumentUrl(id);
    return `${this.base}/${encodeURIComponent(id)}/document`;
  }
}
