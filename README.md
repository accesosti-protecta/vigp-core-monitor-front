# Consulta y Trazabilidad de EECC — Frontend

Modulo de solo lectura para que Operaciones consulte el estado de generacion de
los Estados de Cuenta (EECC) de polizas VIGP y su trazabilidad por checkpoints.

- **Arquitectura:** `2026-08-17-EECC-VIGP-Arquitectura-Frontend.md`
- **Propuesta funcional:** documento de origen, seccion 15 del anterior lista las
  cuatro modificaciones que este diseno le introduce.

---

## Versiones — leer antes de instalar

Todo el stack esta alineado en **Angular 21.2.x**. Las versiones no son
arbitrarias: hay una cadena de restricciones que se cierra sola.

| Paquete | Version | Por que esa |
|---|---|---|
| Angular | `^21.2.0` | Runtime, builder y compiler-cli **en la misma major**. Es la restriccion dura |
| `@angular/build` | `^21.2.0` | Builder moderno. **No usar `@angular-devkit/build-angular`**: deprecado en v22 |
| TypeScript | `~5.9.0` | `@angular/compiler-cli@21` exige `>=5.9 <6.1` |
| Jest | `^30.0.0` | `jest-preset-angular@16` exige `^30` |
| `jest-preset-angular` | `^16.1.0` | Su peer es `>=19.0.0 <22.0.0`: **soporta 21, no 22** |
| Node | `^20.19 \|\| ^22.12 \|\| >=24` | Angular 21. La v22 dropea Node 20 |

**Por que 21 y no 22.** Angular 22 exige TypeScript 6 y Node 22+, y
`jest-preset-angular` no lo soporta: subir a 22 obliga a migrar los specs a
Vitest (`@angular/build:unit-test`), que es hacia donde empuja Angular. Es un
trabajo aparte, no un `ng update`.

## Instalacion

```bash
nvm use                 # Node 22.12
npm ci                  # o npm install si no hay package-lock
npm run build
npm test
```

**Si venis de una instalacion rota**, borrar antes:

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## Estado de verificacion

| Verificacion | Estado |
|---|---|
| Sintaxis TypeScript de los 76 archivos (`tsc`) | Sin errores |
| Revision estatica de APIs contra Angular 19+ | Hecha |
| `npm install` + `ng build` | **Pendiente: correr en local** |
| `npm test` | **Pendiente: correr en local** |

## Problemas conocidos

### `The current version of "@angular/build" supports Angular versions ^19.0.0, but detected Angular version 21.x`

El runtime y el builder quedaron en majors distintas. Pasa cuando se corre
`npm audit fix --force`, que sube unos paquetes y no otros.

**No se arregla con `npm audit fix`.** Hay que alinear las majors a mano en
`package.json` y reinstalar limpio. La forma correcta de subir de major es:

```bash
npx ng update @angular/core@21 @angular/cli@21
```

`ng update` corre las migraciones de codigo; `npm audit fix --force` solo cambia
numeros de version y deja el arbol inconsistente.

### `npm audit` reporta vulnerabilidades del toolchain

Casi todas viven bajo `@angular-devkit/build-angular` y su cadena webpack
(`webpack-dev-server`, `copy-webpack-plugin`, `serialize-javascript`, `sockjs`,
`http-proxy-middleware`, `less`, `image-size`). **Este proyecto ya no usa ese
paquete**: con `@angular/build` esa rama entera desaparece del arbol.

Dos cosas a tener presentes al leer un `npm audit`:

1. Son **devDependencies**: el compilador y el servidor de desarrollo. No se
   empaquetan ni se sirven al navegador.
2. Varias son explotables solo con el dev-server expuesto en Windows. Importan
   en la maquina del desarrollador, no en produccion.

Eso no es excusa para dejarlas: significa que la prioridad es mantener el
toolchain al dia, no que el hallazgo sea falso.

### `npx run start`

No existe. Es `npm start` (o `npm run start`).

---

## Estructura

```
src/app/
  core/          sesion, http, config, errores, paginas de estado
    auth/        SessionStore (signals), guards, GET /api/session
    http/        interceptores: credenciales, correlacion, errores
    config/      carga de app-config.json en runtime
    errors/      AppError, mapper HTTP -> mensaje funcional, ErrorHandler global
    pages/       sin-permiso, sesion-expirada, error-arranque
  features/eecc/
    domain/      modelos y estados. Sin dependencias
    data/        DTO, mapper y cliente HTTP. Frontera con el backend
    ui/          listado, detalle, checkpoints
    eecc.store.ts   signals + token de secuencia
    eecc.routes.ts  rutas lazy; provee el store por activacion
  shared/ui/     data-table, paginator, status-chip, timeline, empty-state, skeleton
```

