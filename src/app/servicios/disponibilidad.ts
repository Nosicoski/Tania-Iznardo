import { Injectable } from '@angular/core';
import { Horarios } from '../modelos';
import { inicioDelDia } from '../datos/formato';

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
}
