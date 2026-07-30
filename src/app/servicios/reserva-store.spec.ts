import { TestBed } from '@angular/core/testing';
import { ReservaStore, TOPE_SERVICIOS } from './reserva-store';
import { SERVICIOS } from '../datos/catalogo';
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
const MASAJE = 'masaje-relajante';
const TALLER = 'taller-higiene-postural';

describe('ReservaStore', () => {
  let store: ReservaStore;

  beforeEach(() => {
    // Sin localStorage en el entorno de tests: el store ya lo contempla.
    TestBed.resetTestingModule();
    store = TestBed.inject(ReservaStore);
    store.reiniciar();
  });

  const ids = () => store.carrito().map((s) => s.id);

  describe('reubicar', () => {
    beforeEach(() => {
      [OSTEO, NUTRI, MASAJE].forEach((id) => store.agregar(servicio(id)));
    });

    it('lleva un servicio a la posición pedida', () => {
      // Es la ruta que usan tanto el drag and drop como las flechas.
      store.reubicar(OSTEO, 2);
      expect(ids()).toEqual([NUTRI, MASAJE, OSTEO]);
    });

    it('mueve hacia atrás sin perder ninguno', () => {
      store.reubicar(MASAJE, 0);
      expect(ids()).toEqual([MASAJE, OSTEO, NUTRI]);
    });

    it('ignora posiciones fuera de rango y la posición actual', () => {
      store.reubicar(OSTEO, -1);
      store.reubicar(OSTEO, 3);
      store.reubicar(NUTRI, 1);
      expect(ids()).toEqual([OSTEO, NUTRI, MASAJE]);
      expect(store.ordenManual()).toBe(false);
    });

    it('reordenar fija el orden del usuario e invalida el horario', () => {
      store.elegirFecha(new Date());
      store.reubicar(OSTEO, 1);
      expect(store.ordenManual()).toBe(true);
      expect(store.hora()).toBeNull();
      expect(store.plan()).toBeNull();
      // El día se conserva: solo se cayó el bloque.
      expect(store.fecha()).not.toBeNull();
    });

    it('mover(-1/+1) delega en reubicar', () => {
      store.mover(MASAJE, -1);
      expect(ids()).toEqual([OSTEO, MASAJE, NUTRI]);
      store.mover(MASAJE, 1);
      expect(ids()).toEqual([OSTEO, NUTRI, MASAJE]);
    });
  });

  describe('impedimentos', () => {
    it('no admite más de TOPE_SERVICIOS', () => {
      [OSTEO, NUTRI, MASAJE].forEach((id) => store.agregar(servicio(id)));
      expect(store.cantidad()).toBe(TOPE_SERVICIOS);
      const cuarto = servicio('osteopatia-craneal');
      expect(store.impedimentoPara(cuarto)).toBe('tope');
      store.agregar(cuarto);
      expect(store.cantidad()).toBe(TOPE_SERVICIOS);
    });

    it('no repite el mismo servicio', () => {
      store.agregar(servicio(OSTEO));
      expect(store.impedimentoPara(servicio(OSTEO))).toBe('ya-esta');
      store.agregar(servicio(OSTEO));
      expect(store.cantidad()).toBe(1);
    });

    it('un servicio de reserva única no entra a una visita con otros', () => {
      store.agregar(servicio(OSTEO));
      expect(store.impedimentoPara(servicio(TALLER))).toBe('no-combinable');
    });

    it('con un taller en la visita no entra nada más', () => {
      store.agregar(servicio(TALLER));
      expect(store.esReservaUnica()).toBe(true);
      expect(store.impedimentoPara(servicio(OSTEO))).toBe('visita-no-combinable');
    });

    it('reemplazarPor vacía la visita y deja solo el nuevo', () => {
      [OSTEO, NUTRI].forEach((id) => store.agregar(servicio(id)));
      store.reemplazarPor(servicio(TALLER));
      expect(ids()).toEqual([TALLER]);
    });
  });

  describe('quitar', () => {
    it('saca el servicio y su profesional pedido', () => {
      [OSTEO, NUTRI].forEach((id) => store.agregar(servicio(id)));
      store.fijarProfesional(OSTEO, 'tania-iznardo');
      store.quitar(OSTEO);
      expect(ids()).toEqual([NUTRI]);
      expect(store.profesionalFijado(OSTEO)).toBeNull();
    });

    it('al quedar un solo servicio suelta el orden manual', () => {
      [OSTEO, NUTRI].forEach((id) => store.agregar(servicio(id)));
      store.reubicar(NUTRI, 0);
      expect(store.ordenManual()).toBe(true);
      store.quitar(OSTEO);
      expect(store.ordenManual()).toBe(false);
    });
  });
});
