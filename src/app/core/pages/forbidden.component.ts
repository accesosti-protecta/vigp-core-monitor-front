import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="msg">
      <h1 tabindex="-1">No tiene acceso a este modulo</h1>
      <p>Su perfil no cuenta con el permiso necesario para consultar los EECC.</p>
      <p>Solicite el acceso al administrador de Plataforma Digital.</p>
      <a [href]="returnUrl">Volver a Plataforma Digital</a>
    </div>
  `,
  styles: [`.msg { max-width: 34rem; padding: 3rem 0; } h1 { color: #05668d; font-size: 1.375rem; }`],
})
export class ForbiddenComponent {
  protected readonly returnUrl = inject(APP_CONFIG).platformReturnUrl;
}
