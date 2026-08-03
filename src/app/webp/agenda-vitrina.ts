import { Injectable, computed, inject } from '@angular/core';
import { Servicio } from '../modelos';
import { SERVICIOS } from '../datos/catalogo';
import { inicioDelDia, sumarDias } from '../datos/formato';
import { Disponibilidad } from '../servicios/disponibilidad';
import { ReservaStore } from '../servicios/reserva-store';
import { VIDRIERA } from './marca';

/** Un turno concreto que la vitrina ofrece: día + hora de inicio. */
export interface Hueco {
  fecha: Date;
  hora: string;
}

/** Hasta cuántos días hacia adelante se busca antes de rendirse. */
const VENTANA_DIAS = 21;

/**
 * Los turnos que la landing muestra como "próximos disponibles".
 *
 * No son un adorno: salen de la misma `Disponibilidad` que usa el calendario
 * del reservador, así que descuentan la agenda de cada profesional y los turnos
 * ya confirmados. Si alguien reserva el martes a las 10:30, esa franja deja de
 * aparecer en la vitrina sola, sin recargar: `Disponibilidad` lee la señal de
 * turnos guardados y estos `computed` se recalculan solos.
 */
@Injectable({ providedIn: 'root' })
export class AgendaVitrina {
  private readonly disponibilidad = inject(Disponibilidad);
  private readonly store = inject(ReservaStore);

  /** Servicio con el que se cotiza cada categoría: el primero del catálogo. */
  servicioDe(categoria: string): Servicio | null {
    return SERVICIOS.find((s) => s.categoria === categoria) ?? null;
  }

  /**
   * Próximos inicios libres para ese servicio, uno por día para que la vitrina
   * muestre variedad y no cuatro horarios pegados de la misma mañana.
   */
  proximos(servicio: Servicio, cantidad = 3): Hueco[] {
    const consulta = {
      servicios: [servicio],
      preferidos: {},
      ordenFijo: false,
      email: this.store.emailPaciente() ?? undefined,
    };
    const huecos: Hueco[] = [];
    const hoy = inicioDelDia(new Date());
    for (let dia = 0; dia < VENTANA_DIAS && huecos.length < cantidad; dia++) {
      const fecha = sumarDias(hoy, dia);
      if (!this.disponibilidad.esReservable(fecha)) {
        continue;
      }
      const { manana, tarde } = this.disponibilidad.horariosPara(consulta, fecha);
      const horas = [...manana, ...tarde];
      if (!horas.length) {
        continue;
      }
      // Se va corriendo el índice día a día: el primer día ofrece un horario
      // temprano, el siguiente uno más tarde. Nunca son las 9:00 tres veces.
      huecos.push({ fecha, hora: horas[(huecos.length * 3 + 1) % horas.length] });
    }
    return huecos;
  }

  /** El turno libre más cercano de todo el catálogo, para la píldora del hero. */
  readonly proximoLibre = computed<{ servicio: Servicio; hueco: Hueco } | null>(() => {
    let mejor: { servicio: Servicio; hueco: Hueco } | null = null;
    for (const tarjeta of VIDRIERA) {
      const servicio = this.servicioDe(tarjeta.categoria);
      const [hueco] = servicio ? this.proximos(servicio, 1) : [];
      if (servicio && hueco && (!mejor || cuando(hueco) < cuando(mejor.hueco))) {
        mejor = { servicio, hueco };
      }
    }
    return mejor;
  });
}

function cuando(hueco: Hueco): number {
  const [hora, minuto] = hueco.hora.split(':').map(Number);
  return inicioDelDia(hueco.fecha).getTime() + (hora * 60 + minuto) * 60000;
}
