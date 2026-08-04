import { TestBed } from '@angular/core/testing';
import { ReservaStore } from './reserva-store';
import { SERVICIOS, combinablesDe } from '../datos/catalogo';
import { Servicio } from '../modelos';

const servicio = (id: string): Servicio => {
  const s = SERVICIOS.find((x) => x.id === id);
  if (!s) {
    throw new Error(`El catálogo no tiene ${id}`);
  }
  return s;
};

const OSTEO = 'osteopatia-primera';
const NUTRI = 'nutricion-consulta';
const MASAJE = 'masaje-descontracturante';

describe('ReservaStore', () => {
  let store: ReservaStore;

  beforeEach(() => {
    // Sin localStorage en el entorno de tests: el store ya lo contempla.
    TestBed.resetTestingModule();
    store = TestBed.inject(ReservaStore);
    store.reiniciar();
  });

  describe('elegirServicio', () => {
    it('arranca la reserva con ese servicio', () => {
      store.elegirServicio(servicio(OSTEO));
      expect(store.servicio()?.id).toBe(OSTEO);
      expect(store.hayServicio()).toBe(true);
      expect(store.total()).toBe(servicio(OSTEO).precio);
    });

    it('elegir otro servicio pisa al anterior y suelta su profesional', () => {
      store.elegirServicio(servicio(OSTEO));
      store.fijarProfesional(OSTEO, 'tania-iznardo');
      store.elegirServicio(servicio(NUTRI));
      expect(store.servicio()?.id).toBe(NUTRI);
      expect(store.profesionalFijado(OSTEO)).toBeNull();
    });

    it('cambiar el servicio invalida el horario ya elegido', () => {
      store.elegirServicio(servicio(OSTEO));
      store.elegirFecha(new Date());
      store.elegirServicio(servicio(NUTRI));
      expect(store.hora()).toBeNull();
      expect(store.plan()).toBeNull();
      // El día se conserva: solo se cayó el bloque.
      expect(store.fecha()).not.toBeNull();
    });
  });

  describe('combinables', () => {
    it('el catálogo sugiere combinables reales para el mock', () => {
      const sugeridos = combinablesDe(servicio(MASAJE));
      expect(sugeridos.length).toBeGreaterThan(0);
      // Un servicio nunca se combina consigo mismo.
      expect(sugeridos.some((s) => s.id === MASAJE)).toBe(false);
    });

    it('el combinable pendiente queda anotado y se puede soltar', () => {
      const sugerido = combinablesDe(servicio(MASAJE))[0];
      store.elegirServicio(servicio(MASAJE));
      store.elegirCombinable(sugerido);
      expect(store.combinablePendiente()?.id).toBe(sugerido.id);
      store.elegirCombinable(null);
      expect(store.combinablePendiente()).toBeNull();
    });

    it('reiniciar también descarta el combinable pendiente', () => {
      store.elegirServicio(servicio(MASAJE));
      store.elegirCombinable(combinablesDe(servicio(MASAJE))[0]);
      store.reiniciar();
      expect(store.combinablePendiente()).toBeNull();
    });
  });

  describe('vaciar', () => {
    it('descarta el servicio y su profesional pedido', () => {
      store.elegirServicio(servicio(OSTEO));
      store.fijarProfesional(OSTEO, 'tania-iznardo');
      store.vaciar();
      expect(store.servicio()).toBeNull();
      expect(store.hayServicio()).toBe(false);
      expect(store.profesionalFijado(OSTEO)).toBeNull();
    });
  });
});
