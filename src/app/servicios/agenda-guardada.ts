import { Injectable, signal } from '@angular/core';
import { Intervalo, TurnoGuardado } from '../modelos';
import { inicioDelDia } from '../datos/formato';

const CLAVE = 'ti-turnos-reservados';

/**
 * Turnos ya confirmados en este navegador. Se guardan en localStorage para que
 * la franja reservada deje de ofrecerse aunque el usuario recargue o vuelva
 * otro día: la demo no tiene backend, así que este es el "calendario ocupado".
 */
@Injectable({ providedIn: 'root' })
export class AgendaGuardada {
  private readonly turnos = signal<TurnoGuardado[]>(this.leer());

  /** Rangos ocupados de un profesional (los turnos ya vencidos no cuentan). */
  ocupadosDe(profesionalId: string): Intervalo[] {
    return this.turnos()
      .filter((t) => t.profesionalId === profesionalId)
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
    const lista = [...this.turnos(), turno];
    this.turnos.set(lista);
    this.escribir(lista);
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
          t.inicio >= desde
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
