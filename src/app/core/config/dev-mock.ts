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
 * model, app-config.json, session.service, eecc.api, eecc-pdf-viewer).
 * ============================================================================
 */
import { Session, PERM_EECC_CONSULTA } from '../auth/session.model';
import { EeccFilter } from '../../features/eecc/domain/eecc-filter';
import { EeccId, EeccRow } from '../../features/eecc/domain/eecc-row.model';
import { EnvioStatus } from '../../features/eecc/domain/envio-status';
import { SearchResult } from '../../features/eecc/data/eecc.mapper';

export const MOCK_SESSION: Session = {
  user: { username: 'dev', displayName: 'Usuario de Desarrollo', profile: 'OPERACIONES' },
  permissions: Object.freeze([PERM_EECC_CONSULTA]),
};

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

export function mockDocumentUrl(id: string): string {
  // Sin PDF real: el visor detecta devMock y muestra un panel de marcador.
  return `about:blank#${id}`;
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
    contratanteStatus,
    aseguradoStatus,
    generatedAt: gen,
  };
}
