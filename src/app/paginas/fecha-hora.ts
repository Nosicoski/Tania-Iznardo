import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { ReservaStore } from '../servicios/reserva-store';
import { Disponibilidad } from '../servicios/disponibilidad';
import {
  diaSemanaCorto,
  inicioDelDia,
  mismoDia,
  nombreMes,
  sumarDias,
} from '../datos/formato';

const DIAS_VISIBLES = 14;
const SALTO = 7;
const MAX_OFFSET = 84; // hasta ~3 meses hacia adelante

@Component({
  selector: 'app-fecha-hora',
  imports: [Stepper, ResumenReserva],
  template: `
    <app-stepper [paso]="2" />
    <div class="contenedor">
      <h1>Seleccioná fecha y hora</h1>

      <div class="disposicion">
        <section class="tarjeta calendario">
          <div class="calendario-cabecera">
            <div class="meses">
              @for (m of meses(); track m.etiqueta) {
                <button
                  type="button"
                  class="mes"
                  [class.activo]="m.etiqueta === mesActivo()"
                  (click)="irAlMes(m.primerDia)"
                >
                  {{ m.etiqueta }}
                </button>
              }
            </div>
            <span class="anio">{{ anio() }}</span>
          </div>

          <div class="tira">
            <button
              type="button"
              class="flecha"
              (click)="retroceder()"
              [disabled]="offset() === 0"
              aria-label="Días anteriores"
            >
              ‹
            </button>
            <div class="dias">
              @for (d of dias(); track d.getTime()) {
                <button
                  type="button"
                  class="dia"
                  [class.seleccionado]="esSeleccionado(d)"
                  [disabled]="!disponibilidad.esReservable(d)"
                  (click)="elegirDia(d)"
                >
                  <span class="dia-nombre">{{ nombreDia(d) }}</span>
                  <span class="dia-numero">{{ d.getDate() }}</span>
                </button>
              }
            </div>
            <button
              type="button"
              class="flecha"
              (click)="avanzar()"
              [disabled]="offset() >= maxOffset"
              aria-label="Días siguientes"
            >
              ›
            </button>
          </div>

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
                        (click)="store.elegirHora(hora)"
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
                        (click)="store.elegirHora(hora)"
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
        </section>

        <app-resumen-reserva />
      </div>

      <div class="acciones">
        <button type="button" class="btn btn-borde" (click)="volver()">Anterior</button>
        <button
          type="button"
          class="btn btn-primario"
          [disabled]="!store.hora()"
          (click)="continuar()"
        >
          Siguiente
        </button>
      </div>
    </div>
  `,
  styles: `
    .disposicion {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
      align-items: start;
      margin-top: 1.25rem;
    }
    .calendario {
      padding: 1.25rem 1.5rem 1.5rem;
    }
    .calendario-cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .meses {
      display: flex;
      gap: 1rem;
    }
    .mes {
      background: none;
      border: none;
      padding: 0.25rem 0;
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--neutro-claro);
      border-bottom: 2.5px solid transparent;
    }
    .mes.activo {
      color: var(--secundario);
      border-bottom-color: var(--primario);
    }
    .anio {
      color: var(--neutro);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .tira {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .flecha {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1.5px solid var(--borde);
      background: var(--blanco);
      color: var(--primario);
      font-size: 1.1rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .flecha:disabled {
      color: var(--neutro-claro);
    }
    .dias {
      display: grid;
      grid-template-columns: repeat(14, 1fr);
      gap: 0.15rem;
      flex: 1;
    }
    .dia {
      background: none;
      border: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0;
    }
    .dia-nombre {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--neutro);
      text-transform: capitalize;
    }
    .dia-numero {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .dia:disabled .dia-nombre,
    .dia:disabled .dia-numero {
      color: var(--neutro-claro);
      opacity: 0.6;
    }
    .dia:not(:disabled):hover .dia-numero {
      background: var(--primario-suave);
    }
    .dia.seleccionado .dia-numero {
      background: var(--terciario);
      color: var(--secundario);
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
      margin: 1.25rem 0 0;
    }
    .acciones {
      display: flex;
      justify-content: space-between;
      margin-top: 1.5rem;
    }
    @media (max-width: 720px) {
      .disposicion {
        display: block;
      }
      .calendario {
        padding: 1rem;
      }
      .dias {
        grid-template-columns: repeat(7, 1fr);
      }
      .dia:nth-child(n + 8) {
        display: none;
      }
    }
  `,
})
export class FechaHora {
  private readonly router = inject(Router);
  protected readonly store = inject(ReservaStore);
  protected readonly disponibilidad = inject(Disponibilidad);

  private readonly hoy = inicioDelDia(new Date());
  protected readonly offset = signal(0);
  protected readonly maxOffset = MAX_OFFSET;

  protected readonly dias = computed(() =>
    Array.from({ length: DIAS_VISIBLES }, (_, i) =>
      sumarDias(this.hoy, this.offset() + i)
    )
  );

  protected readonly meses = computed(() => {
    const vistos = new Map<string, Date>();
    for (const d of this.dias()) {
      const etiqueta = nombreMes(d);
      if (!vistos.has(etiqueta)) {
        vistos.set(etiqueta, new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
    return [...vistos.entries()].map(([etiqueta, primerDia]) => ({
      etiqueta,
      primerDia,
    }));
  });

  protected readonly mesActivo = computed(() => {
    const referencia = this.store.fecha() ?? this.dias()[0];
    return nombreMes(referencia);
  });

  protected readonly anio = computed(() => this.dias()[0].getFullYear());

  protected readonly horarios = computed(() => {
    const fecha = this.store.fecha();
    return fecha ? this.disponibilidad.horariosPara(fecha) : null;
  });

  protected nombreDia = diaSemanaCorto;

  protected esSeleccionado(d: Date): boolean {
    const fecha = this.store.fecha();
    return !!fecha && mismoDia(fecha, d);
  }

  protected elegirDia(d: Date): void {
    this.store.elegirFecha(d);
  }

  protected retroceder(): void {
    this.offset.update((o) => Math.max(0, o - SALTO));
  }

  protected avanzar(): void {
    this.offset.update((o) => Math.min(MAX_OFFSET, o + SALTO));
  }

  protected irAlMes(primerDia: Date): void {
    const inicio = primerDia < this.hoy ? this.hoy : primerDia;
    const diferenciaMs = inicio.getTime() - this.hoy.getTime();
    this.offset.set(Math.min(MAX_OFFSET, Math.round(diferenciaMs / 86400000)));
  }

  protected volver(): void {
    this.router.navigate(['/servicio']);
  }

  protected continuar(): void {
    this.router.navigate(['/datos']);
  }
}
