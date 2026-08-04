import { TestBed } from '@angular/core/testing';
import { ReservaStore } from './reserva-store';
import { Disponibilidad } from './disponibilidad';
import { AgendaGuardada } from './agenda-guardada';
import { Cuentas } from './cuentas';
import { SERVICIOS } from '../datos/catalogo';
import { DatosContacto, Servicio, Tramo } from '../modelos';
import { conHora } from '../datos/formato';

const servicio = (id: string): Servicio => {
  const s = SERVICIOS.find((x) => x.id === id);
  if (!s) {
    throw new Error(`El catálogo no tiene ${id}`);
  }
  return s;
};

/** Los dan profesionales distintos: sirven para probar el solape del paciente. */
const OSTEO = 'osteopatia-primera';
const MASAJE = 'masaje-relajante';

const DATOS = (email: string): DatosContacto => ({
  nombre: 'Ana',
  apellido: 'Gómez',
  email,
  telefono: '3511234567',
});

describe('confirmación de la visita', () => {
  let store: ReservaStore;
  let disponibilidad: Disponibilidad;
  let agenda: AgendaGuardada;
  let cuentas: Cuentas;

  beforeEach(() => {
    TestBed.resetTestingModule();
    store = TestBed.inject(ReservaStore);
    disponibilidad = TestBed.inject(Disponibilidad);
    agenda = TestBed.inject(AgendaGuardada);
    cuentas = TestBed.inject(Cuentas);
    agenda.vaciar();
    cuentas.cerrarSesion();
    store.reiniciar();
    store.identidad.set(null);
  });

  /** Horarios que ofrece hoy la agenda para ese único servicio, en ese día. */
  const horariosDe = (id: string, fecha: Date): string[] => {
    const antes = store.servicio();
    store.elegirServicio(servicio(id));
    const h = disponibilidad.horariosPara(store.consulta(), fecha);
    if (antes) {
      store.elegirServicio(antes);
    } else {
      store.vaciar();
    }
    return [...h.manana, ...h.tarde];
  };

  /** Primer día + hora en que los dos servicios entran por separado. */
  const diaYHoraComun = (a: string, b: string): { fecha: Date; hora: string } => {
    const base = new Date();
    for (let i = 1; i < 60; i++) {
      const fecha = new Date(base);
      fecha.setDate(fecha.getDate() + i);
      fecha.setHours(0, 0, 0, 0);
      const deB = horariosDe(b, fecha);
      const hora = horariosDe(a, fecha).find((h) => deB.includes(h));
      if (hora) {
        return { fecha, hora };
      }
    }
    throw new Error('sin día en común para los dos servicios');
  };

  /** Deja la reserva lista para confirmar: un servicio, un día y un bloque. */
  const prepararVisita = (id: string, fecha: Date, hora: string): Tramo[] => {
    store.elegirServicio(servicio(id));
    store.elegirFecha(fecha);
    const plan = disponibilidad.planDe(store.consulta(), fecha, hora);
    if (!plan) {
      throw new Error(`${id} no entra el ${fecha.toDateString()} a las ${hora}`);
    }
    store.elegirBloque(hora, plan);
    return plan;
  };

  it('no confirma si la franja se ocupó mientras completaba sus datos', () => {
    const { fecha, hora } = diaYHoraComun(OSTEO, MASAJE);
    const plan = prepararVisita(OSTEO, fecha, hora);

    // Otro paciente toma exactamente esa franja entre el paso 2 y el paso 3.
    agenda.guardar({
      servicioId: plan[0].servicio.id,
      profesionalId: plan[0].profesional.id,
      inicio: conHora(fecha, hora).getTime(),
      duracionMin: plan[0].duracionMin,
      email: 'otro@mail.com',
      reservaId: 'otra-visita',
    });

    const resultado = store.confirmar(DATOS('ana@mail.com'));

    expect(resultado).toEqual({ ok: false, motivo: 'ocupado' });
    // Nada se guardó y el bloque quedó suelto para elegir otro.
    expect(agenda.turnosDe('ana@mail.com')).toEqual([]);
    expect(store.confirmada()).toBe(false);
    expect(store.plan()).toBeNull();
    expect(store.fecha()).toEqual(fecha);
  });

  it('no reserva dos veces la misma visita', () => {
    const { fecha, hora } = diaYHoraComun(OSTEO, MASAJE);
    prepararVisita(OSTEO, fecha, hora);

    expect(store.confirmar(DATOS('ana@mail.com'))).toEqual({ ok: true });
    const despuesDeLaPrimera = agenda.turnosDe('ana@mail.com').length;

    // El "atrás" del navegador o un doble clic vuelven a llamar a confirmar.
    const segunda = store.confirmar(DATOS('ana@mail.com'));

    expect(segunda).toEqual({ ok: false, motivo: 'ya-confirmada' });
    expect(agenda.turnosDe('ana@mail.com').length).toBe(despuesDeLaPrimera);
  });

  it('guarda el mail del invitado, aunque no tenga cuenta', () => {
    const { fecha, hora } = diaYHoraComun(OSTEO, MASAJE);
    prepararVisita(OSTEO, fecha, hora);

    // Con mayúsculas y espacios: la identidad se normaliza siempre.
    expect(store.confirmar(DATOS('  Ana@Mail.com '))).toEqual({ ok: true });

    const turnos = agenda.turnosDe('ana@mail.com');
    expect(turnos.length).toBe(1);
    expect(turnos[0].email).toBe('ana@mail.com');
    expect(turnos[0].paciente).toBe('Ana Gómez');
  });

  it('un invitado no puede quedar en dos turnos superpuestos', () => {
    const { fecha, hora } = diaYHoraComun(OSTEO, MASAJE);
    prepararVisita(OSTEO, fecha, hora);
    expect(store.confirmar(DATOS('ana@mail.com'))).toEqual({ ok: true });

    // Vuelve a entrar sin sesión y sin que sepamos todavía quién es (pestaña
    // nueva): a esa hora el masaje lo da otro profesional y se ofrece igual.
    store.reiniciar();
    store.identidad.set(null);
    prepararVisita(MASAJE, fecha, hora);

    // Al cargar sus datos aparece la identidad y el solape se corta.
    const resultado = store.confirmar(DATOS('ana@mail.com'));

    expect(resultado).toEqual({ ok: false, motivo: 'paciente-ocupado' });
    expect(agenda.turnosDe('ana@mail.com').length).toBe(1);
  });

  it('el turno que reservó como invitado le bloquea el horario a su cuenta', () => {
    const { fecha, hora } = diaYHoraComun(OSTEO, MASAJE);
    prepararVisita(OSTEO, fecha, hora);
    expect(store.confirmar(DATOS('ana@mail.com'))).toEqual({ ok: true });

    // Ahora se crea la cuenta con ese mismo mail e intenta el otro servicio.
    store.reiniciar();
    store.identidad.set(null);
    expect(cuentas.registrar({ ...DATOS('ana@mail.com') }, 'secreta1')).toBeNull();

    // Con sesión, la agenda ya ni siquiera le ofrece esa hora.
    store.elegirServicio(servicio(MASAJE));
    store.elegirFecha(fecha);
    expect(disponibilidad.planDe(store.consulta(), fecha, hora)).toBeNull();
  });

  it('a la inversa: lo reservado con cuenta le bloquea el horario al invitado', () => {
    const { fecha, hora } = diaYHoraComun(OSTEO, MASAJE);
    expect(cuentas.registrar({ ...DATOS('ana@mail.com') }, 'secreta1')).toBeNull();
    prepararVisita(OSTEO, fecha, hora);
    expect(store.confirmar(DATOS('ana@mail.com'))).toEqual({ ok: true });

    // Cierra sesión y prueba de nuevo como invitada con el mismo mail.
    cuentas.cerrarSesion();
    store.reiniciar();
    store.identidad.set(null);
    prepararVisita(MASAJE, fecha, hora);

    expect(store.confirmar(DATOS('ana@mail.com'))).toEqual({
      ok: false,
      motivo: 'paciente-ocupado',
    });
  });

  it('no confirma un horario que ya pasó', () => {
    const { fecha, hora } = diaYHoraComun(OSTEO, MASAJE);
    const plan = prepararVisita(OSTEO, fecha, hora);

    // La visita se movió a ayer sin pasar por la agenda: simula el caso de
    // quedarse en el formulario hasta que el turno quedó atrás.
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    store.elegirFecha(ayer);
    store.elegirBloque(hora, plan);

    expect(store.confirmar(DATOS('ana@mail.com'))).toEqual({
      ok: false,
      motivo: 'vencido',
    });
    expect(agenda.turnosDe('ana@mail.com')).toEqual([]);
  });
});
