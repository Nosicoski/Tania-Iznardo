import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/** Prefijo bajo el que el mismo flujo de reserva corre embebido en la landing. */
export const BASE_WEBP = '/webp';

export type PasoReserva =
  | 'servicio'
  | 'agendar'
  | 'datos'
  | 'confirmado'
  | 'mis-turnos'
  | 'cancelar';

/**
 * Prefijo del flujo según la URL: '' cuando la reserva es la aplicación entera,
 * '/webp' cuando está embebida en la landing. Es lo único que distingue a los
 * dos contextos: las pantallas del flujo son exactamente las mismas.
 */
export function baseDe(url: string): string {
  const limpia = url.split(/[?#]/)[0];
  return limpia === BASE_WEBP || limpia.startsWith(`${BASE_WEBP}/`) ? BASE_WEBP : '';
}

/**
 * Navegación del flujo de reserva sin URLs escritas a mano. Las pantallas piden
 * "llevame a agendar" y esto resuelve si eso es `/agendar` o `/webp/agendar`,
 * así el mismo componente sirve dentro y fuera de la landing.
 */
@Injectable({ providedIn: 'root' })
export class NavegacionReserva {
  private readonly router = inject(Router);

  /** URL actual como señal, para lo que tenga que reaccionar al contexto. */
  readonly url = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly embebido = computed(() => baseDe(this.url()) === BASE_WEBP);

  base(): string {
    return baseDe(this.router.url);
  }

  ruta(paso: PasoReserva): string {
    return `${this.base()}/${paso}`;
  }

  ir(paso: PasoReserva): Promise<boolean> {
    return this.router.navigateByUrl(this.ruta(paso));
  }

  /**
   * Salida del flujo. Embebido eso es cerrar el modal y volver a la landing;
   * suelto, volver al catálogo, que es la portada de la aplicación.
   */
  salir(): Promise<boolean> {
    return this.router.navigateByUrl(this.base() === BASE_WEBP ? BASE_WEBP : '/servicio');
  }
}
