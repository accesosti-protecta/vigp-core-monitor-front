// Copia el worker de pdf.js a src/assets con extension .js (se ejecuta en postinstall).
// Motivo: algunos IIS bloquean la extension .mjs (404.3 / 404.7) y el visor PDF no carga.
// El worker es un modulo ES: el navegador lo acepta con cualquier extension servida como JavaScript.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve('node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const target = resolve('src/assets/pdfjs/pdf.worker.min.js');

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`[copy-pdf-worker] ${source} -> ${target}`);
