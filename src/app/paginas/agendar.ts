import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { Calendario } from '../componentes/calendario';
import { ReservaStore } from '../servicios/reserva-store';
import { Disponibilidad } from '../servicios/disponibilidad';
import { inicialesDe, profesionalesPara } from '../datos/profesionales';
import { Profesional } from '../modelos';

/**
 * Paso 1: profesional, día y horario para el único turno de la reserva. El
 * profesional va arriba porque condiciona la agenda que se muestra debajo.
 */
@Component({
  selector: 'app-agendar',
  imports: [Stepper, ResumenReserva, Calendario],
  template: `
    <app-stepper [paso]="1" />
    <div class="contenedor">
      @if (servicio(); as s) {
        <button type="button" class="volver" (click)="volver()">
          <span aria-hidden="true">←</span> Volver a los servicios
        </button>

        <!-- Servicio que se está agendando -->
        <h1>{{ s.nombre }}</h1>
        <p class="ayuda">
          {{ s.duracionMin }} min · elegí el día y el horario para este servicio.
        </p>

        <div class="disposicion">
          <section class="tarjeta calendario">
            <!-- Profesional: parte del calendario, porque define qué se ofrece -->
            <div class="profes">
              <p class="profes-ayuda">Los horarios se ajustan al profesional elegido</p>
              <div class="profes-globos" role="radiogroup" aria-label="Profesional">
                <button
                  type="button"
                  class="globo-profe"
                  role="radio"
                  [attr.aria-checked]="elegido() === null"
                  [class.activo]="elegido() === null"
                  (click)="elegirProfesional(null)"
                >
                  <span class="globo-avatar avatar-todos" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                      <circle cx="9" cy="9" r="3.4" stroke="currentColor" stroke-width="1.8" />
                      <path
                        d="M3.2 19c.7-3 3-4.6 5.8-4.6S14.1 16 14.8 19"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                      />
                      <path
                        d="M16 7.2a2.9 2.9 0 0 1 0 5.6M17.6 14.8c2 .5 3.4 2 4 4.2"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                      />
                    </svg>
                  </span>
                  <span class="globo-textos">
                    <span class="globo-nombre">Cualquiera disponible</span>
                    <span class="globo-profesion">Todo el equipo</span>
                  </span>
                </button>

                @for (p of candidatos(); track p.id) {
                  <button
                    type="button"
                    class="globo-profe"
                    role="radio"
                    [attr.aria-checked]="elegido()?.id === p.id"
                    [class.activo]="elegido()?.id === p.id"
                    (click)="elegirProfesional(p)"
                  >
                    <span class="globo-avatar">
                      @if (conFoto(p)) {
                        <img [src]="p.foto" [alt]="p.nombre" (error)="fotoRota(p.id)" />
                      } @else {
                        <span class="globo-iniciales">{{ iniciales(p.nombre) }}</span>
                      }
                    </span>
                    <span class="globo-textos">
                      <span class="globo-nombre">{{ p.nombre }}</span>
                      <span class="globo-profesion">{{ p.profesion }}</span>
                    </span>
                  </button>
                }
              </div>
            </div>

            <app-calendario
              [seleccionada]="store.fecha()"
              [disponible]="hayCupo"
              (elegir)="elegirDia($event)"
            />

            @if (store.fecha()) {
              @if (horarios(); as h) {
                @if (h.manana.length || h.tarde.length) {
                  @if (h.manana.length) {
                    <h4 class="franja">Mañana</h4>
                    <div class="horarios">
                      @for (hora of h.manana; track hora) {
                        <button
                          type="button"
                          class="hora"
                          [class.elegida]="hora === store.hora()"
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
                          [class.elegida]="hora === store.hora()"
                          (click)="elegirHora(hora)"
                        >
                          {{ hora }}
                        </button>
                      }
                    </div>
                  }
                  <div class="aviso">
                    ⚠ Los horarios podrían agotarse, ¡reservá lo antes posible!
                  </div>
                } @else {
                  <p class="sin-horarios">
                    No quedan horarios disponibles para este día. Probá con otra fecha.
                  </p>
                }
              }
            } @else {
              <p class="sin-horarios">Elegí un día para ver los horarios disponibles.</p>
            }

            <!-- Siempre a la vista, atenuado hasta que haya día y horario. -->
            <button
              type="button"
              class="btn btn-primario continuar"
              [disabled]="!store.hora()"
              (click)="continuar()"
            >
              Continuar
            </button>
          </section>

          <app-resumen-reserva
            cta="Continuar"
            [ctaDeshabilitada]="!store.hora()"
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

    /* Selector de profesional, integrado arriba del calendario */
    .profes {
      margin-bottom: 1.1rem;
      border-bottom: 1px solid var(--borde);
      padding-bottom: 0.9rem;
    }
    .profes-globos {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 0.15rem 0 0.35rem;
      min-width: 0;
    }
    .globo-profe {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--blanco);
      border: 1.5px solid var(--borde);
      border-radius: 999px;
      padding: 0.3rem 0.9rem 0.3rem 0.3rem;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .globo-profe:hover {
      border-color: var(--primario);
    }
    .globo-profe.activo {
      border-color: var(--primario);
      background: var(--primario-suave);
    }
    .globo-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--primario-suave);
      color: var(--primario);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    /* El avatar de "cualquiera" conserva su fondo: su ícono es blanco. */
    .globo-profe.activo .globo-avatar:not(.avatar-todos) {
      background: var(--blanco);
    }
    .globo-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .globo-iniciales {
      font-size: 0.7rem;
      font-weight: 800;
    }
    .avatar-todos {
      background: var(--primario);
      color: var(--blanco);
    }
    .globo-textos {
      display: flex;
      flex-direction: column;
      text-align: left;
      min-width: 0;
    }
    .globo-nombre {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--secundario);
      line-height: 1.2;
      white-space: nowrap;
    }
    .globo-profesion {
      font-size: 0.7rem;
      color: var(--neutro);
      line-height: 1.2;
      white-space: nowrap;
    }
    .profes-ayuda {
      margin: 0 0 0.6rem;
      font-size: 0.8rem;
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
    .continuar:disabled {
      opacity: 0.45;
      cursor: default;
    }
    /* Desde acá el resumen pasa a la barra desplegable de abajo. */
    @media (max-width: 1024px) {
      .disposicion {
        display: block;
      }
      /* El botón vive en la barra fija "Tu reserva". */
      .continuar {
        display: none;
      }
    }
    @media (max-width: 720px) {
      .calendario {
        padding: 1rem;
      }
      .profes-globos {
        margin: 0 -1rem;
        padding: 0.15rem 1rem 0.35rem;
      }
    }
  `,
})
export class Agendar {
  private readonly router = inject(Router);
  protected readonly store = inject(ReservaStore);
  private readonly disponibilidad = inject(Disponibilidad);
  private readonly calendario = viewChild(Calendario);

