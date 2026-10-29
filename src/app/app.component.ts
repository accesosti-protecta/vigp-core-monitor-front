import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionService } from '@core/auth/session.service';
import { APP_CONFIG } from '@core/config/app-config.token';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly session = inject(SessionService);
  private readonly config = inject(APP_CONFIG);
  protected readonly returnUrl = this.config.platformReturnUrl;

  /** Tick para forzar re-lectura del sessionStorage cuando sea necesario */
  private readonly _tick = signal(0);

  /** Nombre y apellido del cliente leídos desde sessionStorage (o mock si devMock es true). */
  protected readonly clientName = computed(() => {
    this._tick(); // dependencia reactiva
    if (this.config.devMock) {
      return { firstname: 'John', lastname: 'Doe' };
    }
    const firstname = sessionStorage.getItem('firstname') ?? '';
    const lastname = sessionStorage.getItem('lastname') ?? '';
    return { firstname, lastname };
  });
}
