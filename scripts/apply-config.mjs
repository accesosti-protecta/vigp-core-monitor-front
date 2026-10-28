// Copia la plantilla de configuracion del ambiente sobre el build ya generado.
// Uso: node scripts/apply-config.mjs <qas|prd>
// Ver deploy/config/README.md.
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const env = process.argv[2];
const source = resolve(`deploy/config/app-config.${env}.json`);
const target = resolve('dist/eecc-consulta/assets/config/app-config.json');

if (!env || !existsSync(source)) {
  console.error(`[apply-config] Ambiente no valido: "${env ?? ''}". Use: qas | prd`);
  process.exit(1);
}
if (!existsSync(target)) {
  console.error('[apply-config] No existe el build. Ejecute primero "npm run build".');
  process.exit(1);
}

copyFileSync(source, target);
console.log(`[apply-config] ${source} -> ${target}`);

// Marcadores sin reemplazar: la app los rechaza al arrancar (/error-arranque).
const pending = readFileSync(target, 'utf8').match(/__[A-Z0-9_]+__/g);
if (pending) {
  console.warn(`[apply-config] ATENCION: valores por completar antes de desplegar: ${[...new Set(pending)].join(', ')}`);
}
