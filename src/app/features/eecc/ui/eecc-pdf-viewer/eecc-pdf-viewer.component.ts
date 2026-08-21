import { ChangeDetectionStrategy, Component, computed, HostListener, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { APP_CONFIG } from '@core/config/app-config.token';

/**
 * Modal "VISOR DE DOCUMENTO (.PDF)". Muestra el EECC generado en un iframe.
 * En modo devMock no hay PDF real: se muestra un panel de marcador.
 */
@Component({
  selector: 'app-eecc-pdf-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eecc-pdf-viewer.component.html',
  styleUrl: './eecc-pdf-viewer.component.scss',
})
export class EeccPdfViewerComponent {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly devMock = inject(APP_CONFIG).devMock ?? false;

  /** URL del documento; vacia = sin documento. */
  readonly url = input.required<string>();
  readonly close = output<void>();

  protected readonly safeUrl = computed<SafeResourceUrl | null>(() => {
    const u = this.url();
    return u ? this.sanitizer.bypassSecurityTrustResourceUrl(u) : null;
  });

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close.emit();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close.emit();
  }
}
