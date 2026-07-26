import { Injectable } from '@angular/core';
import { Horarios, Intervalo } from '../modelos';
import { conHora, inicioDelDia } from '../datos/formato';

const MANANA = ['9:00', '10:00', '11:00', '12:00'];
const TARDE = ['15:00', '16:30', '17:15', '18:00', '19:00'];

/**
 * Disponibilidad simulada para la demo: el consultorio atiende de lunes a
 * viernes y algunos horarios figuran como "ocupados" de forma determinística
 * según la fecha, para que cada día muestre una agenda distinta.
 */
@Injectable({ providedIn: 'root' })
export class Disponibilidad {
  esLaborable(fecha: Date): boolean {
    const dia = fecha.getDay();
    return dia >= 1 && dia <= 5;
  }

  esReservable(fecha: Date): boolean {
    return this.esLaborable(fecha) && inicioDelDia(fecha) >= inicioDelDia(new Date());
  }

  horariosPara(fecha: Date): Horarios {
    if (!this.esReservable(fecha)) {
      return { manana: [], tarde: [] };
    }
    const semilla =
      fecha.getFullYear() * 10000 + (fecha.getMonth() + 1) * 100 + fecha.getDate();
    const ocupado = (indice: number) => ((semilla * 31 + indice * 17) % 7) < 2;
    return {
      manana: MANANA.filter((_, i) => !ocupado(i)),
      tarde: TARDE.filter((_, i) => !ocupado(i + MANANA.length)),
    };
  }

  /**
   * Horarios de la agenda menos los que se pisarían con los turnos que el
   * usuario ya eligió: un servicio de 60 min a las 15:00 bloquea todo el rango
   * 15:00–16:00, no solo el horario exacto.
   */
  horariosLibres(fecha: Date, duracionMin: number, ocupados: Intervalo[]): Horarios {
    const agenda = this.horariosPara(fecha);
    const libre = (hora: string) => this.entra(fecha, hora, duracionMin, ocupados);
    return {
      manana: agenda.manana.filter(libre),
      tarde: agenda.tarde.filter(libre),
    };
  }

  /** ¿El día tiene al menos un horario compatible? (punto debajo del número). */
  tieneCupo(fecha: Date, duracionMin: number, ocupados: Intervalo[]): boolean {
    if (!this.esReservable(fecha)) {
      return false;
    }
    const { manana, tarde } = this.horariosLibres(fecha, duracionMin, ocupados);
    return manana.length > 0 || tarde.length > 0;
  }

  private entra(
    fecha: Date,
    hora: string,
    duracionMin: number,
    ocupados: Intervalo[]
  ): boolean {
    const inicio = conHora(fecha, hora).getTime();
    const fin = inicio + duracionMin * 60000;
    return !ocupados.some((o) => inicio < o.fin && fin > o.inicio);
  }
}
