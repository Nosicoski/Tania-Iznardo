import { Injectable, signal } from '@angular/core';
import { Intervalo, TurnoGuardado } from '../modelos';
import { inicioDelDia } from '../datos/formato';

const CLAVE = 'ti-turnos-reservados';

/** Identifica un turno sin depender del reservaId: un profesional, una franja. */
function huellaTurno(turno: TurnoGuardado): string {
  return `${turno.servicioId}|${turno.profesionalId}|${turno.inicio}`;
}

/**
 * Turnos ya confirmados en este navegador. Se guardan en localStorage para que
 * la franja reservada deje de ofrecerse aunque el usuario recargue o vuelva
 * otro día: la demo no tiene backend, así que este es el "calendario ocupado".
 */
@Injectable({ providedIn: 'root' })
export class AgendaGuardada {
  private readonly turnos = signal<TurnoGuardado[]>(this.leer());

  constructor() {
    // Si el paciente dejó otra pestaña abierta y reservó ahí, esa franja tiene
    // que aparecer ocupada acá también: el evento `storage` solo llega a las
    // demás pestañas, que es justo lo que queremos.
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (evento) => {
        if (evento.key === CLAVE) {
          this.sincronizar();
        }
      });
    }
  }

  /**
   * Relee lo guardado antes de una decisión que no admite error. El evento
   * `storage` cubre las pestañas abiertas, pero no lo que se escribió mientras
   * esta pestaña estaba dormida.
   *
   * Fusiona en vez de reemplazar: si el navegador no deja escribir (modo
   * privado, cuota llena) la agenda vive solo en memoria y releer la borraría.
   */
  sincronizar(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const guardados = this.leer();
    const conocidos = new Set(guardados.map(huellaTurno));
    const soloEnMemoria = this.turnos().filter((t) => !conocidos.has(huellaTurno(t)));
    this.turnos.set(soloEnMemoria.length ? [...guardados, ...soloEnMemoria] : guardados);
  }

  /** Rangos ocupados de un profesional (los turnos ya vencidos no cuentan). */
  ocupadosDe(profesionalId: string): Intervalo[] {
    return this.turnos()
      .filter((t) => t.profesionalId === profesionalId)
      .map((t) => ({ inicio: t.inicio, fin: t.inicio + t.duracionMin * 60000 }));
  }

  /**
   * Rangos que la propia cuenta ya tiene ocupados. El paciente es un recurso
   * único: no puede estar en dos turnos a la vez, ni siquiera con
   * profesionales distintos. Sin sesión no hay identidad y devuelve vacío.
   */
  ocupadosDePaciente(email: string | undefined): Intervalo[] {
    if (!email) {
      return [];
    }
    const buscado = email.trim().toLowerCase();
    return this.turnos()
      .filter((t) => t.email === buscado)
      .map((t) => ({ inicio: t.inicio, fin: t.inicio + t.duracionMin * 60000 }));
  }

  /** Turnos de una cuenta, del más próximo al más lejano. */
  turnosDe(email: string): TurnoGuardado[] {
    const buscado = email.trim().toLowerCase();
    return this.turnos()
      .filter((t) => t.email === buscado)
      .sort((a, b) => a.inicio - b.inicio);
  }

  guardar(turno: TurnoGuardado): void {
    this.guardarVarios([turno]);
  }

  /**
   * Guarda todos los turnos de una visita de una sola vez: una escritura y un
   * solo update de la señal, así nunca queda una reserva múltiple a medias.
   */
  guardarVarios(turnos: TurnoGuardado[]): void {
    if (!turnos.length) {
      return;
    }
    const lista = [...this.turnos(), ...turnos];
    this.turnos.set(lista);
    this.escribir(lista);
  }

  /**
   * Pasa los turnos de una visita a una cuenta. Se usa cuando alguien reserva
   * como invitado y crea la cuenta recién en la pantalla de confirmación: sin
   * esto, ese turno nunca aparecería en "Mis turnos".
   */
  asignarCuenta(reservaId: string, email: string): void {
    const buscado = email.trim().toLowerCase();
    const lista = this.turnos();
    if (!lista.some((t) => t.reservaId === reservaId && t.email !== buscado)) {
      return;
    }
    const actualizada = lista.map((t) =>
      t.reservaId === reservaId ? { ...t, email: buscado } : t,
    );
    this.turnos.set(actualizada);
    this.escribir(actualizada);
  }

  /** Solo para pruebas manuales: limpia la agenda del navegador. */
  vaciar(): void {
    this.turnos.set([]);
    this.escribir([]);
  }

  private leer(): TurnoGuardado[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const crudo = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
      if (!Array.isArray(crudo)) {
        return [];
      }
      // Descarta lo que no tenga la forma esperada y lo muy viejo (más de un
      // año), así un localStorage manipulado no rompe la disponibilidad. Los
      // turnos ya pasados se conservan: son el historial de "Mis turnos".
      const desde = inicioDelDia(new Date()).getTime() - 365 * 24 * 60 * 60 * 1000;
      const vigentes = crudo.filter(
        (t): t is TurnoGuardado =>
          !!t &&
          typeof t.profesionalId === 'string' &&
          typeof t.inicio === 'number' &&
          typeof t.duracionMin === 'number' &&
          t.inicio >= desde,
      );
      if (vigentes.length !== crudo.length) {
        this.escribir(vigentes);
      }
      return vigentes;
    } catch {
      return [];
    }
  }

  private escribir(lista: TurnoGuardado[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lista));
    } catch {
      // Modo privado o cuota llena: la reserva sigue funcionando en memoria.
    }
  }
}
