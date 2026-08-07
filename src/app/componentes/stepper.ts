import { Component, input } from '@angular/core';

/**
 * El paso 1 se completa en el catálogo, así que ya llega hecho a las pantallas
 * que muestran el stepper: sirve para ubicar al usuario en el recorrido.
 */
const PASOS = [
  { numero: 1, etiqueta: 'Servicio' },
  { numero: 2, etiqueta: 'Día y horario' },
  { numero: 3, etiqueta: 'Tus datos' },
];

@Component({
  selector: 'app-stepper',
  template: `
    <nav class="stepper" aria-label="Progreso de la reserva">
      @for (p of pasos; track p.numero; let ultimo = $last) {
        <div
          class="paso"
          [class.activo]="p.numero === paso()"
          [class.hecho]="p.numero < paso()"
        >
          <span class="circulo">
            @if (p.numero < paso()) {
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                <path
                  d="M3 8.5 6.5 12 13 4.5"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            } @else {
              {{ p.numero }}
            }
          </span>
          <span class="etiqueta">{{ p.etiqueta }}</span>
        </div>
        @if (!ultimo) {
          <span class="union" [class.hecha]="p.numero < paso()"></span>
        }
      }
    </nav>
  `,
  styles: `
    /*
     * Indicador de recorrido, no botonera: se lee de un vistazo y después
     * desaparece. De ahí el tamaño chico, las versalitas y el trazo fino —
     * antes competía en peso con el título de la pantalla.
     */
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      /* Aire suficiente abajo para que las mayúsculas de la serif del h1 que
         viene después no queden pegadas a los círculos. */
      padding: 1.75rem 1rem 1.5rem;
    }
    .paso {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--neutro-claro);
      font-size: var(--txt-2xs);
      font-weight: 700;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      transition: color var(--transicion);
    }
    .circulo {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1.5px solid currentColor;
      display: grid;
      place-items: center;
      font-size: var(--txt-2xs);
      font-weight: 700;
      letter-spacing: 0;
      flex-shrink: 0;
      transition:
        background var(--transicion),
        border-color var(--transicion),
        color var(--transicion);
    }
    /* Paso en curso: relleno pleno. Es el único punto de color de la fila. */
    .paso.activo {
      color: var(--secundario);
    }
    .paso.activo .circulo {
      background: var(--primario-fuerte);
      border-color: var(--primario-fuerte);
      color: var(--blanco);
    }
    /* Ya cumplido: solo el contorno, para que no compita con el actual. */
    .paso.hecho {
      color: var(--primario-fuerte);
    }
    .paso.hecho .circulo {
      background: transparent;
      border-color: var(--primario);
      color: var(--primario-fuerte);
    }
    .union {
      width: 44px;
      height: 1px;
      background: var(--borde);
      transition: background var(--transicion);
    }
    .union.hecha {
      background: var(--primario);
    }
    @media (max-width: 720px) {
      .stepper {
        padding: 1.25rem 0.5rem 1.15rem;
        gap: 0.5rem;
      }
      .union {
        width: 24px;
      }
      .paso:not(.activo) .etiqueta {
        display: none;
      }
    }
  `,
})
export class Stepper {
  readonly paso = input.required<number>();
  protected readonly pasos = PASOS;
}
