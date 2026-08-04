import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Servicio } from '../modelos';
import { Disponibilidad } from '../servicios/disponibilidad';
import { ReservaStore } from '../servicios/reserva-store';
import { BASE_WEBP } from '../servicios/navegacion-reserva';
import { Hueco } from './agenda-vitrina';

/**
 * El puente entre la landing y el reservador. Todo lo que abre el modal pasa
 * por acá, y siempre termina en una URL de `/webp/...`: el modal está atado a
 * la ruta, no a un booleano, así el botón de atrás del navegador y el enlace
 * compartido siguen funcionando dentro del flujo.
 */
@Injectable({ providedIn: 'root' })
export class ReservaEmbebida {
  private readonly router = inject(Router);
  private readonly store = inject(ReservaStore);
  private readonly disponibilidad = inject(Disponibilidad);

  /** Abre el catálogo. Con categoría, ya desplegada en ese grupo. */
  abrirCatalogo(categoria?: string): void {
    this.router.navigate([BASE_WEBP, 'servicio'], {
      queryParams: categoria ? { cat: categoria } : {},
    });
  }

  /**
   * Reserva en un clic desde la vitrina: elige el servicio, el día y la hora, y
   * deja al visitante directamente en el formulario de contacto.
   *
   * El horario que muestra la tarjeta se calculó hace unos segundos; entre
   * medio pudo ocuparse. Si al resolver el plan ya no entra, en vez de fallar
   * se lo deja en el calendario con el servicio y el día puestos.
   */
  abrirTurno(servicio: Servicio, hueco: Hueco): void {
    this.store.reiniciar();
    this.store.elegirServicio(servicio);
    this.store.elegirFecha(hueco.fecha);
    const plan = this.disponibilidad.planDe(this.store.consulta(), hueco.fecha, hueco.hora);
    if (!plan) {
      this.router.navigate([BASE_WEBP, 'agendar']);
      return;
    }
    this.store.elegirBloque(hueco.hora, plan);
    this.router.navigate([BASE_WEBP, 'datos']);
  }

  irAMisTurnos(): void {
    this.router.navigate([BASE_WEBP, 'mis-turnos']);
  }

  /** Cierra el modal: vuelve a la landing sola. */
  cerrar(): void {
    this.router.navigateByUrl(BASE_WEBP);
  }
}
