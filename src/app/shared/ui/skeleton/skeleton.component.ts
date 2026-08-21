import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Preferido al spinner: reserva el espacio y no desplaza el layout. */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (row of rows(); track $index) {
      <div class="sk"></div>
    }
  `,
  styles: [
    `
      .sk {
        height: 1.5rem;
        margin: 0.5rem 0;
        border-radius: 4px;
        background: linear-gradient(90deg, #eef1f3 25%, #e2e7ea 37%, #eef1f3 63%);
        background-size: 400% 100%;
        animation: sk 1.2s ease-in-out infinite;
      }
      @keyframes sk {
        0% { background-position: 100% 50%; }
        100% { background-position: 0 50%; }
      }
      @media (prefers-reduced-motion: reduce) {
        .sk { animation: none; }
      }
    `,
  ],
})
export class SkeletonComponent {
  readonly count = input(5);
  protected readonly rows = computed(() => Array.from({ length: this.count() }));
}
