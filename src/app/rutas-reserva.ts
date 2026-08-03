import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { ReservaStore } from './servicios/reserva-store';
import { baseDe } from './servicios/navegacion-reserva';
import { SeleccionServicio } from './paginas/seleccion-servicio';
import { Agendar } from './paginas/agendar';
import { DatosContacto } from './paginas/datos-contacto';
import { Confirmado } from './paginas/confirmado';
import { MisTurnos } from './paginas/mis-turnos';
import { Cancelar } from './paginas/cancelar';

/**
 * Redirección dentro del mismo contexto: si el flujo corre embebido en la
 * landing, un guard nunca puede escupir al usuario fuera del modal.
 */
function volverA(url: string, paso: string) {
  return inject(Router).createUrlTree([`${baseDe(url)}/${paso}`]);
}

const conServicio: CanActivateFn = (_ruta, estado) =>
  inject(ReservaStore).hayServicios() ? true : volverA(estado.url, 'servicio');

/** El paso de datos necesita la visita resuelta: servicios, día y bloque. */
const conTurnoCompleto: CanActivateFn = (_ruta, estado) => {
  const store = inject(ReservaStore);
  // Con la visita ya confirmada, el "atrás" del navegador no puede volver al
  // formulario para reservarla de nuevo: se vuelve a la confirmación.
  if (store.confirmada()) {
    return volverA(estado.url, 'confirmado');
  }
  if (!store.hayServicios()) {
    return volverA(estado.url, 'servicio');
  }
  return store.listaParaDatos() ? true : volverA(estado.url, 'agendar');
};

const conReservaConfirmada: CanActivateFn = (_ruta, estado) =>
  inject(ReservaStore).confirmada() ? true : volverA(estado.url, 'servicio');

/**
 * Las pantallas del flujo de reserva. Se montan dos veces con la misma
 * definición: en la raíz (la demo suelta) y bajo `/webp` (embebidas en la
 * landing). Lo único propio de cada montaje es el nombre del negocio que va en
 * el título de la pestaña.
 */
export function rutasDeReserva(marca: string): Routes {
  const titulo = (texto: string) => `${texto} · ${marca}`;
  return [
    {
      path: 'servicio',
      component: SeleccionServicio,
      title: titulo('Elegí tu servicio'),
    },
    {
      path: 'agendar',
      component: Agendar,
      canActivate: [conServicio],
      title: titulo('Elegí día y horario'),
    },
    {
      path: 'datos',
      component: DatosContacto,
      canActivate: [conTurnoCompleto],
      title: titulo('Tus datos'),
    },
    {
      path: 'mis-turnos',
      component: MisTurnos,
      title: titulo('Mis turnos'),
    },
    {
      path: 'confirmado',
      component: Confirmado,
      canActivate: [conReservaConfirmada],
      title: titulo('Turno confirmado'),
    },
    {
      // Destino del botón "Cancelar turno" del mail de confirmación.
      path: 'cancelar',
      component: Cancelar,
      title: titulo('Turno cancelado'),
    },
  ];
}
