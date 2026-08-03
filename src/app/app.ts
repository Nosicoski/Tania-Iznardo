import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Encabezado } from './componentes/encabezado';
import { ModalCuenta } from './componentes/modal-cuenta';
import { NavegacionReserva } from './servicios/navegacion-reserva';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Encabezado, ModalCuenta],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** Embebido en un sitio ajeno, la cabecera de la app no va: la pone el sitio. */
  protected readonly navegacion = inject(NavegacionReserva);
}
