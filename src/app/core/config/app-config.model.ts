/** Configuracion resuelta en tiempo de ejecucion (AD-05). */
export interface AppConfig {
  /** Base de las APIs de VIGP Core. Relativa si SPA y API comparten origen. */
  readonly apiBaseUrl: string;
  /** Destino del boton "Volver a Plataforma Digital". */
  readonly platformReturnUrl: string;
  readonly pageSizeDefault: number;
  readonly featureFlags: Readonly<Record<string, boolean>>;
  /**
   * SOLO DESARROLLO. Con true, el frontend no llama a VIGP Core: siembra una
   * sesion y datos falsos para poder ver las pantallas sin backend.
   * DEBE ser false o estar ausente en QAS y PRD. Ver dev-mock.ts.
   */
  readonly devMock?: boolean;
}
