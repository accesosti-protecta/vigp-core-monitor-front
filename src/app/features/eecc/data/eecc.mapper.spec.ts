import { toRow, toSearchResult, toStatus, monthName } from './eecc.mapper';
import { EeccRowDto, EeccSearchDto } from './eecc.dto';

const dto: EeccRowDto = {
  id: 'e-1',
  policyNumber: '7107004912',
  documentNumber: '71418265',
  contratante: 'Bernabe Rios Juan',
  asegurado: 'Bernabe Rios Juan',
  closingMonth: 3,
  closingYear: 2026,
  contratanteStatus: 'GENERATED_SENT',
  aseguradoStatus: null,
  generatedAt: '2026-04-01T09:00:00-05:00',
};

describe('eecc.mapper', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('mapea los tres estados conocidos', () => {
    expect(toStatus('GENERATED_SENT')).toBe('GENERADO_ENVIADO');
    expect(toStatus('GENERATED_NOT_SENT')).toBe('GENERADO_NO_ENVIADO');
    expect(toStatus('PENDING')).toBe('PENDIENTE');
  });

  it('un estado nuevo cae en DESCONOCIDO, no rompe la tabla', () => {
    expect(toStatus('SOMETHING_NEW')).toBe('DESCONOCIDO');
    expect(toStatus(null)).toBe('DESCONOCIDO');
  });

  it('sin estado de asegurado, la columna queda vacia (null)', () => {
    expect(toRow(dto).aseguradoStatus).toBeNull();
  });

  it('con asegurado distinto, mapea su estado', () => {
    const r = toRow({ ...dto, asegurado: 'Otro', aseguradoStatus: 'PENDING' });
    expect(r.aseguradoStatus).toBe('PENDIENTE');
  });

  it('arma el periodo legible desde mes y ano', () => {
    expect(toRow(dto).period).toBe('Marzo 2026');
    expect(monthName(12)).toBe('Diciembre');
  });

  it('normaliza total y summary ausentes', () => {
    const res = toSearchResult({ items: [dto], page: 1, pageSize: 12 } as unknown as EeccSearchDto);
    expect(res.page.total).toBe(0);
    expect(res.summary.total).toBe(0);
  });
});
