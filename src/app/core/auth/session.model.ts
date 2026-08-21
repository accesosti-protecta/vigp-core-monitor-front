export interface SessionUser {
  readonly username: string;
  readonly displayName: string;
  readonly profile: string;
}

export interface Session {
  readonly user: SessionUser;
  readonly permissions: readonly string[];
}

/** Respuesta de GET /api/session. Unica fuente de identidad del frontend. */
export interface SessionDto {
  username: string;
  displayName: string;
  profile: string;
  permissions: string[];
}

export const PERM_EECC_CONSULTA = 'EECC_CONSULTA';
