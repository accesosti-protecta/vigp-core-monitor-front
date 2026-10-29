import { ActivatedRoute, convertToParamMap, Params, Router } from '@angular/router';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { BehaviorSubject } from 'rxjs';
import { EeccApi } from '../../data/eecc.api';
import { SearchResult } from '../../data/eecc.mapper';
import { EeccId, EeccRow } from '../../domain/eecc-row.model';
import { EeccStore } from '../../eecc.store';
import { EeccListComponent, exportErrorMessage, exportFileName } from './eecc-list.component';

const row: EeccRow = {
  id: '7107004912-2026-3' as EeccId,
  policyNumber: '7107004912',
  documentNumber: '71418265',
  contratante: 'Bernabe Rios Juan',
  asegurado: 'Bernabe Rios Juan',
  period: 'Marzo 2026',
  closingMonth: 3,
  closingYear: 2026,
  contratanteStatus: 'GENERADO_ENVIADO',
  aseguradoStatus: null,
  generatedAt: new Date('2026-04-01T09:00:00-05:00'),
};

function result(rows: EeccRow[]): SearchResult {
  return {
    page: { items: rows, page: 1, pageSize: 12, total: rows.length },
    summary: { total: rows.length, generadoEnviado: rows.length, generadoNoEnviado: 0, pendiente: 0 },
  };
}

async function setup(params: Params, rows: EeccRow[]) {
  const api = {
    search: jest.fn().mockResolvedValue(result(rows)),
    getPeriods: jest.fn().mockResolvedValue({ years: [2025, 2026], months: [{ value: 3, label: 'Marzo' }] }),
    export: jest.fn().mockResolvedValue(new Blob(['xlsx'])),
    getDocument: jest.fn(),
  };
  await render(EeccListComponent, {
    providers: [
      EeccStore,
      { provide: EeccApi, useValue: api },
      { provide: Router, useValue: { navigate: jest.fn().mockResolvedValue(true) } },
      { provide: ActivatedRoute, useValue: { queryParamMap: new BehaviorSubject(convertToParamMap(params)) } },
    ],
  });
  return api;
}

const descargar = () => screen.getByRole('button', { name: /descargar/i }) as HTMLButtonElement;

describe('EeccListComponent - Descargar', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn().mockReturnValue('blob:eecc');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('con resultados habilita Descargar y busca una sola vez (CA01)', async () => {
    const api = await setup({ closingMonth: '3', closingYear: '2026' }, [row]);

    await waitFor(() => expect(descargar().disabled).toBe(false));
    expect(api.search).toHaveBeenCalledTimes(1);
  });

  it('sin resultados deja Descargar inhabilitado (CA05)', async () => {
    const api = await setup({ closingMonth: '3', closingYear: '2026' }, []);

    await waitFor(() => expect(api.search).toHaveBeenCalled());
    expect(descargar().disabled).toBe(true);
  });

  it('descarga con el filtro de la busqueda, sin paginacion (CA02 / CA03)', async () => {
    const api = await setup({ policyNumber: '7107004912', closingMonth: '3', closingYear: '2026', page: '2' }, [row]);
    await waitFor(() => expect(descargar().disabled).toBe(false));

    fireEvent.click(descargar());

    await waitFor(() => expect(api.export).toHaveBeenCalledTimes(1));
    expect(api.export).toHaveBeenCalledWith(
      expect.objectContaining({ policyNumber: '7107004912', closingMonth: 3, closingYear: 2026 }),
    );
    await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled());
  });

  it('si el backend no encuentra registros muestra el aviso y no descarga', async () => {
    const api = await setup({ closingMonth: '3', closingYear: '2026' }, [row]);
    api.export.mockRejectedValue({ kind: 'notfound', message: 'x' });
    await waitFor(() => expect(descargar().disabled).toBe(false));

    fireEvent.click(descargar());

    expect(await screen.findByText('No hay registros para descargar con los filtros aplicados.')).toBeTruthy();
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });
});

describe('exportFileName', () => {
  it('periodo AAAAMM y poliza solo si se filtro por ella', () => {
    expect(exportFileName({ page: 1, pageSize: 12, closingMonth: 3, closingYear: 2026 }))
      .toBe('Control_Envio_EECC_202603.xlsx');
    expect(exportFileName({ page: 1, pageSize: 12, policyNumber: '7107004912', closingMonth: 12, closingYear: 2025 }))
      .toBe('Control_Envio_EECC_202512_7107004912.xlsx');
  });
});

describe('exportErrorMessage', () => {
  it('traduce los rechazos del backend a mensajes funcionales', () => {
    expect(exportErrorMessage({ kind: 'notfound', message: 'x' })).toMatch(/No hay registros/);
    expect(exportErrorMessage({ kind: 'input', message: 'x' })).toMatch(/supera el maximo/);
    expect(exportErrorMessage({ kind: 'server', message: 'Servicio caido' })).toBe('Servicio caido');
    expect(exportErrorMessage(new Error('boom'))).toBe('No se pudo generar el archivo de descarga.');
  });
});
