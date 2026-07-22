import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { ReservaStore } from '../servicios/reserva-store';
import { CATEGORIAS, SERVICIOS } from '../datos/catalogo';
import { precioARS } from '../datos/formato';
import { Servicio } from '../modelos';

@Component({
  selector: 'app-seleccion-servicio',
  imports: [Stepper, ResumenReserva],
  template: `
    <app-stepper [paso]="1" />
    <div class="contenedor">
      <h1>Elegí tu servicio</h1>

      <div class="disposicion">
        <nav class="categorias" aria-label="Categorías">
          @for (c of categorias; track c) {
            <button
              type="button"
              class="categoria"
              [class.activa]="c === categoria()"
              (click)="categoria.set(c)"
            >
              {{ c }}
            </button>
          }
        </nav>

        <section class="principal">
          <div class="buscador">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" />
              <path d="m13.5 13.5 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
            <input
              type="search"
              placeholder="¿Qué servicio buscás?"
              [value]="busqueda()"
              (input)="busqueda.set(entrada($event))"
              aria-label="Buscar servicio"
            />
          </div>

          <div class="grilla">
            @for (s of filtrados(); track s.id) {
              <article class="tarjeta servicio">
                <header class="servicio-cabecera">
                  <h3>{{ s.nombre }}</h3>
                  @if (s.badge) {
                    <span class="badge">{{ s.badge }}</span>
                  }
                </header>
                <div class="meta">
                  <span>{{ s.duracionMin }} min</span>
                  <b class="precio">{{ precio(s.precio) }}</b>
                </div>
                <p class="descripcion">{{ s.descripcion }}</p>
                @if (expandido() === s.id) {
                  <p class="detalle">{{ s.detalle }}</p>
                }
                <footer class="servicio-pie">
                  <button type="button" class="mas-info" (click)="alternarDetalle(s.id)">
                    {{ expandido() === s.id ? 'Menos información' : 'Más información' }}
                  </button>
                  <button type="button" class="btn btn-primario" (click)="agendar(s)">
                    Agendar servicio
                  </button>
                </footer>
              </article>
            } @empty {
              <p class="sin-resultados">
                No encontramos servicios para tu búsqueda. Probá con otra palabra o
                elegí otra categoría.
              </p>
            }
          </div>
        </section>

        <app-resumen-reserva />
      </div>
    </div>
  `,
  styles: `
    .disposicion {
      display: grid;
      grid-template-columns: 190px 1fr 300px;
      gap: 1.5rem;
      align-items: start;
      margin-top: 1.25rem;
    }
    .categorias {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .categoria {
      text-align: left;
      background: none;
      border: none;
      border-radius: 999px;
      padding: 0.5rem 1rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--neutro);
    }
    .categoria:hover {
      color: var(--primario);
    }
    .categoria.activa {
      background: var(--primario);
      color: var(--blanco);
    }
    .buscador {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: 999px;
      padding: 0.55rem 1rem;
      color: var(--neutro-claro);
      margin-bottom: 1.25rem;
    }
    .buscador input {
      border: none;
      outline: none;
      flex: 1;
      background: none;
      color: var(--secundario);
    }
    .buscador input::placeholder {
      color: var(--neutro-claro);
    }
    .grilla {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      align-items: start;
    }
    .servicio {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .servicio-cabecera {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.6rem;
    }
    .servicio h3 {
      font-size: 1rem;
      line-height: 1.3;
    }
    .badge {
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 999px;
      padding: 0.2rem 0.6rem;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: var(--neutro);
    }
    .precio {
      color: var(--primario);
      font-size: 1rem;
    }
    .descripcion {
      margin: 0;
      color: var(--neutro);
      font-size: 0.85rem;
    }
    .detalle {
      margin: 0;
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      padding: 0.65rem 0.8rem;
      color: var(--secundario);
      font-size: 0.82rem;
    }
    .servicio-pie {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: auto;
    }
    .mas-info {
      background: none;
      border: none;
      padding: 0;
      color: var(--primario);
      font-weight: 700;
      font-size: 0.85rem;
    }
    .sin-resultados {
      grid-column: 1 / -1;
      color: var(--neutro);
    }
    @media (max-width: 1024px) {
      .disposicion {
        grid-template-columns: 170px 1fr;
      }
      app-resumen-reserva {
        grid-column: 1 / -1;
      }
    }
    @media (max-width: 720px) {
      .disposicion {
        display: block;
      }
      .categorias {
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .categoria {
        white-space: nowrap;
        border: 1px solid var(--borde);
        background: var(--blanco);
      }
      .categoria.activa {
        border-color: var(--primario);
      }
      .grilla {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class SeleccionServicio {
  private readonly router = inject(Router);
  private readonly store = inject(ReservaStore);

  protected readonly categorias = CATEGORIAS;
  protected readonly categoria = signal('Todos');
  protected readonly busqueda = signal('');
  protected readonly expandido = signal<string | null>(null);
  protected readonly precio = precioARS;

  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return SERVICIOS.filter(
      (s) =>
        (this.categoria() === 'Todos' || s.categoria === this.categoria()) &&
        (texto === '' ||
          s.nombre.toLowerCase().includes(texto) ||
          s.descripcion.toLowerCase().includes(texto))
    );
  });

  protected entrada(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  protected alternarDetalle(id: string): void {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  protected agendar(servicio: Servicio): void {
    this.store.elegirServicio(servicio);
    this.router.navigate(['/fecha-hora']);
  }
}
