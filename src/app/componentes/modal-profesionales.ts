import { Component, output } from '@angular/core';
import { PROFESIONALES, categoriasDe, diasDeAtencion } from '../datos/profesionales';
import { Profesional } from '../modelos';
import { FichaProfesional } from './ficha-profesional';

/**
 * Popup con el equipo completo. Vive fuera del panel del perfil para no
 * alargarlo: ahí queda solo el acceso "Profesionales" junto al resto de los
 * datos de contacto. Comparte el diseño del popup de cuenta (velo, franja de
 * marca, cierre con Escape) y reusa `app-ficha-profesional`, así el avatar y el
 * globo de profesión se ven igual que en el resto de la app.
 */
@Component({
  selector: 'app-modal-profesionales',
  imports: [FichaProfesional],
  template: `
    <div class="fondo" (click)="cerrar.emit()">
      <div
        class="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-profes-titulo"
        (click)="$event.stopPropagation()"
      >
        <button type="button" class="cerrar" (click)="cerrar.emit()" aria-label="Cerrar">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
            <path
              d="M5.5 5.5l9 9m0-9l-9 9"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <div class="cabecera">
          <h2 id="modal-profes-titulo">Nuestros profesionales</h2>
          <p>
            {{ profesionales.length }} profesionales atienden en el consultorio. Podés elegir con
            quién te atendés al reservar.
          </p>
        </div>

        <ul class="equipo">
          @for (p of profesionales; track p.id) {
            <li class="persona">
              <app-ficha-profesional [prof]="p" [mostrarMatricula]="true" />
              <div class="detalle">
                <span class="dias">{{ dias(p) }}</span>
                <span class="areas">{{ areas(p) }}</span>
              </div>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: `
    .fondo {
      position: fixed;
      inset: 0;
      z-index: 70;
      background: rgba(22, 48, 47, 0.55);
      backdrop-filter: blur(3px);
      display: grid;
      place-items: center;
      padding: 1.25rem;
      overflow-y: auto;
      animation: aparecer 0.18s ease;
    }
    @keyframes aparecer {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .panel {
      position: relative;
      width: min(680px, 100%);
      max-height: calc(100dvh - 2.5rem);
      overflow-y: auto;
      background: var(--blanco);
      border-radius: var(--radio);
      box-shadow: 0 24px 60px rgba(22, 48, 47, 0.3);
      padding: 2rem 1.75rem 1.75rem;
      animation: subir 0.24s ease;
    }
    /* Franja de marca arriba del popup, igual que en el de cuenta */
    .panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      border-radius: var(--radio) var(--radio) 0 0;
      background: linear-gradient(90deg, var(--primario), var(--terciario));
    }
    @keyframes subir {
      from {
        transform: translateY(12px) scale(0.98);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }
    .cerrar {
      position: absolute;
      top: 0.9rem;
      right: 0.9rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: var(--fondo);
      color: var(--neutro);
      display: grid;
      place-items: center;
      transition:
        background 0.15s ease,
        color 0.15s ease;
    }
    .cerrar:hover {
      background: var(--primario-suave);
      color: var(--primario);
    }
    .cabecera {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .cabecera h2 {
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .cabecera p {
      margin: 0.4rem auto 0;
      max-width: 44ch;
      color: var(--neutro);
      font-size: 0.85rem;
    }

    /* Misma grilla flexible que usa el resto del sitio: se acomoda sola */
    .equipo {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.25rem 0.75rem;
    }
    .persona {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
    }
    .detalle {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.1rem;
      text-align: center;
      min-width: 0;
    }
    .dias {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--primario);
    }
    .areas {
      font-size: 0.72rem;
      color: var(--neutro);
      line-height: 1.35;
    }

    @media (max-width: 520px) {
      .panel {
        padding: 1.75rem 1.15rem 1.25rem;
      }
      .equipo {
        grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
      }
    }
  `,
  host: {
    '(document:keydown.escape)': 'cerrar.emit()',
  },
})
export class ModalProfesionales {
  readonly cerrar = output<void>();

  protected readonly profesionales = PROFESIONALES;

  protected dias(profesional: Profesional): string {
    return diasDeAtencion(profesional);
  }

  /** Las categorías que cubre, para saber a quién pedir sin abrir el catálogo. */
  protected areas(profesional: Profesional): string {
    return categoriasDe(profesional).join(' · ');
  }
}
