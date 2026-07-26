import { Component, computed, inject, signal } from '@angular/core';
import { Stepper } from '../componentes/stepper';
import { PerfilNegocio } from '../componentes/perfil-negocio';
import { CarritoFlotante } from '../componentes/carrito-flotante';
import { ReservaStore } from '../servicios/reserva-store';
import { GRUPOS, SERVICIOS } from '../datos/catalogo';
import { precioARS } from '../datos/formato';
import { Servicio } from '../modelos';

const TODOS = 'Todos';
const MAX_IMAGENES = 3;

@Component({
  selector: 'app-seleccion-servicio',
  imports: [Stepper, PerfilNegocio, CarritoFlotante],
  template: `
    <div class="cabecera-panel">
      <app-perfil-negocio />
      <div class="cabecera-filler"></div>
      <app-stepper [paso]="1" />
    </div>
    <div class="contenedor">
      <h1>Elegí tu servicio</h1>

      <div class="disposicion">
        <aside class="lateral">
          <div class="buscador">
            <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
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

          <nav class="categorias" aria-label="Categorías">
            <button
              type="button"
              class="categoria todos"
              [class.activa]="categoria() === 'Todos'"
              (click)="elegirCategoria('Todos')"
            >
              Todos
            </button>
            @for (g of gruposCatalogo; track g.nombre) {
              <button
                type="button"
                class="categoria"
                [class.activa]="categoria() === g.nombre"
                (click)="elegirCategoria(g.nombre)"
              >
                <span class="categoria-nombre">{{ g.nombre }}</span>
                <span class="categoria-tagline">{{ g.tagline }}</span>
              </button>
            }
          </nav>
        </aside>

        <section class="grupos">
          @for (g of grupos(); track g.nombre) {
            <div class="grupo">
              <button
                type="button"
                class="grupo-cabecera"
                (click)="alternarGrupo(g.nombre)"
                [attr.aria-expanded]="estaAbierto(g.nombre)"
              >
                <span class="grupo-titulo">
                  <b>{{ g.nombre }}</b>
                  <i>· {{ g.tagline }}</i>
                </span>
                <span class="grupo-signo">{{ estaAbierto(g.nombre) ? '−' : '+' }}</span>
              </button>

              @if (estaAbierto(g.nombre)) {
                <div class="grupo-cuerpo">
                  @for (s of g.servicios; track s.id) {
                    <article class="servicio">
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
                      @if (s.imagenes?.length) {
                        <div class="fotos">
                          @for (img of s.imagenes!.slice(0, maxImagenes); track img) {
                            <div class="foto-ph" aria-hidden="true"></div>
                          }
                        </div>
                      }
                      <p class="descripcion">{{ s.descripcion }}</p>
                      @if (expandido() === s.id) {
                        <p class="detalle">{{ s.detalle }}</p>
                      }
                      <footer class="servicio-pie">
                        <button type="button" class="mas-info" (click)="alternarDetalle(s.id)">
                          {{ expandido() === s.id ? 'Menos información' : 'Más información' }}
                        </button>
                        @if (store.hayServicios()) {
                          <button
                            type="button"
                            class="btn-mas"
                            [class.agregado]="store.estaEnCarrito(s.id)"
                            [class.pulso]="pulso() === s.id"
                            (click)="agregar(s)"
                            [attr.aria-label]="
                              store.estaEnCarrito(s.id)
                                ? 'Quitar ' + s.nombre
                                : 'Agregar ' + s.nombre
                            "
                          >
                            {{ store.estaEnCarrito(s.id) ? '✓' : '+' }}
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="btn btn-primario"
                            [class.pulso]="pulso() === s.id"
                            (click)="agregar(s)"
                          >
                            Agendar servicio
                          </button>
                        }
                      </footer>
                    </article>
                  }
                </div>
              }
            </div>
          } @empty {
            <p class="sin-resultados">
              No encontramos servicios para tu búsqueda. Probá con otra palabra o
              elegí otra categoría.
            </p>
          }
        </section>
      </div>
    </div>

    <app-carrito-flotante />
  `,
  styles: `
    /* Banda superior: perfil + stepper en el mismo panel, separados por un filler */
    .cabecera-panel {
      background: var(--blanco);
      border-bottom: 1px solid var(--borde);
    }
    .cabecera-filler {
      height: 1px;
      background: var(--borde);
    }

    .disposicion {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
      align-items: start;
      margin-top: 1.25rem;
    }

    /* Lateral: buscador + categorías */
    .buscador {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: 999px;
      padding: 0.5rem 0.9rem;
      color: var(--neutro-claro);
      margin-bottom: 1rem;
    }
    .buscador input {
      border: none;
      outline: none;
      flex: 1;
      min-width: 0;
      background: none;
      color: var(--secundario);
      font-size: 0.88rem;
    }
    .buscador input::placeholder {
      color: var(--neutro-claro);
    }
    .categorias {
      display: flex;
      flex-direction: column;
    }
    .categoria {
      text-align: left;
      background: none;
      border: none;
      border-bottom: 1px solid var(--borde);
      padding: 0.8rem 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .categoria-nombre {
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--secundario);
    }
    .categoria-tagline {
      font-size: 0.78rem;
      font-style: italic;
      color: var(--neutro);
    }
    .categoria.todos {
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--secundario);
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio-chico);
      margin-bottom: 0.35rem;
    }
    .categoria:hover .categoria-nombre,
    .categoria.todos:hover {
      color: var(--primario);
    }
    .categoria.activa .categoria-nombre {
      color: var(--primario);
    }
    .categoria.todos.activa {
      background: rgba(52, 129, 126, 0.12);
      border-color: transparent;
      color: var(--secundario);
    }

    /* Grupos colapsables */
    .grupos {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .grupo-cabecera {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0.85rem 1.25rem;
      text-align: left;
    }
    .grupo-cabecera:hover {
      border-color: var(--primario);
    }
    .grupo-titulo b {
      font-size: 0.95rem;
    }
    .grupo-titulo i {
      color: var(--neutro);
      font-size: 0.85rem;
      margin-left: 0.25rem;
    }
    .grupo-signo {
      color: var(--primario);
      font-size: 1.35rem;
      font-weight: 700;
      line-height: 1;
      flex-shrink: 0;
    }
    .grupo-cuerpo {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      align-items: start;
      padding: 1.25rem 0.25rem;
    }

    /* Tarjeta de servicio */
    .servicio {
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio);
      box-shadow: var(--sombra);
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
    .fotos {
      display: flex;
      gap: 0.5rem;
    }
    .foto-ph {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      border: 1.5px dashed var(--neutro-claro);
      background: var(--fondo);
      flex-shrink: 0;
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
    /* Botón "+" compacto cuando ya hay un servicio agregado */
    .btn-mas {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1.5px solid var(--primario);
      background: var(--blanco);
      color: var(--primario);
      font-size: 1.4rem;
      line-height: 1;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .btn-mas:hover {
      background: var(--primario-suave);
    }
    .btn-mas.agregado {
      background: var(--primario);
      border-color: var(--primario);
      color: var(--blanco);
    }
    .pulso {
      animation: pulso 0.45s ease;
    }
    @keyframes pulso {
      0% {
        transform: scale(1);
      }
      40% {
        transform: scale(1.16);
      }
      100% {
        transform: scale(1);
      }
    }
    .sin-resultados {
      color: var(--neutro);
    }

    @media (max-width: 900px) {
      .grupo-cuerpo {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 720px) {
      .disposicion {
        display: block;
      }
      .lateral {
        margin-bottom: 1rem;
      }
      .categorias {
        flex-direction: row;
        overflow-x: auto;
        gap: 0.5rem;
        padding-bottom: 0.5rem;
      }
      .categoria,
      .categoria.todos {
        flex-shrink: 0;
        border: 1px solid var(--borde);
        background: var(--blanco);
        border-radius: 999px;
        padding: 0.45rem 1rem;
        margin-bottom: 0;
      }
      .categoria-tagline {
        display: none;
      }
      .categoria.activa {
        border-color: var(--primario);
      }
    }
  `,
})
export class SeleccionServicio {
  protected readonly store = inject(ReservaStore);

