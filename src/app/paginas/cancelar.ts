import { Component, inject } from '@angular/core';
import { NavegacionReserva } from '../servicios/navegacion-reserva';
import { Negocio } from '../servicios/negocio';

/**
 * Destino del botón "Cancelar turno" del mail. En la demo es solo la pantalla:
 * cancelar de verdad necesita que los turnos vivan en un backend y no en el
 * localStorage del navegador que reservó.
 */
@Component({
  selector: 'app-cancelar',
  template: `
    <div class="contenedor">
      <div class="tarjeta panel">
        <div class="icono">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">
            <path
              d="M7 7l10 10M17 7 7 17"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <h1>Turno cancelado</h1>
        <p class="subtitulo">
          Liberamos el horario y le avisamos al consultorio.<br />
          Si querés, podés reservar otro turno cuando te quede cómodo.
        </p>

        <p class="nota">
          ¿Fue un error? Escribinos y lo reprogramamos:
          <span>{{ negocio().direccion }} · {{ negocio().horario }}</span>
        </p>

        <button type="button" class="btn btn-primario" (click)="navegacion.ir('servicio')">
          Reservar otro turno
        </button>
      </div>
    </div>
  `,
  styles: `
    .contenedor {
      padding-top: 3rem;
    }
    .panel {
      max-width: 520px;
      margin: 0 auto;
      padding: 2.5rem 2rem;
      text-align: center;
    }
    .icono {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: var(--fondo);
      color: var(--neutro);
      display: grid;
      place-items: center;
      margin: 0 auto 1.25rem;
    }
    .subtitulo {
      color: var(--neutro);
      margin: 0.6rem 0 1.5rem;
      line-height: 1.6;
    }
    .nota {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      padding: 0.85rem 1rem;
      margin: 0 0 1.75rem;
      font-size: 0.84rem;
      color: var(--secundario);
    }
    .nota span {
      color: var(--neutro);
    }
    .btn {
      display: inline-block;
      text-decoration: none;
    }
  `,
})
export class Cancelar {
  protected readonly navegacion = inject(NavegacionReserva);
  /** Dueño de la agenda: el consultorio, o el negocio que embebe el flujo. */
  protected readonly negocio = inject(Negocio).datos;
}
