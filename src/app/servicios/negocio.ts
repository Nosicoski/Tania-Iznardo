import { Injectable, computed, inject } from '@angular/core';
import { CONSULTORIO, FichaNegocio, NEGOCIO_DEMO } from '../datos/negocios';
import { NavegacionReserva } from './navegacion-reserva';

/**
 * De quién es la agenda que se está reservando.
 *
 * Embebido en el sitio de un negocio, la dirección y los horarios que ve el
 * paciente tienen que ser los de ese negocio, no los del consultorio. Es la
 * única pieza que hace falta para que el mismo flujo sirva a más de uno; el día
 * que haya backend, esto pasa a leer el negocio de la URL o del token en vez de
 * elegir entre dos fichas escritas a mano.
 */
@Injectable({ providedIn: 'root' })
export class Negocio {
  private readonly navegacion = inject(NavegacionReserva);

  readonly datos = computed<FichaNegocio>(() =>
    this.navegacion.embebido() ? NEGOCIO_DEMO : CONSULTORIO,
  );
}
