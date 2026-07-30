import { Component, computed, inject, signal } from '@angular/core';
import { AgendaGuardada } from '../servicios/agenda-guardada';
import { Cuentas } from '../servicios/cuentas';
import { agruparEnVisitas, cuandoEsVisita, horaDe } from '../datos/visitas';
import { duracionTexto } from '../datos/formato';

/**
 * Vistazo rápido a los próximos turnos, dentro del menú de la cuenta. Es un
 * carrusel de a una visita: nunca avanza solo, lo mueve el usuario con las
 * flechas o tocando los indicadores de abajo.
 */
@Component({
  selector: 'app-carrusel-turnos',
  template: `
    @if (visitas().length) {
      <section class="carrusel" aria-label="Tus próximos turnos">
        <header class="cabecera">
          <span class="titulo">Próximos turnos</span>
          @if (visitas().length > 1) {
            <span class="contador">{{ indice() + 1 }} de {{ visitas().length }}</span>
          }
        </header>

        <div class="marco">
          <!--
            Todas las tarjetas viven en la tira y se desplaza con transform: no
            hay scroll que se pueda quedar a mitad de camino entre dos turnos.
          -->
          <div class="tira" [style.transform]="'translateX(' + indice() * -100 + '%)'">
            @for (v of visitas(); track v.clave; let i = $index) {
              <article class="tarjeta-turno" [attr.aria-hidden]="i !== indice()">
                <div class="fila-titulo">
                  <span class="portada">
                    <img [src]="v.imagen" alt="" aria-hidden="true" />
                  </span>
                  <div class="titulo-textos">
                    <strong>{{ v.titulo }}</strong>
                    <span class="cuando">{{ dia(v.inicio) }} · {{ hora(v.inicio) }} hs</span>
                  </div>
                  <span class="estado" [class.hoy]="v.faltan === 0">{{ cuandoEs(v) }}</span>
                </div>

                @if (v.tramos.length > 1) {
                  <ul class="tramos">
                    @for (t of v.tramos; track t.clave) {
                      <li>
                        <span class="tramo-hora">{{ hora(t.inicio) }}</span>
                        <span class="tramo-nombre">{{ t.servicio?.nombre ?? 'Servicio' }}</span>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="con-quien">
                    con {{ v.profesionales }}
                  </p>
                }

                <footer class="pie">
                  {{ duracion(v.duracionMin) }}
                  @if (v.tramos.length > 1) {
                    · {{ v.tramos.length }} servicios
                  }
                </footer>
              </article>
            }
          </div>

          @if (visitas().length > 1) {
            <button
              type="button"
              class="flecha izquierda"
              [disabled]="indice() === 0"
              (click)="mover(-1)"
              aria-label="Turno anterior"
            >
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
                <path
                  d="M10 3 5 8l5 5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              class="flecha derecha"
              [disabled]="indice() === visitas().length - 1"
              (click)="mover(1)"
              aria-label="Turno siguiente"
            >
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          }
        </div>

        @if (visitas().length > 1) {
          <div class="puntos" role="tablist" aria-label="Elegir turno">
            @for (v of visitas(); track v.clave; let i = $index) {
              <button
                type="button"
                class="punto"
                role="tab"
                [class.activo]="i === indice()"
                [attr.aria-selected]="i === indice()"
                [attr.aria-label]="'Turno ' + (i + 1)"
                (click)="irA(i)"
              ></button>
            }
          </div>
        }
      </section>
    }
  `,
  styles: `
    .carrusel {
      padding: 0.35rem 0.15rem 0.5rem;
      border-bottom: 1px solid var(--borde);
      margin-bottom: 0.35rem;
    }
    .cabecera {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0 0.6rem 0.4rem;
    }
    .titulo {
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--neutro);
    }
    .contador {
      font-size: 0.68rem;
      color: var(--neutro-claro);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    /* El marco recorta; la tira se desplaza de a una tarjeta completa */
    .marco {
      position: relative;
      overflow: hidden;
      border-radius: var(--radio-chico);
    }
    .tira {
      display: flex;
      transition: transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
    }
    @media (prefers-reduced-motion: reduce) {
      .tira {
        transition: none;
      }
    }
    .tarjeta-turno {
      flex: 0 0 100%;
      min-width: 0;
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      padding: 0.65rem 0.7rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .fila-titulo {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .portada {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--blanco);
      flex-shrink: 0;
    }
    .portada img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .titulo-textos {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }
    .titulo-textos strong {
      font-size: 0.78rem;
      line-height: 1.25;
      color: var(--secundario);
      /* Dos líneas como máximo: si no, las tarjetas cambian de alto al pasar */
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .cuando {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--primario);
    }
    .estado {
      flex-shrink: 0;
      background: var(--blanco);
      border-radius: 999px;
      padding: 0.1rem 0.5rem;
      font-size: 0.62rem;
      font-weight: 800;
      color: var(--neutro);
      white-space: nowrap;
    }
    .estado.hoy {
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
    }

    .tramos {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .tramos li {
      display: flex;
      gap: 0.4rem;
      font-size: 0.71rem;
      min-width: 0;
    }
    .tramo-hora {
      font-weight: 800;
      color: var(--primario);
      flex-shrink: 0;
    }
    .tramo-nombre {
      color: var(--neutro);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .con-quien {
      margin: 0;
      font-size: 0.72rem;
      color: var(--neutro);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pie {
      font-size: 0.68rem;
      color: var(--neutro-claro);
      font-weight: 700;
    }

    /* Flechas sobre la tarjeta, sin robarle ancho al contenido */
    .flecha {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1px solid var(--borde);
      background: var(--blanco);
      color: var(--secundario);
      display: grid;
      place-items: center;
      box-shadow: 0 2px 8px rgba(22, 48, 47, 0.14);
      transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
    }
    .izquierda {
      left: 0.3rem;
    }
    .derecha {
      right: 0.3rem;
    }
    .flecha:hover:not(:disabled) {
      background: var(--primario);
      border-color: var(--primario);
      color: var(--blanco);
    }
    .flecha:disabled {
      opacity: 0;
      pointer-events: none;
    }

    .puntos {
      display: flex;
      justify-content: center;
      gap: 0.3rem;
      padding-top: 0.5rem;
    }
    .punto {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      border: none;
      padding: 0;
      background: var(--borde);
      transition: width 0.2s ease, background 0.2s ease;
    }
    .punto:hover {
      background: var(--neutro-claro);
    }
    .punto.activo {
      width: 16px;
      background: var(--primario);
    }
  `,
})
export class CarruselTurnos {
  private readonly agenda = inject(AgendaGuardada);
  private readonly cuentas = inject(Cuentas);

  protected readonly duracion = duracionTexto;
  protected readonly cuandoEs = cuandoEsVisita;
  protected readonly hora = horaDe;

  private readonly pedido = signal(0);

  /** Solo lo que todavía no pasó: es un vistazo a lo que viene. */
  protected readonly visitas = computed(() => {
    const email = this.cuentas.sesion()?.email;
    if (!email) {
      return [];
    }
    return agruparEnVisitas(this.agenda.turnosDe(email)).filter((v) => !v.pasado);
  });

  /**
   * Se acota acá y no al guardarlo: si un turno vence o se reserva otro, la
   * lista cambia sola y el índice pedido puede quedar fuera de rango.
   */
  protected readonly indice = computed(() =>
    Math.min(this.pedido(), Math.max(0, this.visitas().length - 1))
  );

  protected irA(posicion: number): void {
    this.pedido.set(Math.max(0, Math.min(posicion, this.visitas().length - 1)));
  }

  protected mover(delta: number): void {
    this.irA(this.indice() + delta);
  }

  protected dia(fecha: Date): string {
    const texto = new Intl.DateTimeFormat('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
      .format(fecha)
      .replace(/\./g, '')
      .replace(',', '');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
