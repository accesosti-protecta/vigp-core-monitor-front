import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

/**
 * Copiado desde node_modules por scripts/copy-pdf-worker.mjs (postinstall).
 * Extension .js y no .mjs: algunos IIS bloquean .mjs.
 */
const WORKER_SRC = 'assets/pdfjs/pdf.worker.min.js';
const ZOOM_STEPS: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM = 2; // indice de 1 (100%)
const THUMB_WIDTH = 110; // px de ancho de las miniaturas
const PAGE_GAP = 12; // px entre paginas

type ViewerStatus = 'loading' | 'ready' | 'error';

/**
 * Modal "VISOR DE DOCUMENTO (.PDF)" de solo lectura (HU visor EECC, CA04/CA05).
 *
 * El PDF se dibuja con pdf.js sobre <canvas>: no se usa el visor nativo del
 * navegador (iframe/embed), que siempre expone Descargar e Imprimir. No hay
 * capa de texto (no se puede seleccionar/copiar), se bloquean menu contextual,
 * Ctrl+S / Ctrl+P y la impresion del modal.
 *
 * Barra: panel de miniaturas, navegacion (primera / anterior / N de M /
 * siguiente / ultima) y zoom. Sin Descargar ni Imprimir.
 */
@Component({
  selector: 'app-eecc-pdf-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eecc-pdf-viewer.component.html',
  styleUrl: './eecc-pdf-viewer.component.scss',
})
export class EeccPdfViewerComponent {
  /** Bytes del PDF. El componente solo se crea cuando el documento existe (CA07). */
  readonly data = input.required<ArrayBuffer>();
  readonly close = output<void>();

  private readonly scrollEl = viewChild.required<ElementRef<HTMLDivElement>>('scroll');
  private readonly pagesEl = viewChild.required<ElementRef<HTMLDivElement>>('pages');
  private readonly thumbsEl = viewChild.required<ElementRef<HTMLDivElement>>('thumbs');

  protected readonly status = signal<ViewerStatus>('loading');
  protected readonly pageCount = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly sidebarOpen = signal(false);
  protected readonly zoomIndex = signal(DEFAULT_ZOOM);
  protected readonly zoomLabel = computed(() => `${Math.round(ZOOM_STEPS[this.zoomIndex()] * 100)}%`);
  protected readonly canZoomOut = computed(() => this.zoomIndex() > 0);
  protected readonly canZoomIn = computed(() => this.zoomIndex() < ZOOM_STEPS.length - 1);
  protected readonly isFirst = computed(() => this.currentPage() <= 1);
  protected readonly isLast = computed(() => this.currentPage() >= this.pageCount());

