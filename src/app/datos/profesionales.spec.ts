import { SERVICIOS } from './catalogo';
import { PROFESIONALES, categoriasDe, profesionalesPara } from './profesionales';

describe('profesionales', () => {
  it('todo servicio del catálogo tiene al menos un profesional que lo ofrece', () => {
    const huerfanos = SERVICIOS.filter((s) => profesionalesPara(s.id).length === 0).map(
      (s) => s.id
    );
    expect(huerfanos).toEqual([]);
  });

  it('los profesionales solo ofrecen servicios que existen en el catálogo', () => {
    const ids = new Set(SERVICIOS.map((s) => s.id));
    const inventados = PROFESIONALES.flatMap((p) =>
      p.servicios.filter((id) => !ids.has(id)).map((id) => `${p.id}: ${id}`)
    );
    expect(inventados).toEqual([]);
  });

  it('cada profesional atiende al menos un día y una categoría', () => {
    for (const p of PROFESIONALES) {
      expect(p.dias.length).toBeGreaterThan(0);
      expect(categoriasDe(p).length).toBeGreaterThan(0);
    }
  });
});
