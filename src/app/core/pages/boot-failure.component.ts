import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-boot-failure',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="msg">
      <h1 tabindex="-1">No se pudo iniciar la aplicacion</h1>
      <p>No fue posible contactar al servicio. Verifique su conexion a la red corporativa.</p>
      <p>Si el problema persiste, comuniquelo a la Mesa de Ayuda.</p>
    </div>
  `,
  styles: [`.msg { max-width: 34rem; padding: 3rem 0; } h1 { color: #a11212; font-size: 1.375rem; }`],
})
export class BootFailureComponent {}
