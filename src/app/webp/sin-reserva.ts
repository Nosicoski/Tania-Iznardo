import { Component } from '@angular/core';

/**
 * Estado "modal cerrado" de la landing: la ruta `/webp` a secas.
 *
 * No pinta nada a propósito. Existe para que el `router-outlet` de la landing
 * siempre tenga algo activo y el modal se abra y cierre navegando, en vez de
 * con un booleano suelto.
 */
@Component({
  selector: 'webp-sin-reserva',
  template: '',
})
export class SinReserva {}
