import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { ReservaStore } from './servicios/reserva-store';
import { SeleccionServicio } from './paginas/seleccion-servicio';
import { FechaHora } from './paginas/fecha-hora';
import { DatosContacto } from './paginas/datos-contacto';
import { Confirmado } from './paginas/confirmado';

const conServicio: CanActivateFn = () =>
  inject(ReservaStore).servicio() ? true : inject(Router).createUrlTree(['/servicio']);

const conFechaYHora: CanActivateFn = () =>
  inject(ReservaStore).listaParaConfirmar()
    ? true
    : inject(Router).createUrlTree(['/servicio']);

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
    path: 'fecha-hora',
    component: FechaHora,
    canActivate: [conServicio],
    title: 'Fecha y hora · Tania Iznardo Osteopatía',
  },
  {
    path: 'datos',
    component: DatosContacto,
    canActivate: [conFechaYHora],
    title: 'Tus datos · Tania Iznardo Osteopatía',
  },
  {
    path: 'confirmado',
    component: Confirmado,
    canActivate: [conReservaConfirmada],
    title: 'Turno confirmado · Tania Iznardo Osteopatía',
  },
  { path: '**', redirectTo: 'servicio' },
];
