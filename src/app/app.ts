import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Encabezado } from './componentes/encabezado';
import { CONSULTORIO } from './datos/catalogo';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Encabezado],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  protected readonly consultorio = CONSULTORIO;

  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** En el paso 1 el perfil ya identifica el negocio: ahí ocultamos el header. */
  protected readonly mostrarHeader = computed(
    () => !this.urlActual().startsWith('/servicio')
  );
}
