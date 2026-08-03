import { Component } from '@angular/core';
import { EQUIPO, FOTO, MARCA } from '../marca';
import { Revelar } from '../revelar';

/** Presentación del equipo, con la foto del espacio como contrapeso al texto. */
@Component({
  selector: 'webp-sobre',
  imports: [Revelar],
  template: `
    <section class="sobre" id="nosotros">
      <div class="grilla">
        <figure class="foto" [webpRevelar]="0">
          <div class="marco">
            <img [src]="foto.espacio" alt="Sala de atención de {{ marca.nombre }}" loading="lazy" />
          </div>
          <figcaption>
            <strong>{{ equipo.nombre }}</strong>
            <span>{{ equipo.rol }}</span>
          </figcaption>
        </figure>

        <div class="texto">
          <p class="antetitulo" [webpRevelar]="60">Quiénes somos</p>
          <h2 [webpRevelar]="120">
            Acompañamos procesos,<br />
            no consultas sueltas
          </h2>
          @for (parrafo of equipo.parrafos; track $index) {
            <p class="parrafo" [webpRevelar]="180 + $index * 70">{{ parrafo }}</p>
          }
          <dl class="datos" [webpRevelar]="420">
            <div>
              <dt>Dónde</dt>
              <dd>{{ marca.direccion }} · {{ marca.ciudad }}</dd>
            </div>
            <div>
              <dt>Cuándo</dt>
              <dd>{{ marca.horario }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  `,
  styles: `
    .sobre {
      background: var(--w-crema);
      padding: clamp(4.5rem, 9vw, 8rem) 2rem;
    }
    .grilla {
      max-width: 1120px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
      gap: clamp(2.5rem, 6vw, 5rem);
      align-items: center;
    }

    .foto {
      margin: 0;
    }
    /* El arco va sobre la imagen y no sobre la figura entera: recortar el
       epígrafe con la curva le comía las primeras letras. */
    .marco {
      border-radius: 4px 4px 120px 120px;
      overflow: hidden;
      box-shadow: 0 30px 60px -30px rgba(44, 58, 51, 0.45);
    }
    .foto img {
      display: block;
      width: 100%;
      aspect-ratio: 4 / 5;
      object-fit: cover;
    }
    figcaption {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 1.5rem 0.25rem 0;
      border-left: 2px solid var(--w-arena);
      padding-left: 1rem;
      margin-top: 1.75rem;
    }
    figcaption strong {
      font-family: var(--w-serif);
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--w-profundo);
      line-height: 1.1;
    }
    figcaption span {
      font-size: 0.78rem;
      color: var(--w-arena-oscuro);
      letter-spacing: 0.04em;
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
      margin: 0 0 1.5rem;
    }
    .parrafo {
      color: var(--w-tinta-suave);
      font-size: 0.97rem;
      line-height: 1.85;
      margin: 0 0 1rem;
      max-width: 54ch;
    }

    .datos {
      display: flex;
      flex-wrap: wrap;
      gap: 2.5rem;
      margin: 2rem 0 0;
      padding-top: 1.75rem;
      border-top: 1px solid var(--w-borde);
    }
    .datos div {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    dt {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--w-arena-oscuro);
    }
    dd {
      margin: 0;
      font-size: 0.92rem;
      color: var(--w-profundo);
    }

    @media (max-width: 860px) {
      .sobre {
        padding: 4rem 1.25rem;
      }
      .grilla {
        grid-template-columns: 1fr;
      }
      .marco {
        border-radius: 4px 4px 80px 80px;
      }
      .foto {
        max-width: 420px;
      }
    }
  `,
})
export class Sobre {
  protected readonly marca = MARCA;
  protected readonly foto = FOTO;
  protected readonly equipo = EQUIPO;
}
