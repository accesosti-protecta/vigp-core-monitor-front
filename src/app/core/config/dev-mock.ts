/**
 * ============================================================================
 *  SOLO DESARROLLO — BYPASS DE LOGIN Y DATOS FALSOS
 * ============================================================================
 * Existe porque VIGP Core todavia no esta disponible (P-01). Permite ver las
 * pantallas sin backend ni sesion real.
 *
 * Se activa con "devMock": true en assets/config/app-config.json.
 * NUNCA debe quedar activo en QAS ni PRD. app-config.loader.ts fuerza
 * devMock:false en builds de produccion.
 * Para eliminarlo: borrar este archivo y las referencias a devMock (config
 * model, app-config.json, session.service, eecc.api).
 * ============================================================================
 */
import { EeccFilter } from '../../features/eecc/domain/eecc-filter';
import { EeccId, EeccRow } from '../../features/eecc/domain/eecc-row.model';
import { EnvioStatus } from '../../features/eecc/domain/envio-status';
import { SearchResult } from '../../features/eecc/data/eecc.mapper';
import { AppError } from '../errors/app-error';

const D = new Date('2026-04-01T09:00:00-05:00');

// Filas de ejemplo, calcadas del mockup: contratante y asegurado con estados
// propios; cuando son la misma persona, el asegurado no tiene estado.
const ROWS: readonly EeccRow[] = [
  row('e-01', '7107004912', '71418265', 'Bernabe Rios Juan', 'Bernabe Rios Juan', 'GENERADO_ENVIADO', null, D),
  row('e-02', '7107004790', '09418265', 'Palacios Rios Jorge', 'Durand Cruz Carlos', 'GENERADO_ENVIADO', 'GENERADO_ENVIADO', D),
  row('e-03', '7107004789', '71002265', 'Cruz Salaz Lucero', 'Cuenca Gomez Clara', 'GENERADO_ENVIADO', 'PENDIENTE', D),
  row('e-04', '7107003123', '85418299', 'Cuenca Gomez Clara', 'Cuenca Gomez Clara', 'PENDIENTE', null, null),
  row('e-05', '7107002901', '71418265', 'Palacios Cruz Hector', 'Palacios Cruz Hector', 'GENERADO_NO_ENVIADO', null, D),
  row('e-06', '7107002345', '71418265', 'Durand Cruz Carlos', 'Durand Cruz Carlos', 'PENDIENTE', null, null),
  row('e-07', '7107001912', '66418265', 'Palacios Cruz Hector', 'Palacios Cruz Hector', 'PENDIENTE', null, null),
  row('e-08', '7107001890', '05418265', 'Guerra Cruz Hector', 'Guerra Cruz Hector', 'GENERADO_ENVIADO', null, D),
  row('e-09', '7107001567', '87418265', 'Torres Cruz Hector', 'Torres Cruz Hector', 'GENERADO_ENVIADO', null, D),
  row('e-10', '7107001456', '71452265', 'Chavez Cruz Hector', 'Chavez Cruz Hector', 'GENERADO_ENVIADO', null, D),
  row('e-11', '7107001234', '71418265', 'Palacios Cruz Hector', 'Palacios Cruz Hector', 'GENERADO_ENVIADO', null, D),
  row('e-12', '7107001100', '70011223', 'Rojas Vega Marina', 'Rojas Vega Marina', 'GENERADO_ENVIADO', null, D),
];

export function mockSearch(filter: EeccFilter): Promise<SearchResult> {
  // Filtra por poliza para que el empty-state "Sin resultados" sea alcanzable
  // en desarrollo. Mes/ano se ignoran: todas las filas son de Marzo 2026.
  const matched = filter.policyNumber
    ? ROWS.filter((r) => r.policyNumber.includes(filter.policyNumber!))
    : ROWS;
  const start = (filter.page - 1) * filter.pageSize;
  const items = matched.slice(start, start + filter.pageSize);
  const count = (s: EnvioStatus) => matched.filter((r) => r.contratanteStatus === s).length;
  return Promise.resolve({
    page: { items, page: filter.page, pageSize: filter.pageSize, total: matched.length },
    summary: {
      total: matched.length,
      generadoEnviado: count('GENERADO_ENVIADO'),
      generadoNoEnviado: count('GENERADO_NO_ENVIADO'),
      pendiente: count('PENDIENTE'),
    },
  });
}

/** PDF minimo de una pagina; las filas PENDIENTE simulan "documento no disponible". */
export function mockDocument(row: EeccRow): Promise<ArrayBuffer> {
  if (row.contratanteStatus === 'PENDIENTE') {
    const notFound: AppError = { kind: 'notfound', message: 'No se encontro el EECC solicitado.' };
    return Promise.reject(notFound);
  }
  const text = `EECC de ejemplo - Poliza ${row.policyNumber} - ${row.period}`;
  const stream = `BT /F1 14 Tf 72 720 Td (${text}) Tj ET`;
  const pdf =
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R' +
    '/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
    `4 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream endobj\n` +
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
    'trailer<</Root 1 0 R>>\n%%EOF';
  return Promise.resolve(new TextEncoder().encode(pdf).buffer as ArrayBuffer);
}

function row(
  id: string,
  poliza: string,
  dni: string,
  contratante: string,
  asegurado: string,
  contratanteStatus: EnvioStatus,
  aseguradoStatus: EnvioStatus | null,
  gen: Date | null,
): EeccRow {
  return {
    id: id as EeccId,
    policyNumber: poliza,
    documentNumber: dni,
    contratante,
    asegurado,
    period: 'Marzo 2026',
    closingMonth: 3,
    closingYear: 2026,
    contratanteStatus,
    aseguradoStatus,
    generatedAt: gen,
  };
}
