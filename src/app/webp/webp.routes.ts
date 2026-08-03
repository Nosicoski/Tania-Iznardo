import { Routes } from '@angular/router';
import { rutasDeReserva } from '../rutas-reserva';
import { MARCA } from './marca';
import { SinReserva } from './sin-reserva';
import { Webp } from './webp';

const MARCA_COMPLETA = `${MARCA.nombre} · ${MARCA.apellido}`;

/**
 * La landing y, colgando de ella, el mismo flujo de reserva de la aplicación.
 * Las pantallas son idénticas: lo único que cambia es dónde se pintan (el modal
 * de la landing) y el título de la pestaña.
 */
export const rutasWebp: Routes = [
  {
    path: '',
    component: Webp,
    children: [
      { path: '', pathMatch: 'full', component: SinReserva, title: MARCA_COMPLETA },
      ...rutasDeReserva(MARCA_COMPLETA),
      { path: '**', redirectTo: '' },
    ],
  },
];
