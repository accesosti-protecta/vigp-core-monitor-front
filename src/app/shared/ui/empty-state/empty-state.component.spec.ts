import { render, screen } from '@testing-library/angular';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  it('muestra el mensaje inicial de la vista de control', async () => {
    await render(EmptyStateComponent, {
      inputs: { heading: 'Realice una busqueda para visualizar resultados' },
    });
    expect(screen.getByText('Realice una busqueda para visualizar resultados')).toBeTruthy();
  });

  it('el hint es opcional', async () => {
    await render(EmptyStateComponent, { inputs: { heading: 'Sin resultados' } });
    expect(screen.getByText('Sin resultados')).toBeTruthy();
  });
});