Dependencias en un solo sentido: `features` usa `core` y `shared`;
`shared` no conoce `features` **salvo `timeline`**, que importa los tipos de
checkpoint del dominio. Si esa dependencia molesta en revision, se corta
moviendo `CheckpointStatus` a `shared` o parametrizando el componente.

Reglas dentro de la feature: `ui` no habla HTTP, `data` no conoce el Router.

Alias de import configurados en `tsconfig.json` y `jest.config.js`:
`@core/*`, `@features/*`, `@shared/*`, `@env/*`.

---

## Sesion

El frontend **no lee, no escribe y no almacena** la sesion. Su participacion
entera es `credentials.interceptor.ts`: pedirle al navegador que envie la
cookie `HttpOnly` que emitio VIGP Core.

Flujo de entrada: PD pide un ticket a WSKuntur, redirige a
`/session/exchange?ticket=...` de VIGP Core, este lo canjea, crea la sesion y
responde con un 302 mas `Set-Cookie`. El SPA arranca despues y llama a
`GET /api/session` para conocer usuario y permisos.

**Los guards son UX, no seguridad.** Cada endpoint de VIGP Core tiene que
revalidar sesion y permiso por su cuenta.

---

## Bypass de login para desarrollo

Sin VIGP Core (P-01) el arranque falla en `session.bootstrap()` y no se ve
nada. Para ver las pantallas sin backend hay un flag **solo de desarrollo**:

```json
// src/assets/config/app-config.json
"devMock": true
```

Con el flag activo:

- **Sesion:** `session.service.ts` siembra un usuario falso con el permiso
  `EECC_CONSULTA` en vez de llamar a `GET /api/session`. Pasan los dos guards.
- **Datos:** `eecc.api.ts` devuelve las filas de `dev-mock.ts` en vez de llamar
  a `GET /api/eecc`. Se ven las 12 pólizas de ejemplo del mockup (contratante y
  asegurado con sus estados). La lupa abre el visor PDF con un panel de marcador
  (sin backend no hay PDF real).

Todo el codigo falso vive en `src/app/core/config/dev-mock.ts`.

**No puede llegar a produccion.** `app-config.loader.ts` fuerza `devMock: false`
cuando `environment.production` es true, aunque el JSON traiga el flag. El build
de produccion ignora el bypass por diseno.

Para quitarlo del todo: borrar `dev-mock.ts`, quitar `devMock` de
`app-config.json` y del `AppConfig`, y las dos guardas en `session.service.ts`
y `eecc.api.ts` (una linea cada una).

## Configuracion por ambiente

`src/assets/config/app-config.json` se carga en runtime y se reemplaza en el
despliegue. Un solo artefacto para DES, QAS y PRD.

```json
{
  "apiBaseUrl": "/api",
  "platformReturnUrl": "https://plataformadigital.protectasecurity.pe/",
  "pageSizeDefault": 50,
  "featureFlags": { "checkpointsTimeline": true }
}
```

**Ese archivo no puede cachearse.** No lleva hash en el nombre, asi que el
servidor web debe emitir `Cache-Control: no-store` para el.

`src/environments/` queda solo con `production: true|false`.

---

## Cabeceras que debe emitir el servidor web

No las pone la aplicacion: van en la configuracion del sitio.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self';
                         style-src 'self' 'unsafe-inline'; img-src 'self' data:;
                         connect-src 'self'; object-src 'none'; base-uri 'self';
                         form-action 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer

Cache-Control: no-store   -> index.html, /api/*, /assets/config/app-config.json
Cache-Control: public, max-age=31536000, immutable   -> resto de assets
```

Y una regla de reescritura de SPA: todo lo que no sea archivo existente ni
`/api/*` va a `index.html`.

---

## Desarrollo

```bash
npm start        # ng serve con proxy.conf.json -> localhost:5000
npm test         # Jest
npm run test:cov # cobertura
npm run e2e      # Playwright (requiere la app levantada)
npm run build    # produccion
```

`proxy.conf.json` apunta a `http://localhost:5000`. Ajustar al puerto local de
VIGP Core cuando exista.

---

## Pendientes que bloquean

Del documento de arquitectura, seccion 13:

- **P-01** — Existe VIGP Core y expone APIs, o hay que construirlo. Sin host
  asignado no se puede cerrar si hay CORS.
- **P-02** — VIGP esta desactivado en produccion desde el 15-ago-2026. De que
  polizas salen los EECC a consultar.
- **P-03** — Aval del handoff por ticket, que invierte la direccion respecto de
  la propuesta funcional.
- **P-07** — El listado debe devolver `total`. Sin el no hay paginador.

Los contratos en `data/eecc.dto.ts` son una hipotesis de trabajo: cuando VIGP
Core publique los reales, lo que cambia es `eecc.mapper.ts` y nada mas. Para eso
esta la capa.
