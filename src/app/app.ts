import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Encabezado } from './componentes/encabezado';
import { ModalCuenta } from './componentes/modal-cuenta';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Encabezado, ModalCuenta],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
