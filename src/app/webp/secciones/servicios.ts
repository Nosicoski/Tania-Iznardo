import { Component, computed, inject } from '@angular/core';
import { SERVICIOS } from '../../datos/catalogo';
import { diaSemanaCorto, duracionTexto, precioARS } from '../../datos/formato';
import { AgendaVitrina, Hueco } from '../agenda-vitrina';
import { ReservaEmbebida } from '../reserva-embebida';
import { VIDRIERA } from '../marca';
import { Revelar } from '../revelar';

/**
 * La vitrina: una tarjeta por categoría del catálogo, cada una con los próximos
 * horarios libres de verdad.
 *
 * Es el corazón del embebido. Los chips no son una imagen de muestra: salen de
 * la misma agenda que el calendario del reservador, así que un turno reservado
 * desaparece de acá solo. Tocar un chip abre el modal con el servicio, el día y
 * la hora ya elegidos; tocar la tarjeta abre el catálogo en esa categoría.
 */
@Component({
  selector: 'webp-servicios',
  imports: [Revelar],
  template: `
    <section class="servicios" id="servicios">
      <header class="intro">
        <p class="antetitulo" [webpRevelar]="0">Qué hacemos</p>
        <h2 [webpRevelar]="60">Elegí por dónde empezar</h2>
        <p class="bajada" [webpRevelar]="120">
          Cada tarjeta muestra horarios reales de esta semana. Tocá uno y reservás en un paso.
        </p>
      </header>

      <div class="grilla">
        @for (tarjeta of tarjetas(); track tarjeta.categoria; let i = $index) {
          @if (tarjeta.servicio; as servicio) {
            <article class="tarjeta" [webpRevelar]="i * 90">
              <button
                type="button"
                class="portada"
                (click)="reserva.abrirCatalogo(tarjeta.categoria)"
                [attr.aria-label]="'Ver los servicios de ' + tarjeta.titulo"
              >
                <img [src]="tarjeta.imagen" alt="" loading="lazy" />
                <span class="etiqueta">{{ tarjeta.cantidad }} servicios</span>
              </button>

              <div class="cuerpo">
                <h3>{{ tarjeta.titulo }}</h3>
                <p class="bajada-tarjeta">{{ tarjeta.bajada }}</p>
                <p class="meta">
                  Desde <strong>{{ precio(tarjeta.desde) }}</strong>
                  <span class="punto">·</span>
                  {{ duracion(servicio.duracionMin) }}
                </p>
              </div>

              <footer class="agenda">
                @if (tarjeta.huecos.length) {
                  <span class="rotulo">Próximos turnos</span>
                  <div class="chips">
                    @for (hueco of tarjeta.huecos; track hueco.fecha.getTime() + hueco.hora) {
                      <button
                        type="button"
                        class="chip"
                        (click)="reserva.abrirTurno(servicio, hueco)"
                        [attr.aria-label]="etiquetaHueco(tarjeta.titulo, hueco)"
                      >
                        <span class="chip-dia">{{ dia(hueco.fecha) }} {{ hueco.fecha.getDate() }}</span>
                        <span class="chip-hora">{{ hueco.hora }}</span>
                      </button>
                    }
                  </div>
                } @else {
                  <span class="rotulo">Sin horarios en los próximos días</span>
                }
                <button
                  type="button"
                  class="ver-todos"
                  (click)="reserva.abrirCatalogo(tarjeta.categoria)"
                >
                  Ver toda la agenda
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </footer>
            </article>
          }
        }
      </div>
    </section>
  `,
  styles: `
    .servicios {
      background: var(--w-blanco);
      padding: clamp(4.5rem, 9vw, 8rem) 2rem;
    }
    .intro {
      max-width: 620px;
      margin: 0 auto clamp(2.5rem, 5vw, 4rem);
      text-align: center;
    }
    .antetitulo {
      margin: 0 0 0.9rem;
      color: var(--w-salvia);
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.24em;
      text-transform: uppercase;
    }
    h2 {
      font-family: var(--w-serif);
      font-weight: 500;
      font-size: clamp(2rem, 3.8vw, 3rem);
      line-height: 1.12;
      color: var(--w-profundo);
      margin: 0;
    }
    .intro .bajada {
      color: var(--w-tinta-suave);
      margin: 1rem 0 0;
      line-height: 1.75;
    }

    .grilla {
      max-width: 1180px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 1.5rem;
    }

    .tarjeta {
      display: flex;
      flex-direction: column;
      background: var(--w-crema);
      border: 1px solid var(--w-borde);
      border-radius: 6px;
      overflow: hidden;
      transition:
        transform 0.3s ease,
        box-shadow 0.3s ease,
        border-color 0.3s ease;
    }
    .tarjeta:hover {
      transform: translateY(-4px);
      border-color: var(--w-salvia);
      box-shadow: 0 26px 44px -28px rgba(44, 58, 51, 0.5);
    }

    .portada {
      position: relative;
      display: block;
      width: 100%;
      padding: 0;
      border: none;
      background: none;
      line-height: 0;
      overflow: hidden;
    }
    .portada img {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.3, 1);
    }
    .tarjeta:hover .portada img {
      transform: scale(1.05);
    }
    .etiqueta {
      position: absolute;
      left: 0.9rem;
      bottom: 0.9rem;
      padding: 0.28rem 0.7rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      color: var(--w-profundo);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      line-height: 1.5;
      backdrop-filter: blur(4px);
    }

    .cuerpo {
      padding: 1.35rem 1.35rem 1.1rem;
      flex: 1;
    }
    h3 {
      font-family: var(--w-serif);
      font-weight: 500;
      font-size: 1.5rem;
      color: var(--w-profundo);
      margin: 0 0 0.45rem;
    }
    .bajada-tarjeta {
      color: var(--w-tinta-suave);
      font-size: 0.88rem;
      line-height: 1.65;
      margin: 0 0 0.9rem;
    }
    .meta {
      margin: 0;
      font-size: 0.82rem;
      color: var(--w-arena-oscuro);
    }
    .meta strong {
      color: var(--w-profundo);
      font-weight: 600;
    }
    .meta .punto {
      margin: 0 0.4rem;
      opacity: 0.5;
    }

    /* Franja de agenda: lo único de la tarjeta que cambia solo. */
    .agenda {
      border-top: 1px dashed var(--w-borde);
      padding: 1.1rem 1.35rem 1.35rem;
      background: rgba(255, 255, 255, 0.5);
    }
    .rotulo {
      display: block;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--w-arena-oscuro);
      margin-bottom: 0.7rem;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .chip {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.05rem;
      padding: 0.45rem 0.75rem;
      border: 1px solid var(--w-borde);
      border-radius: 4px;
      background: var(--w-blanco);
      text-align: left;
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease;
    }
    .chip:hover {
      background: var(--w-salvia);
      border-color: var(--w-salvia);
      color: #fff;
    }
    .chip-dia {
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--w-arena-oscuro);
      transition: color 0.2s ease;
    }
    .chip:hover .chip-dia {
      color: rgba(255, 255, 255, 0.8);
    }
    .chip-hora {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--w-profundo);
      transition: color 0.2s ease;
    }
    .chip:hover .chip-hora {
      color: #fff;
    }

    .ver-todos {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.9rem;
      padding: 0;
      border: none;
      background: none;
      color: var(--w-salvia-oscuro);
      font-size: 0.82rem;
      font-weight: 600;
    }
    .ver-todos svg {
      transition: transform 0.2s ease;
    }
    .ver-todos:hover svg {
      transform: translateX(3px);
    }

    @media (max-width: 860px) {
      .servicios {
        padding: 4rem 1.25rem;
      }
      .grilla {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Servicios {
  private readonly vitrina = inject(AgendaVitrina);
  protected readonly reserva = inject(ReservaEmbebida);

  protected readonly precio = precioARS;
  protected readonly duracion = duracionTexto;
  protected readonly dia = diaSemanaCorto;

  /**
   * Un `computed` y no una lista fija: lee la disponibilidad, que a su vez lee
   * los turnos guardados. Confirmar una reserva actualiza los chips sin que
   * nadie tenga que avisarle a esta pantalla.
   */
  protected readonly tarjetas = computed(() =>
    VIDRIERA.map((tarjeta) => {
      const deLaCategoria = SERVICIOS.filter((s) => s.categoria === tarjeta.categoria);
      const servicio = this.vitrina.servicioDe(tarjeta.categoria);
      return {
        ...tarjeta,
        servicio,
        cantidad: deLaCategoria.length,
        desde: Math.min(...deLaCategoria.map((s) => s.precio)),
        huecos: servicio ? this.vitrina.proximos(servicio, 3) : [],
      };
    }),
  );

  protected etiquetaHueco(titulo: string, hueco: Hueco): string {
    return `Reservar ${titulo} el ${diaSemanaCorto(hueco.fecha)} ${hueco.fecha.getDate()} a las ${hueco.hora}`;
  }
}
