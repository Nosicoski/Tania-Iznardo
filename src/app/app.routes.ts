import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { ReservaStore } from './servicios/reserva-store';
import { SeleccionServicio } from './paginas/seleccion-servicio';
import { Agendar } from './paginas/agendar';
import { DatosContacto } from './paginas/datos-contacto';
import { Confirmado } from './paginas/confirmado';
import { MisTurnos } from './paginas/mis-turnos';

const conServicio: CanActivateFn = () =>
  inject(ReservaStore).hayServicio() ? true : inject(Router).createUrlTree(['/servicio']);

/** El paso de datos necesita el turno completo: servicio, horario y profesional. */
const conTurnoCompleto: CanActivateFn = () => {
  const store = inject(ReservaStore);
  const router = inject(Router);
  if (!store.hayServicio()) {
    return router.createUrlTree(['/servicio']);
  }
  return store.listaParaDatos() ? true : router.createUrlTree(['/agendar']);
};

const conReservaConfirmada: CanActivateFn = () =>
  inject(ReservaStore).confirmada()
    ? true
    : inject(Router).createUrlTree(['/servicio']);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'servicio' },
  {
    path: 'servicio',
    component: SeleccionServicio,
    title: 'Elegí tu servicio · Tania Iznardo Osteopatía',
  },
  {
    path: 'agendar',
    component: Agendar,
    canActivate: [conServicio],
    title: 'Elegí día y horario · Tania Iznardo Osteopatía',
  },
  {
    path: 'datos',
    component: DatosContacto,
    canActivate: [conTurnoCompleto],
    title: 'Tus datos · Tania Iznardo Osteopatía',
  },
  {
    path: 'mis-turnos',
    component: MisTurnos,
    title: 'Mis turnos · Tania Iznardo Osteopatía',
  },
  {
    path: 'confirmado',
    component: Confirmado,
    canActivate: [conReservaConfirmada],
    title: 'Turno confirmado · Tania Iznardo Osteopatía',
  },
  { path: '**', redirectTo: 'servicio' },
];