  protected readonly servicio = this.store.servicio;
  protected readonly elegido = this.store.profesional;
  protected readonly iniciales = inicialesDe;
  /** Fotos que no cargaron: caen al avatar con iniciales. */
  private readonly sinFoto = signal<string[]>([]);

  protected conFoto(profesional: Profesional): boolean {
    return !!profesional.foto && !this.sinFoto().includes(profesional.id);
  }

  protected fotoRota(id: string): void {
    this.sinFoto.update((lista) => (lista.includes(id) ? lista : [...lista, id]));
  }

  /** Solo quienes ofrecen ese servicio puntual (no toda la categoría). */
  protected readonly candidatos = computed(() => {
    const s = this.servicio();
    return s ? profesionalesPara(s.id) : [];
  });

  /** Con quién se busca disponibilidad: el elegido, o todo el equipo. */
  private readonly aConsultar = computed(() => {
    const p = this.elegido();
    return p ? [p] : this.candidatos();
  });

  protected readonly horarios = computed(() => {
    const s = this.servicio();
    const fecha = this.store.fecha();
    if (!s || !fecha) {
      return null;
    }
    return this.disponibilidad.horariosPara(this.aConsultar(), fecha, s.duracionMin);
  });

  /** Se evalúa dentro del computed del calendario, por eso lee los signals ahí. */
  protected readonly hayCupo = (fecha: Date): boolean => {
    const s = this.servicio();
    return (
      !!s && this.disponibilidad.tieneCupo(this.aConsultar(), fecha, s.duracionMin)
    );
  };

  constructor() {
    // Al volver desde el paso de datos, mostrar el período del día ya elegido.
    effect(() => {
      const fecha = this.store.fecha();
      if (fecha) {
        this.calendario()?.mostrarFecha(fecha);
      }
    });
  }

  protected elegirProfesional(profesional: Profesional | null): void {
    this.store.elegirProfesional(profesional);
  }

  protected elegirDia(fecha: Date): void {
    this.store.elegirFecha(fecha);
  }

  protected elegirHora(hora: string): void {
    const s = this.servicio();
    const fecha = this.store.fecha();
    if (!s || !fecha) {
      return;
    }
    // En modo "cualquiera", el turno queda a nombre del primer profesional libre.
    const atiende = this.disponibilidad.primeroLibre(
      this.aConsultar(),
      fecha,
      hora,
      s.duracionMin
    );
    if (atiende) {
      this.store.elegirHora(hora, atiende);
    }
  }

  protected volver(): void {
    this.router.navigate(['/servicio']);
  }

  protected continuar(): void {
    this.router.navigate(['/datos']);
  }
}
