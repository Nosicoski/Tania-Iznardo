import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { FichaProfesional } from '../componentes/ficha-profesional';
import { ReservaStore } from '../servicios/reserva-store';
import { profesionalesPara } from '../datos/profesionales';
import { fechaLarga } from '../datos/formato';
import { Profesional } from '../modelos';

/**
 * Paso 2: un profesional por turno. Se recorren los turnos igual que en el
 * paso de fecha y hora ("Servicio 1 de 2"), ofreciendo en cada uno a quienes
 * atienden la categoría de ese servicio.
 */
@Component({
  selector: 'app-seleccion-profesional',
  imports: [Stepper, ResumenReserva, FichaProfesional],
  template: `
    <app-stepper [paso]="2" />
    <div class="contenedor">
      @if (turno(); as t) {
        <button type="button" class="volver" (click)="volver()">
          <span aria-hidden="true">←</span> Volver
        </button>

        @if (total() > 1) {
          <p class="contador">Servicio {{ t.numero }} de {{ total() }}</p>
        }
        <h1>Elegí tu profesional</h1>
        <p class="ayuda">
          {{ t.servicio.nombre }} · {{ fecha(t.fecha!) }} a las {{ t.hora }} hs.
        </p>

        <div class="disposicion">
          <section class="tarjeta">
            <div class="equipo">
              @for (p of disponibles(); track p.id) {
                <button
                  type="button"
                  class="opcion"
                  [class.elegida]="p.id === t.profesional?.id"
                  [attr.aria-pressed]="p.id === t.profesional?.id"
                  (click)="elegir(p)"
                >
                  @if (p.id === t.profesional?.id) {
                    <span class="tilde" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                        <path
                          d="M3 8.5 6.5 12 13 4.5"
                          stroke="currentColor"
                          stroke-width="2.4"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  }
                  <app-ficha-profesional [prof]="p" [grande]="true" [mostrarMatricula]="true" />
                  <span class="atiende">{{ p.especialidades.join(' · ') }}</span>
                </button>
              }
            </div>

            @if (t.profesional) {
              <button type="button" class="btn btn-primario continuar" (click)="continuar()">
                {{ esUltimo() ? 'Continuar' : 'Continuar con el siguiente servicio' }}
              </button>
            }
          </section>

          <app-resumen-reserva
            [cta]="t.profesional ? 'Continuar' : null"
            (ctaClick)="continuar()"
          />
        </div>
      }
    </div>
  `,
  styles: `
    .volver {
      background: none;
      border: none;
      padding: 0;
      color: var(--neutro);
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    .volver:hover {
      color: var(--primario);
    }
    .contador {
      margin: 0 0 0.35rem;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--primario);
    }
    .ayuda {
      margin: 0.35rem 0 1.25rem;
      color: var(--neutro);
      font-size: 0.9rem;
    }
    .disposicion {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
      align-items: start;
    }
    .tarjeta {
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio);
      box-shadow: var(--sombra);
      padding: 1.5rem;
    }
    .equipo {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }
    /* Card con el mismo diseño de globos que la lista de profesionales */
    .opcion {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      background: var(--blanco);
      border: 1.5px solid var(--borde);
      border-radius: var(--radio);
      padding: 1.1rem 0.75rem;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .opcion:hover {
      border-color: var(--primario);
    }
    .opcion.elegida {
      border-color: var(--primario);
      background: var(--primario-suave);
      box-shadow: 0 4px 14px rgba(52, 129, 126, 0.14);
    }
    .tilde {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
    }
    .atiende {
      font-size: 0.72rem;
      color: var(--neutro);
      text-align: center;
      line-height: 1.3;
    }
    .continuar {
      width: 100%;
      margin-top: 1.5rem;
    }

    @media (max-width: 900px) {
      .disposicion {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 720px) {
      .tarjeta {
        padding: 1.1rem 0.9rem;
      }
      .equipo {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      }
    }
  `,
})
export class SeleccionProfesional {
  protected readonly store = inject(ReservaStore);
  private readonly router = inject(Router);
  protected readonly fecha = fechaLarga;

  protected readonly turno = this.store.turnoActual;
  protected readonly total = this.store.cantidadTurnos;
  protected readonly esUltimo = computed(
    () => this.store.indiceActual() === this.total() - 1
  );
  /** Profesionales que atienden la categoría del servicio de este turno. */
  protected readonly disponibles = computed(() => {
    const categoria = this.turno()?.servicio.categoria;
    return profesionalesPara(categoria ? [categoria] : []);
  });

  constructor() {
    this.store.irAlPrimerSinProfesional();
  }

  protected elegir(profesional: Profesional): void {
    const t = this.turno();
    if (t) {
      this.store.asignarProfesional(t.id, profesional);
    }
  }

  protected volver(): void {
    if (this.store.indiceActual() > 0) {
      this.store.irAlTurno(this.store.indiceActual() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    this.router.navigate(['/fecha-hora']);
  }

  protected continuar(): void {
    if (this.esUltimo()) {
      if (this.store.profesionalesListos()) {
        this.router.navigate(['/datos']);
      }
      return;
    }
    this.store.irAlTurno(this.store.indiceActual() + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
