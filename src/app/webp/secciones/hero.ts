import { Component, inject } from '@angular/core';
import { diaSemanaCorto } from '../../datos/formato';
import { AgendaVitrina } from '../agenda-vitrina';
import { ReservaEmbebida } from '../reserva-embebida';
import { FOTO, MARCA, PROMESAS } from '../marca';
import { Revelar } from '../revelar';

/**
 * Portada. Además del claim y el botón, muestra el turno libre más cercano de
 * todo el catálogo: es información viva, sale de la agenda real, y al tocarla
 * el visitante ya está en el formulario de contacto con ese turno tomado.
 */
@Component({
  selector: 'webp-hero',
  imports: [Revelar],
  template: `
    <section class="hero">
      <img class="fondo" [src]="foto.hero" alt="" aria-hidden="true" />
      <div class="velo"></div>

      <div class="contenido">
        <p class="antetitulo" [webpRevelar]="0">{{ marca.ciudad }} · Bienestar integral</p>
        <h1 [webpRevelar]="80">{{ marca.claim }}</h1>
        <p class="bajada" [webpRevelar]="160">{{ marca.bajada }}</p>

        <div class="acciones" [webpRevelar]="240">
          <button type="button" class="cta" (click)="reserva.abrirCatalogo()">
            Reservar mi turno
          </button>
          <button type="button" class="cta fantasma" (click)="verServicios()">
            Ver servicios
          </button>
        </div>

        @if (vitrina.proximoLibre(); as proximo) {
          <button
            type="button"
            class="pildora"
            [webpRevelar]="320"
            (click)="reserva.abrirTurno(proximo.servicio, proximo.hueco)"
          >
            <span class="punto" aria-hidden="true"></span>
            Próximo turno libre
            <strong>
              {{ dia(proximo.hueco.fecha) }} {{ proximo.hueco.fecha.getDate() }} ·
              {{ proximo.hueco.hora }} h
            </strong>
          </button>
        }
      </div>

      <ul class="promesas">
        @for (promesa of promesas; track promesa.titulo; let i = $index) {
          <li [webpRevelar]="400 + i * 90">
            <strong>{{ promesa.titulo }}</strong>
            <span>{{ promesa.texto }}</span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .hero {
      position: relative;
      isolation: isolate;
      min-height: min(92vh, 780px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 7rem 2rem 0;
      overflow: hidden;
    }
    .fondo,
    .velo {
      position: absolute;
      inset: 0;
      z-index: -1;
    }
    .fondo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      /* La foto es el clima, no el protagonista: se apaga para que el texto
         respire y el verde de la marca no pelee con los colores del ambiente. */
      filter: saturate(0.85) brightness(0.92);
    }
    .velo {
      background:
        linear-gradient(100deg, rgba(30, 42, 35, 0.82) 0%, rgba(30, 42, 35, 0.45) 55%, rgba(30, 42, 35, 0.15) 100%),
        linear-gradient(to top, rgba(20, 28, 24, 0.55), transparent 45%);
    }

    .contenido {
      max-width: 620px;
      margin-bottom: auto;
      padding-top: 2rem;
    }
    .antetitulo {
      margin: 0 0 1rem;
      color: var(--w-arena);
      font-size: 0.76rem;
      font-weight: 600;
      letter-spacing: 0.24em;
      text-transform: uppercase;
    }
    h1 {
      font-family: var(--w-serif);
      font-weight: 500;
      font-size: clamp(2.6rem, 6vw, 4.4rem);
      line-height: 1.04;
      letter-spacing: -0.015em;
      color: #fff;
      margin: 0;
    }
    .bajada {
      color: rgba(255, 255, 255, 0.82);
      font-size: 1.05rem;
      line-height: 1.7;
      margin: 1.25rem 0 2rem;
      max-width: 46ch;
    }

    .acciones {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
    }
    .cta {
      border: 1px solid transparent;
      border-radius: 999px;
      padding: 0.95rem 1.9rem;
      font-size: 0.94rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      background: var(--w-salvia);
      color: #fff;
      transition:
        transform 0.2s ease,
        background 0.2s ease,
        border-color 0.2s ease;
    }
    .cta:hover {
      background: var(--w-salvia-oscuro);
      transform: translateY(-2px);
    }
    .cta.fantasma {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.45);
      backdrop-filter: blur(4px);
    }
    .cta.fantasma:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: #fff;
    }

    /* Píldora de disponibilidad: el dato vivo de la portada. */
    .pildora {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      margin-top: 1.75rem;
      padding: 0.6rem 1.1rem 0.6rem 0.9rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.28);
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.85rem;
      backdrop-filter: blur(6px);
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .pildora strong {
      color: #fff;
      font-weight: 600;
    }
    .pildora:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.55);
    }
    .punto {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9fd6a8;
      box-shadow: 0 0 0 0 rgba(159, 214, 168, 0.7);
      animation: latir 2.4s ease-out infinite;
    }
    @keyframes latir {
      70% {
        box-shadow: 0 0 0 9px rgba(159, 214, 168, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(159, 214, 168, 0);
      }
    }

    /* Tira de promesas: el argumento del reservador, al pie de la portada. */
    .promesas {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      list-style: none;
      margin: 3.5rem -2rem 0;
      padding: 0;
      background: rgba(255, 255, 255, 0.14);
      border-top: 1px solid rgba(255, 255, 255, 0.14);
    }
    .promesas li {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 1.5rem 2rem 1.8rem;
      background: rgba(24, 34, 29, 0.55);
      backdrop-filter: blur(8px);
    }
    .promesas strong {
      color: #fff;
      font-size: 0.92rem;
      font-weight: 600;
    }
    .promesas span {
      color: rgba(255, 255, 255, 0.66);
      font-size: 0.82rem;
      line-height: 1.6;
    }

    @media (max-width: 860px) {
      .hero {
        padding: 6rem 1.25rem 0;
        min-height: auto;
      }
      .contenido {
        padding-top: 1rem;
      }
      .promesas {
        grid-template-columns: 1fr;
        margin: 3rem -1.25rem 0;
      }
      .promesas li {
        padding: 1.15rem 1.25rem;
      }
      .cta {
        flex: 1 1 100%;
        text-align: center;
      }
    }
  `,
})
export class Hero {
  protected readonly vitrina = inject(AgendaVitrina);
  protected readonly reserva = inject(ReservaEmbebida);

  protected readonly marca = MARCA;
  protected readonly foto = FOTO;
  protected readonly promesas = PROMESAS;
  protected readonly dia = diaSemanaCorto;

  protected verServicios(): void {
    document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
