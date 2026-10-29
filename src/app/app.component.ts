import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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

  /** Nombre y apellido reactivos del cliente (o mock si devMock está activo). */
  protected readonly clientName = computed(() => {
    if (this.config.devMock) {
      return { firstname: 'John', lastname: 'Doe' };
    }
    return {
      firstname: this.session.clientFirstname(),
      lastname: this.session.clientLastname(),
    };
  });
}
