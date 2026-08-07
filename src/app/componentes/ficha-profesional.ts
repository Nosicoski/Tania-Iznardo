import { Component, computed, input, signal } from '@angular/core';
import { Profesional } from '../modelos';
import { inicialesDe } from '../datos/profesionales';

/**
 * Ficha presentacional de un profesional: avatar circular, nombre y globo con
 * la profesión. Se usa en la lista del perfil y en el paso de profesional, así
 * las dos vistas comparten exactamente el mismo diseño.
 */
@Component({
  selector: 'app-ficha-profesional',
  template: `
    <div class="ficha" [class.grande]="grande()">
      <div class="avatar">
        @if (prof().foto && fotoVisible()) {
          <img [src]="prof().foto" [alt]="prof().nombre" (error)="fotoVisible.set(false)" />
        } @else {
          <span class="iniciales">{{ iniciales() }}</span>
        }
      </div>
      <span class="nombre">{{ prof().nombre }}</span>
      <span class="globo">{{ prof().profesion }}</span>
      @if (mostrarMatricula() && prof().matricula) {
        <span class="matricula">{{ prof().matricula }}</span>
      }
    </div>
  `,
  styles: `
    .ficha {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      min-width: 0;
      width: 100%;
    }
    .avatar {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--primario-suave);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .ficha.grande .avatar {
      width: 78px;
      height: 78px;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    /* Monograma en la serif: es la firma del profesional, igual que el del
       consultorio en la cabecera. */
    .iniciales {
      font-family: var(--fuente-titulo);
      font-weight: 600;
      font-size: calc(var(--txt-md) * var(--display-ajuste));
      color: var(--primario-fuerte);
      letter-spacing: 0.04em;
    }
    .ficha.grande .iniciales {
      font-size: calc(var(--txt-lg) * var(--display-ajuste));
    }
    .nombre {
      font-size: var(--txt-sm);
      font-weight: 600;
      color: var(--secundario);
      text-align: center;
      line-height: 1.25;
    }
    .ficha.grande .nombre {
      font-size: var(--txt-base);
    }
    /* Globo con la profesión, como en la lista de profesionales. */
    /* Ocupación como rótulo, sin píldora: en una grilla de seis fichas, seis
       cápsulas con borde eran seis cajas más que mirar. */
    .globo {
      padding: 0;
      font-size: var(--txt-2xs);
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--neutro);
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .matricula {
      font-size: var(--txt-2xs);
      color: var(--neutro-claro);
    }
  `,
})
export class FichaProfesional {
  readonly prof = input.required<Profesional>();
  readonly grande = input(false);
  readonly mostrarMatricula = input(false);

  protected readonly fotoVisible = signal(true);
  protected readonly iniciales = computed(() => inicialesDe(this.prof().nombre));
}
