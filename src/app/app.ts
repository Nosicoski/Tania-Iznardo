import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Encabezado } from './componentes/encabezado';
import { CONSULTORIO } from './datos/catalogo';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Encabezado],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly consultorio = CONSULTORIO;
}
