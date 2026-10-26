import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  protected readonly returnUrl = inject(APP_CONFIG).platformReturnUrl;
}
