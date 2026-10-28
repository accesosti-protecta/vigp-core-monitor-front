import { toRow, toSearchResult, toStatus, monthName, toPeriods, fallbackPeriods } from './eecc.mapper';
import { EeccRowDto, EeccSearchDto } from './eecc.dto';
import { hasDocument } from '../domain/eecc-row.model';

const dto: EeccRowDto = {
  policyNumber: 7107004912,
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
  it('mapea los tres estados conocidos', () => {
    expect(toStatus(3)).toBe('GENERADO_ENVIADO');
    expect(toStatus(2)).toBe('GENERADO_NO_ENVIADO');
    expect(toStatus(1)).toBe('PENDIENTE');
  });

  it('un estado nuevo cae en DESCONOCIDO, no rompe la tabla', () => {
    expect(toStatus(99)).toBe('DESCONOCIDO');
    expect(toStatus(null)).toBe('DESCONOCIDO');
  });

  it('sin estado de asegurado, la columna queda vacia (null)', () => {
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

  it('identifica la fila por poliza y periodo, que es lo que pide el visor', () => {
    const r = toRow(dto);
    expect(r.id).toBe('7107004912-2026-3');
    expect(r.policyNumber).toBe('7107004912');
    expect(r.closingYear).toBe(2026);
    expect(r.closingMonth).toBe(3);
  });

  it('solo hay documento (lupa) cuando el EECC esta generado', () => {
    expect(hasDocument(toRow({ ...dto, contractorEeccStatus: 3 }))).toBe(true);
    expect(hasDocument(toRow({ ...dto, contractorEeccStatus: 2 }))).toBe(true);
    expect(hasDocument(toRow({ ...dto, contractorEeccStatus: 1 }))).toBe(false);
    expect(hasDocument(toRow({ ...dto, contractorEeccStatus: 1, insuredEeccStatus: 2 }))).toBe(true);
  });

  it('normaliza total y summary ausentes', () => {
    const res = toSearchResult({ data: [dto] } as unknown as EeccSearchDto, { page: 1, pageSize: 12 });
    expect(res.page.total).toBe(0);
    expect(res.summary.total).toBe(0);
  });

  it('periodos: años ascendentes y meses tal como vienen del API', () => {
    const p = toPeriods({ years: [2026, 2024, 2025], months: [{ value: 1, label: 'Enero' }] });
    expect(p.years).toEqual([2024, 2025, 2026]);
    expect(p.months).toEqual([{ value: 1, label: 'Enero' }]);
  });

  it('periodos: respuesta vacia no rompe los filtros', () => {
    expect(toPeriods({} as never)).toEqual({ years: [], months: [] });
  });

  it('periodos de respaldo: solo el año actual y los 12 meses', () => {
    const p = fallbackPeriods(2026);
    expect(p.years).toEqual([2026]);
    expect(p.months).toHaveLength(12);
    expect(p.months[0]).toEqual({ value: 1, label: 'Enero' });
    expect(p.months[11]).toEqual({ value: 12, label: 'Diciembre' });
  });
});
