import { Routes } from '@angular/router';
import { rutasDeReserva } from './rutas-reserva';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'servicio' },
  ...rutasDeReserva('Tania Iznardo Osteopatía'),
  {
    // Landing de muestra con el mismo reservador embebido. No se enlaza desde
    // ninguna pantalla del flujo: se entra por el menú de la cuenta.
    path: 'webp',
    loadChildren: () => import('./webp/webp.routes').then((m) => m.rutasWebp),
  },
  { path: '**', redirectTo: 'servicio' },
];
