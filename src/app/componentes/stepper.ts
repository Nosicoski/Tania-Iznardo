import { Component, input } from '@angular/core';

const PASOS = [
  { numero: 1, etiqueta: 'Servicio' },
  { numero: 2, etiqueta: 'Fecha y hora' },
  { numero: 3, etiqueta: 'Datos de contacto' },
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
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 1.5rem 1rem;
    }
    .paso {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--neutro-claro);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .circulo {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1.5px solid currentColor;
      display: grid;
      place-items: center;
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .paso.activo {
      color: var(--secundario);
    }
    .paso.activo .circulo {
      background: var(--primario);
      border-color: var(--primario);
      color: var(--blanco);
    }
    .paso.hecho {
      color: var(--primario);
    }
    .paso.hecho .circulo {
      background: var(--primario);
      border-color: var(--primario);
      color: var(--blanco);
    }
    .union {
      width: 56px;
      height: 1.5px;
      background: var(--borde);
    }
    .union.hecha {
      background: var(--primario);
    }
    @media (max-width: 720px) {
      .stepper {
        padding: 1.1rem 0.5rem;
        gap: 0.4rem;
      }
      .union {
        width: 26px;
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