  private task: PDFDocumentLoadingTask | null = null;
  private doc: PDFDocumentProxy | null = null;
  private pageCanvases: HTMLCanvasElement[] = [];
  private thumbCanvases: HTMLCanvasElement[] = [];
  /** Descarta renders superados por un cambio de zoom posterior. */
  private renderSeq = 0;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.load());
    effect(() => this.highlightThumb(this.currentPage()));
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.renderSeq++;
      void this.task?.destroy();
    });
  }

  // ---- Navegacion ----

  protected first(): void {
    this.goTo(1);
  }

  protected prev(): void {
    this.goTo(this.currentPage() - 1);
  }

  protected next(): void {
    this.goTo(this.currentPage() + 1);
  }

  protected last(): void {
    this.goTo(this.pageCount());
  }

  /** Campo "N de M": Enter o perder foco navega; un valor invalido se descarta. */
  protected onPageInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const n = Number(el.value);
    if (Number.isInteger(n) && n >= 1 && n <= this.pageCount()) {
      this.goTo(n);
    }
    el.value = String(this.currentPage());
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected goTo(page: number): void {
    const n = Math.min(Math.max(page, 1), this.pageCount());
    const canvas = this.pageCanvases[n - 1];
    if (!canvas) return;
    this.currentPage.set(n);
    this.scrollEl().nativeElement.scrollTop = canvas.offsetTop - PAGE_GAP;
  }

  /** La pagina actual es la ultima cuyo borde superior ya paso la mitad superior del area. */
  protected onScroll(): void {
    const scroll = this.scrollEl().nativeElement;
    const mark = scroll.scrollTop + scroll.clientHeight / 3;
    let page = 1;
    this.pageCanvases.forEach((c, i) => {
      if (c.offsetTop <= mark) page = i + 1;
    });
    // Al final del scroll la ultima pagina puede no alcanzar la marca.
    if (scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 2) page = this.pageCount();
    if (page !== this.currentPage()) this.currentPage.set(page);
  }

  // ---- Zoom ----

  protected zoomIn(): void {
    if (!this.canZoomIn()) return;
    this.zoomIndex.update((i) => i + 1);
    void this.renderPages();
  }

  protected zoomOut(): void {
    if (!this.canZoomOut()) return;
    this.zoomIndex.update((i) => i - 1);
    void this.renderPages();
  }

  // ---- Solo lectura ----

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close.emit();
  }

  protected blockContextMenu(event: Event): void {
    event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
      return;
    }
    // Guardar / Imprimir del navegador mientras el visor esta abierto.
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && (key === 's' || key === 'p')) {
      event.preventDefault();
    }
  }

  // ---- Render ----

  private async load(): Promise<void> {
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
      // Copia: pdf.js transfiere el buffer al worker y lo deja inutilizable.
      this.task = pdfjs.getDocument({
        data: new Uint8Array(this.data().slice(0)),
        isEvalSupported: false,
        enableXfa: false,
      });
      this.doc = await this.task.promise;
      this.pageCount.set(this.doc.numPages);
      await this.renderPages();
      this.status.set('ready');
      void this.renderThumbs();
    } catch {
      this.status.set('error');
    }
  }

  private async renderPages(): Promise<void> {
    const doc = this.doc;
    if (!doc) return;
    const seq = ++this.renderSeq;
    const keepPage = this.currentPage();
    const scale = ZOOM_STEPS[this.zoomIndex()];

    this.pageCanvases = [];
    this.pagesEl().nativeElement.replaceChildren();
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      if (seq !== this.renderSeq) return;

      const canvas = createCanvas(page, scale);
      canvas.style.margin = `0 auto ${PAGE_GAP}px`;
      canvas.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.25)';
      canvas.setAttribute('aria-label', `Pagina ${n} de ${doc.numPages}`);
      this.pageCanvases.push(canvas);
      this.pagesEl().nativeElement.appendChild(canvas);

      await drawPage(page, canvas, scale);
      if (seq !== this.renderSeq) return;
      // Al cambiar el zoom se conserva la pagina en la que estaba el usuario.
      if (n === keepPage && keepPage > 1) this.goTo(keepPage);
    }
  }

  private async renderThumbs(): Promise<void> {
    const doc = this.doc;
    if (!doc) return;
    const host = this.thumbsEl().nativeElement;

    // Las miniaturas no dependen del zoom: se dibujan una sola vez.
    this.thumbCanvases = [];
    host.replaceChildren();
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      if (this.destroyed) return;

      const scale = THUMB_WIDTH / page.getViewport({ scale: 1 }).width;
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Ir a la pagina ${n}`);
      Object.assign(button.style, {
        display: 'block', margin: '0 auto 4px', padding: '3px', background: 'transparent',
        border: '2px solid transparent', borderRadius: '3px', cursor: 'pointer',
      });
      button.addEventListener('click', () => this.goTo(n));

      const canvas = createCanvas(page, scale);
      canvas.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
      const label = document.createElement('span');
      label.textContent = String(n);
      Object.assign(label.style, { display: 'block', fontSize: '0.75rem', color: '#5f6368', marginTop: '2px' });

      button.append(canvas, label);
      host.appendChild(button);
      this.thumbCanvases.push(canvas);
      await drawPage(page, canvas, scale);
    }
    this.highlightThumb(this.currentPage());
  }

  /** Marca con borde naranja la miniatura de la pagina actual. */
  private highlightThumb(current: number): void {
    this.thumbCanvases.forEach((c, i) => {
      const btn = c.parentElement as HTMLElement | null;
      if (btn) btn.style.borderColor = i + 1 === current ? '#f97316' : 'transparent';
    });
  }
}

/** Canvas nitido en pantallas HiDPI. Estilos en linea: los nodos creados por
 * codigo no reciben el atributo de encapsulacion del componente. */
function createCanvas(page: PDFPageProxy, scale: number): HTMLCanvasElement {
  const viewport = page.getViewport({ scale });
  const ratio = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width * ratio);
  canvas.height = Math.floor(viewport.height * ratio);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;
  canvas.style.display = 'block';
  canvas.style.background = '#fff';
  return canvas;
}

async function drawPage(page: PDFPageProxy, canvas: HTMLCanvasElement, scale: number): Promise<void> {
  const ratio = window.devicePixelRatio || 1;
  await page.render({
    canvas,
    viewport: page.getViewport({ scale }),
    transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
  }).promise;
}
