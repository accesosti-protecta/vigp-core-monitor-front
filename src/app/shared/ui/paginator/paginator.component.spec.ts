import { pageItems } from './paginator.component';

describe('pageItems', () => {
  it('pocas paginas: las muestra todas, sin "..."', () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('al inicio: bloque de 5, "..." y la ultima (como el mockup)', () => {
    expect(pageItems(1, 22)).toEqual([1, 2, 3, 4, 5, 'gap', 22]);
    expect(pageItems(3, 22)).toEqual([1, 2, 3, 4, 5, 'gap', 22]);
  });

  it('en medio: primera, "...", bloque centrado, "..." y ultima', () => {
    expect(pageItems(10, 22)).toEqual([1, 'gap', 8, 9, 10, 11, 12, 'gap', 22]);
  });

  it('al final: primera, "..." y las ultimas 5', () => {
    expect(pageItems(22, 22)).toEqual([1, 'gap', 18, 19, 20, 21, 22]);
    expect(pageItems(20, 22)).toEqual([1, 'gap', 18, 19, 20, 21, 22]);
  });

  it('"..." nunca oculta una sola pagina: se muestra el numero', () => {
    expect(pageItems(4, 9)).toEqual([1, 2, 3, 4, 5, 6, 'gap', 9]);
    expect(pageItems(5, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(pageItems(6, 9)).toEqual([1, 'gap', 4, 5, 6, 7, 8, 9]);
  });
});
