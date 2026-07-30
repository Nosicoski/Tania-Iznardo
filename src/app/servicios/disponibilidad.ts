import { Injectable, inject } from '@angular/core';
import { Horarios, Intervalo, Profesional } from '../modelos';
import { conHora, inicioDelDia } from '../datos/formato';
import { AgendaGuardada } from './agenda-guardada';

const MANANA = ['9:00', '10:00', '11:00', '12:00'];
const TARDE = ['15:00', '16:30', '17:15', '18:00', '19:00'];

/**
 * Disponibilidad simulada para la demo. Cada profesional tiene sus días de
 * atención (`Profesional.dias`) y una agenda propia generada de forma
 * determinística según la fecha, así dos profesionales nunca muestran los
 * mismos huecos. A eso se le restan los turnos ya reservados en este navegador.
 */
@Injectable({ providedIn: 'root' })
export class Disponibilidad {
  private readonly agenda = inject(AgendaGuardada);

  esLaborable(fecha: Date): boolean {
    const dia = fecha.getDay();
    return dia >= 1 && dia <= 5;
  }

  /** Día hábil que todavía no pasó. */
  esReservable(fecha: Date): boolean {
    return this.esLaborable(fecha) && inicioDelDia(fecha) >= inicioDelDia(new Date());
  }

  /** ¿Este profesional trabaja ese día? */
  atiende(profesional: Profesional, fecha: Date): boolean {
    return this.esReservable(fecha) && profesional.dias.includes(fecha.getDay());
  }

  /**
   * Horarios libres de un profesional para un servicio de `duracionMin`: su
   * agenda del día menos los turnos que ya tiene reservados.
   */
  horariosDe(profesional: Profesional, fecha: Date, duracionMin: number): Horarios {
    if (!this.atiende(profesional, fecha)) {
      return { manana: [], tarde: [] };
    }
    const ocupados = this.agenda.ocupadosDe(profesional.id);
    const libre = (hora: string, indice: number) =>
      !this.ocupadoEnAgenda(profesional, fecha, indice) &&
      this.entra(fecha, hora, duracionMin, ocupados);
    return {
      manana: MANANA.filter((h, i) => libre(h, i)),
      tarde: TARDE.filter((h, i) => libre(h, i + MANANA.length)),
    };
  }

  /**
   * Horarios que ofrece el día combinando a todos los candidatos. Con un solo
   * profesional elegido son sus horarios; con "Cualquiera disponible", la
   * unión de los de todo el equipo que atiende el servicio.
   */
  horariosPara(candidatos: Profesional[], fecha: Date, duracionMin: number): Horarios {
    const manana = new Set<string>();
    const tarde = new Set<string>();
    for (const profesional of candidatos) {
      const horarios = this.horariosDe(profesional, fecha, duracionMin);
      horarios.manana.forEach((h) => manana.add(h));
      horarios.tarde.forEach((h) => tarde.add(h));
    }
    return {
      manana: MANANA.filter((h) => manana.has(h)),
      tarde: TARDE.filter((h) => tarde.has(h)),
    };
  }

  /** ¿El día tiene al menos un horario? (punto debajo del número del calendario). */
  tieneCupo(candidatos: Profesional[], fecha: Date, duracionMin: number): boolean {
    if (!this.esReservable(fecha)) {
      return false;
    }
    const { manana, tarde } = this.horariosPara(candidatos, fecha, duracionMin);
    return manana.length > 0 || tarde.length > 0;
  }

  /**
   * Primer candidato con esa franja libre. Se usa cuando el usuario eligió
   * "Cualquiera disponible": la asignación se resuelve al tocar el horario.
   */
  primeroLibre(
    candidatos: Profesional[],
    fecha: Date,
    hora: string,
    duracionMin: number
  ): Profesional | null {
    return (
      candidatos.find((p) => {
        const { manana, tarde } = this.horariosDe(p, fecha, duracionMin);
        return manana.includes(hora) || tarde.includes(hora);
      }) ?? null
    );
  }

  /** Hueco ya tomado en la agenda simulada del profesional (sin backend). */
  private ocupadoEnAgenda(profesional: Profesional, fecha: Date, indice: number): boolean {
    const semilla =
      fecha.getFullYear() * 10000 + (fecha.getMonth() + 1) * 100 + fecha.getDate();
    const propio = [...profesional.id].reduce((total, c) => total + c.charCodeAt(0), 0);
    return ((semilla * 31 + indice * 17 + propio * 13) % 7) < 2;
  }

  private entra(
    fecha: Date,
    hora: string,
    duracionMin: number,
    ocupados: Intervalo[]
  ): boolean {
    const inicio = conHora(fecha, hora).getTime();
    const fin = inicio + duracionMin * 60000;
    if (inicio < Date.now()) {
      return false;
    }
    return !ocupados.some((o) => inicio < o.fin && fin > o.inicio);
  }
}
