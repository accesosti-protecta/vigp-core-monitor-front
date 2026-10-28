# Configuracion por ambiente

El build es **uno solo** para DES, QAS y PRD (`npm run build`). Lo que cambia por
ambiente se resuelve en runtime desde `assets/config/app-config.json`.

| Archivo | Ambiente |
|---|---|
| `src/assets/config/app-config.json` | Desarrollo local (`ng serve`) |
| `deploy/config/app-config.qas.json` | QAS |
| `deploy/config/app-config.prd.json` | PRD |

## Comandos

| Comando | Resultado en `dist/eecc-consulta/` |
|---|---|
| `npm start` | No genera build: `ng serve` local con proxy a `https://localhost:7126` |
| `npm run build:dev` | Build sin optimizar, con la config de desarrollo |
| `npm run build:qas` | Build de produccion + `app-config.qas.json` |
| `npm run build:prd` | Build de produccion + `app-config.prd.json` |

Los dos ultimos compilan lo mismo; `scripts/apply-config.mjs` solo copia la
plantilla del ambiente sobre `assets/config/app-config.json` y avisa si quedan
marcadores `__...__` sin reemplazar.

## En el despliegue

Si el pipeline reutiliza un mismo build para varios ambientes, basta con copiar
la plantilla del ambiente **sobre** el archivo publicado:

```powershell
Copy-Item deploy\config\app-config.qas.json <sitio>\assets\config\app-config.json -Force
```

- `__PLATFORM_RETURN_URL_QAS__` debe reemplazarse por la URL de Plataforma
  Digital de QA. Si queda el marcador, la app muestra la pantalla de error de
  arranque (la validacion lo rechaza) en vez de funcionar con un valor errado.
- `apiBaseUrlVigpCore` es relativa (`/api`): el API debe publicarse bajo el mismo
  dominio que el front (reverse proxy o aplicacion IIS en `/api`). Asi no hay
  CORS y la cookie de sesion viaja sin `SameSite=None`.
- **No** incluir `devMock`. Aunque se incluya, el build de produccion lo ignora.
- **Nada secreto** en estos archivos: el navegador los descarga tal cual.
- El servidor web debe enviar `Cache-Control: no-store` para
  `/assets/config/app-config.json`.

## Campos

| Campo | Obligatorio | Regla |
|---|---|---|
| `apiBaseUrlVigpCore` | si | Relativa que empieza con `/`, o URL `http(s)` |
| `platformReturnUrl` | si | URL `http(s)` |
| `pageSizeDefault` | si | Entero > 0 |
| `featureFlags` | no | Objeto `{ "flag": true }` |
| `devMock` | no | Solo desarrollo local |

Las reglas viven en `parseAppConfig` (`src/app/core/config/app-config.loader.ts`).
