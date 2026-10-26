import { toRow, toSearchResult, toStatus, monthName } from './eecc.mapper';
import { EeccRowDto } from './eecc.dto';
import { EeccFilter } from '../domain/eecc-filter';

const dto: EeccRowDto = {
  id: 'e-1',
  policyNumber: '7107004912',
  contractorDocNumber: '71418265',
  contractorFullName: 'Bernabe Rios Juan',
  insuredFullName: 'Bernabe Rios Juan',
  closingPeriodMonth: 3,
  closingPeriodYear: 2026,
  contractorEeccStatus: 3,
  insuredEeccStatus: 0,
  generationDate: '2026-04-01T09:00:00-05:00',
};

describe('eecc.mapper', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('mapea los tres estados conocidos', () => {
    expect(toStatus(3)).toBe('GENERADO_ENVIADO');
    expect(toStatus(2)).toBe('GENERADO_NO_ENVIADO');
    expect(toStatus(1)).toBe('PENDIENTE');
  });

  it('un estado nuevo cae en DESCONOCIDO, no rompe la tabla', () => {
    expect(toStatus(99)).toBe('DESCONOCIDO');
    expect(toStatus(null)).toBe('DESCONOCIDO');
  });

  it('sin estado de asegurado (0), la columna queda vacia (null)', () => {
    expect(toRow(dto).aseguradoStatus).toBeNull();
  });

  it('con asegurado distinto, mapea su estado', () => {
    const r = toRow({ ...dto, insuredFullName: 'Otro', insuredEeccStatus: 1 });
    expect(r.aseguradoStatus).toBe('PENDIENTE');
  });

  it('arma el periodo legible desde mes y ano', () => {
    expect(toRow(dto).period).toBe('Marzo 2026');
    expect(monthName(12)).toBe('Diciembre');
  });

  it('normaliza total y summary ausentes', () => {
    const filter: EeccFilter = { page: 1, pageSize: 12 };
    const res = toSearchResult(
      {
        data: [dto],
        totalRecords: 0,
        totalGenerated: 0,
        totalGeneratedNotSent: 0,
        totalPending: 0,
      },
      filter,
    );
    expect(res.page.total).toBe(0);
    expect(res.summary.total).toBe(0);
  });
});
