import { Component, computed, effect, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { CalendarioMes } from '../componentes/calendario-mes';
import { ReservaStore } from '../servicios/reserva-store';
import { Disponibilidad } from '../servicios/disponibilidad';

@Component({
  selector: 'app-fecha-hora',
  imports: [Stepper, ResumenReserva, CalendarioMes],
  template: `
    <app-stepper [paso]="1" />
    <div class="contenedor">
      @if (turno(); as t) {
        <button type="button" class="volver" (click)="volver()">
          <span aria-hidden="true">←</span> Volver
        </button>

        @if (total() > 1) {
          <p class="contador">Servicio {{ t.numero }} de {{ total() }}</p>
        }
        <h1>{{ t.servicio.nombre }}</h1>
        <p class="ayuda">
          {{ t.servicio.duracionMin }} min · elegí el día y el horario para este servicio.
        </p>

        <div class="disposicion">
          <section class="tarjeta calendario">
            <app-calendario-mes
              [seleccionada]="t.fecha"
              [disponible]="hayCupo"
              (elegir)="elegirDia($event)"
            />

            @if (t.fecha) {
              @if (horarios(); as h) {
                @if (h.manana.length || h.tarde.length) {
                  @if (h.manana.length) {
                    <h4 class="franja">Mañana</h4>
                    <div class="horarios">
                      @for (hora of h.manana; track hora) {
                        <button
                          type="button"
                          class="hora"
                          [class.elegida]="hora === t.hora"
                          (click)="elegirHora(hora)"
                        >
                          {{ hora }}
                        </button>
                      }
                    </div>
                  }
                  @if (h.tarde.length) {
                    <h4 class="franja">Tarde</h4>
                    <div class="horarios">
                      @for (hora of h.tarde; track hora) {
                        <button
                          type="button"
                          class="hora"
                          [class.elegida]="hora === t.hora"
                          (click)="elegirHora(hora)"
                        >
                          {{ hora }}
                        </button>
                      }
                    </div>
                  }
                  @if (hayOtrosTurnos()) {
                    <div class="aviso">
                      No mostramos los horarios que se superponen con los otros turnos
                      de esta reserva.
                    </div>
                  } @else {
                    <div class="aviso">
                      ⚠ Los horarios podrían agotarse, ¡reservá lo antes posible!
                    </div>
                  }
                } @else {
                  <p class="sin-horarios">
                    @if (hayOtrosTurnos()) {
                      No quedan horarios libres este día que no se superpongan con tus
                      otros turnos. Probá con otra fecha.
                    } @else {
                      No quedan horarios disponibles para este día. Probá con otra fecha.
                    }
                  </p>
                }
              }
            } @else {
              <p class="sin-horarios">Elegí un día para ver los horarios disponibles.</p>
            }

            @if (t.hora) {
              <button type="button" class="btn btn-primario continuar" (click)="continuar()">
                {{ esUltimo() ? 'Continuar' : 'Continuar con el siguiente servicio' }}
              </button>
            }
          </section>

          <app-resumen-reserva
            [cta]="t.hora ? 'Continuar' : null"
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
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
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
      color: var(--neutro);
    }
    .ayuda {
      color: var(--neutro);
      margin: 0.4rem 0 0;
      font-size: 0.9rem;
    }
    .disposicion {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
      align-items: start;
      margin-top: 1.25rem;
    }
    .calendario {
      padding: 1.5rem;
    }
    .franja {
      margin: 1.4rem 0 0.6rem;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--neutro);
      border-top: 1px solid var(--borde);
      padding-top: 1.1rem;
    }
    .horarios {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .hora {
      border: 1.5px solid var(--borde);
      background: var(--blanco);
      border-radius: 999px;
      padding: 0.5rem 1.15rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--secundario);
    }
    .hora:hover {
      border-color: var(--primario);
    }
    .hora.elegida {
      background: var(--primario);
      border-color: var(--primario);
      color: var(--blanco);
    }
    .aviso {
      margin-top: 1.25rem;
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      border-radius: var(--radio-chico);
      padding: 0.7rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .sin-horarios {
      color: var(--neutro);
      margin: 1.5rem 0 0;
      border-top: 1px solid var(--borde);
      padding-top: 1.25rem;
    }
    .continuar {
      width: 100%;
      margin-top: 1.5rem;
    }
    @media (max-width: 720px) {
      .disposicion {
        display: block;
      }
      .calendario {
        padding: 1rem;
      }
      /* En mobile el botón vive en la barra fija "Tu reserva". */
      .continuar {
        display: none;
      }
    }
  `,
})
export class FechaHora {
  private readonly router = inject(Router);
  protected readonly store = inject(ReservaStore);
  private readonly disponibilidad = inject(Disponibilidad);
  private readonly calendario = viewChild(CalendarioMes);

  protected readonly turno = this.store.turnoActual;
  protected readonly total = this.store.cantidadTurnos;
  protected readonly esUltimo = computed(
    () => this.store.indiceActual() === this.total() - 1
  );

  /** Rangos de los demás turnos de la reserva, que este turno no puede pisar. */
  private readonly ocupados = computed(() => this.store.ocupados(this.turno()?.id));
  protected readonly hayOtrosTurnos = computed(() => this.ocupados().length > 0);

  protected readonly horarios = computed(() => {
    const t = this.turno();
    if (!t?.fecha) {
      return null;
    }
    return this.disponibilidad.horariosLibres(
      t.fecha,
      t.servicio.duracionMin,
      this.ocupados()
    );
  });

  /** Se evalúa dentro del computed del calendario, por eso lee los signals ahí. */
  protected readonly hayCupo = (fecha: Date): boolean => {
    const t = this.turno();
    return (
      !!t && this.disponibilidad.tieneCupo(fecha, t.servicio.duracionMin, this.ocupados())
    );
  };

  constructor() {
    this.store.irAlPrimerPendiente();
    // Al cambiar de turno, mostrar el mes del día ya elegido (si lo hay).
    effect(() => {
      const fecha = this.turno()?.fecha;
      if (fecha) {
        this.calendario()?.mostrarMesDe(fecha);
      }
    });
  }

  protected elegirDia(fecha: Date): void {
    const t = this.turno();
    if (t) {
      this.store.asignarFecha(t.id, fecha);
    }
  }

  protected elegirHora(hora: string): void {
    const t = this.turno();
    if (t) {
      this.store.asignarHora(t.id, hora);
    }
  }

  protected volver(): void {
    if (this.store.indiceActual() > 0) {
      this.store.irAlTurno(this.store.indiceActual() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    this.router.navigate(['/servicio']);
  }

  protected continuar(): void {
    if (this.esUltimo()) {
      this.router.navigate(['/profesional']);
      return;
    }
    this.store.irAlTurno(this.store.indiceActual() + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
