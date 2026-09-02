import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';

/**
 * No redirige sola: una redireccion automatica con un formulario de filtros a
 * medio llenar descarta el trabajo del usuario sin aviso.
 * Modificacion declarada respecto de la propuesta funcional (seccion 5.5).
 */
@Component({
  selector: 'app-expired',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="msg">
      <h1 tabindex="-1">Su sesion expiro</h1>
      <p>Por seguridad, la sesion se cerro tras un periodo de inactividad.</p>
      <p>Vuelva a Plataforma Digital para iniciar sesion nuevamente.</p>
      <a [href]="returnUrl">Volver a Plataforma Digital</a>
    </div>
  `,
  styles: [`.msg { max-width: 34rem; padding: 3rem 0; } h1 { color: #05668d; font-size: 1.375rem; }`],
})
export class ExpiredComponent {
  protected readonly returnUrl = inject(APP_CONFIG).platformReturnUrl;
}
