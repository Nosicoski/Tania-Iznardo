import { Component } from '@angular/core';
import { CONSULTORIO } from '../datos/catalogo';

@Component({
  selector: 'app-encabezado',
  template: `
    <header class="cabecera">
      <div class="marca">
        <div class="logo">TI</div>
        <div class="marca-texto">
          <div class="nombre">
            Tania Iznardo <span class="rubro">Osteopatía</span>
          </div>
          <div class="dir-mobile">
            {{ consultorio.direccion }} · {{ consultorio.horario }}
          </div>
        </div>
      </div>
      <div class="dir-desktop">
        <div class="dir-linea">{{ consultorio.direccion }} · {{ consultorio.ciudad }}</div>
        <div class="dir-horario">{{ consultorio.horario }}</div>
      </div>
    </header>
  `,
  styles: `
    .cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: var(--blanco);
      border-bottom: 1px solid var(--borde);
      padding: 0.85rem 1.5rem;
    }
    .marca {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }
    .logo {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: var(--primario-suave);
      color: var(--primario);
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 1.05rem;
      flex-shrink: 0;
    }
    .nombre {
      font-weight: 800;
      font-size: 1.05rem;
      white-space: nowrap;
    }
    .rubro {
      color: var(--primario);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-left: 0.15rem;
    }
    .dir-desktop {
      text-align: right;
      font-size: 0.8rem;
    }
    .dir-linea {
      font-weight: 700;
    }
    .dir-horario {
      color: var(--neutro);
    }
    .dir-mobile {
      display: none;
      color: var(--neutro);
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @media (max-width: 720px) {
      .cabecera {
        padding: 0.75rem 1rem;
      }
      .dir-desktop {
        display: none;
      }
      .dir-mobile {
        display: block;
      }
    }
  `,
})
export class Encabezado {
  protected readonly consultorio = CONSULTORIO;
}
