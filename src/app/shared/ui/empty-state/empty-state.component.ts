import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <p class="empty__title">{{ heading() }}</p>
      @if (hint(); as h) {
        <p class="empty__hint">{{ h }}</p>
      }
    </div>
  `,
  styles: [
    `
      .empty { padding: 2.5rem 1rem; text-align: center; color: #5f6368; }
      .empty__title { margin: 0 0 0.25rem; font-weight: 600; color: #0f172a; }
      .empty__hint { margin: 0; font-size: 0.875rem; }
    `,
  ],
})
export class EmptyStateComponent {
  readonly heading = input.required<string>();
  readonly hint = input<string | null>(null);
}