  protected readonly gruposCatalogo = GRUPOS;
  protected readonly maxImagenes = MAX_IMAGENES;
  protected readonly precio = precioARS;

  protected readonly categoria = signal(TODOS);
  protected readonly busqueda = signal('');
  protected readonly expandido = signal<string | null>(null);
  /** Servicio cuyo botón "pulsa" al agregarse (feedback visual). */
  protected readonly pulso = signal<string | null>(null);
  /** Grupos abiertos manualmente; el primero arranca abierto. */
  protected readonly abiertos = signal<string[]>([GRUPOS[0].nombre]);

  protected readonly grupos = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return GRUPOS.filter(
      (g) => this.categoria() === TODOS || g.nombre === this.categoria()
    )
      .map((g) => ({
        ...g,
        servicios: SERVICIOS.filter(
          (s) =>
            s.categoria === g.nombre &&
            (texto === '' ||
              s.nombre.toLowerCase().includes(texto) ||
              s.descripcion.toLowerCase().includes(texto))
        ),
      }))
      .filter((g) => g.servicios.length > 0);
  });

  protected estaAbierto(nombre: string): boolean {
    // Con búsqueda activa o categoría elegida, los grupos visibles se expanden solos.
    if (this.busqueda().trim() !== '' || this.categoria() !== TODOS) {
      return true;
    }
    return this.abiertos().includes(nombre);
  }

  protected alternarGrupo(nombre: string): void {
    this.abiertos.update((lista) =>
      lista.includes(nombre) ? lista.filter((n) => n !== nombre) : [...lista, nombre]
    );
  }

  protected elegirCategoria(nombre: string): void {
    this.categoria.set(nombre);
    if (nombre !== TODOS) {
      this.abiertos.update((lista) =>
        lista.includes(nombre) ? lista : [...lista, nombre]
      );
    }
  }

  protected entrada(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  protected alternarDetalle(id: string): void {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  protected agregar(servicio: Servicio): void {
    const estaba = this.store.estaEnCarrito(servicio.id);
    this.store.alternar(servicio);
    if (!estaba) {
      // Solo pulsa al sumar, no al quitar.
      this.pulso.set(servicio.id);
      setTimeout(() => {
        if (this.pulso() === servicio.id) this.pulso.set(null);
      }, 450);
    }
  }
}
