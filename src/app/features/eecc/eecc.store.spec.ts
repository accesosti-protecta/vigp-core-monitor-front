import { TestBed } from '@angular/core/testing';
import { EeccApi } from './data/eecc.api';
import { SearchResult } from './data/eecc.mapper';
import { EeccFilter } from './domain/eecc-filter';
import { EeccRow } from './domain/eecc-row.model';
import { EeccStore } from './eecc.store';

function result(rows: EeccRow[]): SearchResult {
  return {
    page: { items: rows, page: 1, pageSize: 12, total: rows.length },
    summary: { total: rows.length, generadoEnviado: 0, generadoNoEnviado: 0, pendiente: 0 },
  };
}

const row = { id: 'e1', policyNumber: '7107', contratanteStatus: 'PENDIENTE' } as EeccRow;
const withSearch: EeccFilter = { page: 1, pageSize: 12, closingMonth: 3, closingYear: 2026 };

describe('EeccStore', () => {
  let api: { search: jest.Mock };
  let store: EeccStore;

  beforeEach(() => {
    api = { search: jest.fn() };
    TestBed.configureTestingModule({ providers: [EeccStore, { provide: EeccApi, useValue: api }] });
    store = TestBed.inject(EeccStore);
  });

  it('sin criterio no llama al API y queda en estado inicial', async () => {
    await store.load({ page: 1, pageSize: 12 });
    expect(api.search).not.toHaveBeenCalled();
    expect(store.isIdle()).toBe(true);
  });

  it('distingue vacio de inicial y de error', async () => {
    api.search.mockResolvedValue(result([]));
    await store.load(withSearch);
    expect(store.isEmpty()).toBe(true);
    expect(store.isIdle()).toBe(false);
  });

  it('una respuesta que llega tarde no pisa a una posterior', async () => {
    let resolveSlow!: (v: SearchResult) => void;
    api.search
      .mockImplementationOnce(() => new Promise<SearchResult>((r) => (resolveSlow = r)))
      .mockResolvedValueOnce(result([row]));

    const slow = store.load({ ...withSearch, page: 1 });
    const fast = store.load({ ...withSearch, page: 2 });
    await fast;
    resolveSlow(result([]));
    await slow;

    expect(store.rows()).toHaveLength(1);
  });

  it('un fallo deja el store en error', async () => {
    api.search.mockRejectedValue({ kind: 'server', message: 'Servicio no disponible.' });
    await store.load(withSearch);
    expect(store.isError()).toBe(true);
    expect(store.error()?.message).toBe('Servicio no disponible.');
  });
});
