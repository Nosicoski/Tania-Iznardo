import { ApplicationRef, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PerfilNegocio } from '../componentes/perfil-negocio';
import { CarritoFlotante } from '../componentes/carrito-flotante';
import { Impedimento, ReservaStore, TOPE_SERVICIOS } from '../servicios/reserva-store';
import { NavegacionReserva } from '../servicios/navegacion-reserva';
import { GRUPOS, SERVICIOS, esCombinable } from '../datos/catalogo';
import { PROFESIONALES, inicialesDe, ofrece } from '../datos/profesionales';
import { precioARS } from '../datos/formato';
import { Profesional, Servicio } from '../modelos';

const MAX_IMAGENES = 3;

@Component({
  selector: 'app-seleccion-servicio',
  imports: [PerfilNegocio, CarritoFlotante],
  template: `
    <!-- Embebido en el sitio de un negocio, la cabecera de perfil sobra: la
         identidad ya la pone la página que hospeda al reservador. -->
    @if (!navegacion.embebido()) {
      <div class="cabecera-panel">
        <app-perfil-negocio />
      </div>
    }
    <div class="contenedor">
      <div class="disposicion">
        <aside class="lateral">
          <h1>Elegí tu servicio</h1>
          <nav class="categorias" aria-label="Categorías">
            @for (g of grupos(); track g.nombre) {
              <button
                type="button"
                class="categoria"
                [class.activa]="abierto() === g.nombre"
                (click)="irAlGrupo(g.nombre)"
              >
                <span class="categoria-nombre">{{ g.nombre }}</span>
                <span class="categoria-tagline">{{ g.tagline }}</span>
              </button>
            }
          </nav>
        </aside>

        <div class="principal">
          <!-- Filtro por profesional: acota el catálogo a lo que ofrece cada uno -->
          <div class="filtro-profes" role="group" aria-label="Filtrar por profesional">
            @for (p of profesionales; track p.id) {
              <div class="globo-caja">
                <button
                  type="button"
                  class="globo-profe"
                  [attr.aria-pressed]="filtro()?.id === p.id"
                  [class.activo]="filtro()?.id === p.id"
                  (click)="filtrarPor(p)"
                >
                  <span class="avatar">
                    @if (conFoto(p)) {
                      <img [src]="p.foto" [alt]="p.nombre" (error)="fotoRota(p.id)" />
                    } @else {
                      <span class="iniciales">{{ iniciales(p.nombre) }}</span>
                    }
                  </span>
                  <span class="globo-nombre">{{ p.nombre }}</span>
                  <span class="globo-profesion">{{ p.profesion }}</span>
                </button>
                @if (filtro()?.id === p.id) {
                  <button
                    type="button"
                    class="quitar-filtro"
                    (click)="filtrarPor(null)"
                    [attr.aria-label]="'Dejar de filtrar por ' + p.nombre"
                  >
                    <svg viewBox="0 0 12 12" width="9" height="9" fill="none" aria-hidden="true">
                      <path
                        d="M3 3l6 6M9 3l-6 6"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                      />
                    </svg>
                  </button>
                }
              </div>
            }
          </div>

          <section class="grupos">
            @for (g of grupos(); track g.nombre) {
              <div class="grupo" [id]="ancla(g.nombre)">
                <button
                  type="button"
                  class="grupo-cabecera"
                  (click)="alternarGrupo(g.nombre)"
                  [attr.aria-expanded]="abierto() === g.nombre"
                >
                  <span class="grupo-titulo">
                    <b>{{ g.nombre }}</b>
                    <i>· {{ g.tagline }}</i>
                  </span>
                  <span class="grupo-signo">{{ abierto() === g.nombre ? '−' : '+' }}</span>
                </button>

                @if (abierto() === g.nombre) {
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
                          @if (!combinable(s)) {
                            <span
                              class="tag-unica"
                              title="Se reserva solo: no se combina con otros servicios en la misma visita"
                            >
                              Reserva única
                            </span>
                          }
                        </div>
                        @if (s.imagenes?.length) {
                          <div class="fotos">
                            @for (img of s.imagenes!.slice(0, maxImagenes); track img) {
                              <img class="foto" [src]="img" alt="" aria-hidden="true" />
                            }
                          </div>
                        }
                        <p class="descripcion">{{ s.descripcion }}</p>
                        @if (s.requisitos) {
                          <p class="requisitos">
                            <span class="requisitos-icono" aria-hidden="true">
                              <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                                <circle
                                  cx="8"
                                  cy="8"
                                  r="6.2"
                                  stroke="currentColor"
                                  stroke-width="1.5"
                                />
                                <path
                                  d="M8 5.2v3.4"
                                  stroke="currentColor"
                                  stroke-width="1.6"
                                  stroke-linecap="round"
                                />
                                <circle cx="8" cy="11" r="0.9" fill="currentColor" />
                              </svg>
                            </span>
                            Requisitos previos
                          </p>
                        }
                        @if (expandido() === s.id) {
                          <p class="detalle">{{ s.detalle }}</p>
                        }
                        <footer class="servicio-pie">
                          <button type="button" class="mas-info" (click)="alternarDetalle(s.id)">
                            {{ expandido() === s.id ? 'Menos información' : 'Más información' }}
                          </button>
                          <!-- Ya en la visita: tacho · 1 · + (uno por servicio) -->
                          @if (store.enVisita(s.id)) {
                            <div class="stepper" [class.pulso]="pulso() === s.id">
                              <button
                                type="button"
                                class="stepper-btn stepper-quitar"
                                (click)="store.quitar(s.id)"
                                [attr.aria-label]="'Quitar ' + s.nombre + ' de la visita'"
                              >
                                <svg
                                  viewBox="0 0 20 20"
                                  width="15"
                                  height="15"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6 0v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6"
                                    stroke="currentColor"
                                    stroke-width="1.4"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </button>
                              <span class="stepper-cant">1</span>
                              <button
                                type="button"
                                class="stepper-btn stepper-sumar"
                                disabled
                                title="Un turno por servicio en cada visita"
                                aria-label="Un turno por servicio en cada visita"
                              >
                                +
                              </button>
                            </div>
                          } @else if (store.hayServicios()) {
                            <button
                              type="button"
                              class="btn-mas"
                              [class.pulso]="pulso() === s.id"
                              [disabled]="impedimento(s) === 'tope'"
                              [attr.title]="motivo(s)"
                              (click)="agendar(s)"
                              [attr.aria-label]="'Agregar ' + s.nombre + ' a la visita'"
                            >
                              +
                            </button>
                          } @else {
                            <button
                              type="button"
                              class="btn btn-primario"
                              [class.pulso]="pulso() === s.id"
                              (click)="agendar(s)"
                            >
                              Agregar a mi visita
                            </button>
                          }
                        </footer>
                      </article>
                    }
                  </div>
                }
              </div>
            }
          </section>
        </div>
      </div>
    </div>

    <app-carrito-flotante />

    <!--
      Aviso de preparación previa. Solo informa: el servicio ya quedó agregado y
      el usuario sigue armando su visita como quiera.
    -->
    @if (aviso(); as s) {
      <div class="fondo-modal" (click)="cerrarAviso()">
        <div
          class="modal tarjeta"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aviso-titulo"
          (click)="$event.stopPropagation()"
        >
          <span class="aviso-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
              <path d="M12 7.6v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="12" cy="16.2" r="1.2" fill="currentColor" />
            </svg>
          </span>
          <h2 id="aviso-titulo">{{ s.nombre }} requiere preparación</h2>
          <p class="modal-texto">{{ s.requisitos }}</p>
          <div class="modal-acciones">
            <button type="button" class="btn btn-primario" (click)="cerrarAviso()">
              Entendido
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Los servicios de "reserva única" no comparten visita: hay que elegir -->
    @if (aReemplazar(); as nuevo) {
      <div class="fondo-modal" (click)="cancelarCambio()">
        <div
          class="modal tarjeta"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          (click)="$event.stopPropagation()"
        >
          <h2 id="modal-titulo">Este servicio se reserva solo</h2>
          @if (combinable(nuevo)) {
            <p class="modal-texto">
              Tu visita tiene <b>{{ store.carrito()[0].nombre }}</b
              >, que se reserva solo y no se combina con otros servicios. Si querés
              <b>{{ nuevo.nombre }}</b> vamos a reemplazarlo.
            </p>
          } @else {
            <p class="modal-texto">
              <b>{{ nuevo.nombre }}</b> se reserva solo, sin otros servicios en la misma visita. Si
              lo elegís vamos a vaciar tu visita actual ({{ store.cantidad() }}
              {{ store.cantidad() === 1 ? 'servicio' : 'servicios' }}).
            </p>
          }
          <div class="modal-acciones">
            <button type="button" class="btn btn-borde" (click)="cancelarCambio()">
              Mantener mi visita
            </button>
            <button type="button" class="btn btn-primario" (click)="confirmarCambio()">
              Reservar solo este
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .cabecera-panel {
      background: var(--blanco);
      border-bottom: 1px solid var(--borde);
    }
    /* Aire para que el carrito flotante no tape la última tarjeta */
    .contenedor {
      padding-bottom: 7rem;
    }

    /* Columna central: el filtro arranca y termina donde las tarjetas */
    .principal {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Filtro por profesional (globos verticales) */
    .filtro-profes {
      display: flex;
      align-items: flex-start;
      gap: 1.1rem;
      overflow-x: auto;
      /* Aire arriba y abajo: si no, el scroll recorta el anillo del activo. */
      padding: 0.5rem 0;
    }
    .globo-caja {
      position: relative;
      flex-shrink: 0;
    }
    /*
     * Cruz para soltar el filtro sin tener que volver a apuntarle al globo. Va
     * en SVG y no con el carácter "×": el glifo trae su propio interlineado y
     * queda descentrado dentro del círculo.
     */
    .quitar-filtro {
      position: absolute;
      top: -2px;
      right: 8px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1.5px solid var(--primario);
      background: var(--blanco);
      color: var(--primario);
      display: grid;
      place-items: center;
      padding: 0;
      line-height: 0;
    }
    .quitar-filtro:hover {
      background: var(--primario);
      color: var(--blanco);
    }
    .globo-profe {
      width: 88px;
      background: none;
      border: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--primario-suave);
      color: var(--primario);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: box-shadow 0.15s ease;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .iniciales {
      font-weight: 800;
      font-size: 0.9rem;
      letter-spacing: 0.02em;
    }
    .globo-profe:hover .avatar {
      box-shadow:
        0 0 0 3px var(--blanco),
        0 0 0 5px var(--borde);
    }
    /* Anillo doble = profesional por el que se está filtrando */
    .globo-profe.activo .avatar {
      box-shadow:
        0 0 0 3px var(--blanco),
        0 0 0 5px var(--primario);
    }
    .globo-nombre {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--secundario);
      text-align: center;
      line-height: 1.25;
      /* Dos líneas fijas: así las píldoras de abajo quedan a la misma altura. */
      min-height: 2.5em;
    }
    .globo-profesion {
      background: var(--primario-suave);
      color: var(--primario);
      border-radius: 999px;
      padding: 0.12rem 0.55rem;
      font-size: 0.62rem;
      font-weight: 700;
      line-height: 1.3;
      text-align: center;
      max-width: 100%;
    }

    .disposicion {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
      align-items: start;
      margin-top: 1.25rem;
    }

    /* Lateral: título + navegador de categorías (no filtra, solo lleva al grupo) */
    .lateral h1 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
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
    .categoria:hover .categoria-nombre {
      color: var(--primario);
    }
    .categoria.activa .categoria-nombre {
      color: var(--primario);
    }

    /* Grupos colapsables: solo uno abierto a la vez, todos cerrados al entrar */
    .grupos {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .grupo {
      scroll-margin-top: 1rem;
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
    .foto {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--fondo);
      object-fit: cover;
      display: block;
      flex-shrink: 0;
    }
    .descripcion {
      margin: 0;
      color: var(--neutro);
      font-size: 0.85rem;
    }
    /* Aviso discreto: el detalle completo va en el popup al agregarlo */
    .requisitos {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin: -0.2rem 0 0;
      color: var(--neutro-claro);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .requisitos-icono {
      display: grid;
      place-items: center;
      flex-shrink: 0;
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
    /* Servicio que no comparte visita (programas y talleres) */
    .tag-unica {
      margin-left: auto;
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      border-radius: 999px;
      padding: 0.15rem 0.55rem;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Agregar a la visita: + suelto cuando ya hay algo elegido */
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
      transition:
        background 0.15s ease,
        color 0.15s ease;
    }
    .btn-mas:hover:not(:disabled) {
      background: var(--primario-suave);
    }
    .btn-mas:disabled {
      border-color: var(--borde);
      color: var(--neutro-claro);
      cursor: default;
    }
    /* Ya en la visita: tacho de basura · cantidad · + (uno por servicio) */
    .stepper {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      border: 1.5px solid var(--borde);
      border-radius: 999px;
      padding: 0.3rem 0.4rem;
      flex-shrink: 0;
    }
    .stepper-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: none;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition:
        background 0.15s ease,
        color 0.15s ease;
    }
    .stepper-quitar {
      color: #b3392f;
    }
    .stepper-quitar:hover {
      background: rgba(179, 57, 47, 0.1);
    }
    .stepper-sumar {
      color: var(--primario);
      font-size: 1.15rem;
      line-height: 1;
      border: 1.5px solid var(--primario);
    }
    .stepper-sumar:disabled {
      border-color: var(--borde);
      color: var(--neutro-claro);
      cursor: default;
    }
    .stepper-cant {
      min-width: 1ch;
      text-align: center;
      font-weight: 700;
      font-size: 0.9rem;
    }
    /* Feedback al sumar o quitar un servicio */
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

    /* Aviso de reemplazo de la reserva en curso */
    .fondo-modal {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(22, 48, 47, 0.45);
      display: grid;
      place-items: center;
      padding: 1.25rem;
      animation: aparecer 0.18s ease;
    }
    @keyframes aparecer {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .modal {
      width: min(440px, 100%);
      padding: 1.5rem;
    }
    .modal h2 {
      font-size: 1.1rem;
    }
    .aviso-icono {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      display: grid;
      place-items: center;
      margin-bottom: 0.9rem;
    }
    .modal-texto {
      margin: 0.75rem 0 1.5rem;
      color: var(--neutro);
      font-size: 0.9rem;
    }
    .modal-texto b {
      color: var(--secundario);
    }
    .modal-acciones {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
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
      .categoria {
        flex-shrink: 0;
        border: 1px solid var(--borde);
        background: var(--blanco);
        border-radius: 999px;
        padding: 0.45rem 1rem;
      }
      .categoria-tagline {
        display: none;
      }
      .categoria.activa {
        border-color: var(--primario);
      }
      .modal-acciones .btn {
        width: 100%;
      }
      /* Objetivos táctiles: con el pulgar, 20px de cruz no se aciertan. */
      .quitar-filtro {
        width: 26px;
        height: 26px;
        top: -4px;
        right: 4px;
      }
      .mas-info {
        padding: 0.45rem 0;
        min-height: 40px;
        display: inline-flex;
        align-items: center;
      }
      /* Quitar y sumar el servicio: 28px es chico para el pulgar. */
      .stepper-btn {
        width: 36px;
        height: 36px;
      }
    }
  `,
})
export class SeleccionServicio {
  protected readonly store = inject(ReservaStore);
  protected readonly navegacion = inject(NavegacionReserva);
  private readonly app = inject(ApplicationRef);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly profesionales = PROFESIONALES;
  protected readonly maxImagenes = MAX_IMAGENES;
  protected readonly precio = precioARS;
  protected readonly iniciales = inicialesDe;

  protected readonly expandido = signal<string | null>(null);
  /** Acordeón: un solo grupo abierto y ninguno al entrar. */
  protected readonly abierto = signal<string | null>(null);
  /** Servicio que espera confirmación porque vaciaría la visita en curso. */
  protected readonly aReemplazar = signal<Servicio | null>(null);
  /** Servicio recién agregado cuyos requisitos hay que avisar (una sola vez). */
  protected readonly aviso = signal<Servicio | null>(null);
  /** Servicio cuyo botón "pulsa" al agregarse (feedback visual). */
  protected readonly pulso = signal<string | null>(null);
  protected readonly tope = TOPE_SERVICIOS;
  protected readonly combinable = esCombinable;
  /**
   * Profesional por el que se filtra el catálogo; null = todo el equipo. Al
   * volver desde el paso de agenda arranca en el que ya venía pedido, si la
   * visita entera lo tiene fijado.
   */
  protected readonly filtro = signal<Profesional | null>(this.profesionalDeLaVisita());
  /** Fotos que no cargaron: caen al avatar con iniciales. */
  private readonly sinFoto = signal<string[]>([]);

  constructor() {
    // `?cat=` entra directo a una categoría. Lo usa la landing: cada tarjeta de
    // servicio abre el reservador con su grupo ya desplegado.
    const categoria = this.ruta.snapshot.queryParamMap.get('cat');
    if (categoria && GRUPOS.some((g) => g.nombre === categoria)) {
      this.abierto.set(categoria);
    }
  }

  /** Grupos con al menos un servicio visible; alimenta el listado y el lateral. */
  protected readonly grupos = computed(() => {
    const profesional = this.filtro();
    return GRUPOS.map((g) => ({
      ...g,
      servicios: SERVICIOS.filter(
        (s) => s.categoria === g.nombre && (!profesional || ofrece(profesional, s.id)),
      ),
    })).filter((g) => g.servicios.length > 0);
  });

  protected conFoto(profesional: Profesional): boolean {
    return !!profesional.foto && !this.sinFoto().includes(profesional.id);
  }

  protected fotoRota(id: string): void {
    this.sinFoto.update((lista) => (lista.includes(id) ? lista : [...lista, id]));
  }

  /** El profesional pedido para todos los servicios de la visita, si hay uno solo. */
  private profesionalDeLaVisita(): Profesional | null {
    const pedidos = this.store.carrito().map((s) => this.store.profesionalFijado(s.id));
    const unico = pedidos[0];
    if (!unico || pedidos.some((p) => p !== unico)) {
      return null;
    }
    return PROFESIONALES.find((p) => p.id === unico) ?? null;
  }

  /**
   * Cambiar de profesional puede hacer desaparecer el grupo abierto. Tocar al
   * que ya estaba elegido suelta el filtro (lo mismo que la cruz).
   */
  protected filtrarPor(profesional: Profesional | null): void {
    const elegido = this.filtro()?.id === profesional?.id ? null : profesional;
    this.filtro.set(elegido);
    this.abierto.set(null);
    this.expandido.set(null);
  }

  protected ancla(nombre: string): string {
    return (
      'grupo-' +
      nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^a-z0-9]+/g, '-')
    );
  }

  protected alternarGrupo(nombre: string): void {
    this.abierto.update((actual) => (actual === nombre ? null : nombre));
  }

  /** El navegador lateral no filtra: abre ese grupo y lleva al usuario hasta él. */
  protected irAlGrupo(nombre: string): void {
    if (this.abierto() === nombre) {
      this.desplazarA(nombre);
      return;
    }
    this.abierto.set(nombre);
    // El grupo anterior se cierra y el de destino se mueve, así que primero
    // aplicamos el cambio al DOM y recién después medimos hacia dónde ir.
    this.app.tick();
    this.desplazarA(nombre);
  }

  private desplazarA(nombre: string): void {
    document
      .getElementById(this.ancla(nombre))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected alternarDetalle(id: string): void {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  protected impedimento(servicio: Servicio): Impedimento | null {
    return this.store.impedimentoPara(servicio);
  }

  /** Texto del tooltip cuando el + no puede sumar el servicio. */
  protected motivo(servicio: Servicio): string | null {
    switch (this.impedimento(servicio)) {
      case 'tope':
        return `Máximo ${this.tope} servicios por visita`;
      case 'no-combinable':
        return 'Se reserva solo: reemplazaría tu visita actual';
      case 'visita-no-combinable':
        return 'Tu visita tiene un servicio que se reserva solo';
      default:
        return null;
    }
  }

  protected agendar(servicio: Servicio): void {
    const impedimento = this.impedimento(servicio);
    // Los "reserva única" no conviven con nada: hay que decidir cuál queda.
    if (impedimento === 'no-combinable' || impedimento === 'visita-no-combinable') {
      this.aReemplazar.set(servicio);
      return;
    }
    if (impedimento) {
      return;
    }
    this.store.agregar(servicio);
    this.sumado(servicio);
  }

  protected confirmarCambio(): void {
    const servicio = this.aReemplazar();
    this.aReemplazar.set(null);
    if (!servicio) {
      return;
    }
    this.store.reemplazarPor(servicio);
    this.sumado(servicio);
  }

  protected cancelarCambio(): void {
    this.aReemplazar.set(null);
  }

  protected cerrarAviso(): void {
    this.aviso.set(null);
  }

  /** Cierre común de agregar: feedback, profesional del filtro y requisitos. */
  private sumado(servicio: Servicio): void {
    this.destacar(servicio.id);
    // El profesional por el que filtró queda pedido para ese servicio.
    const profesional = this.filtro();
    if (profesional && ofrece(profesional, servicio.id)) {
      this.store.fijarProfesional(servicio.id, profesional.id);
    }
    if (servicio.requisitos) {
      this.aviso.set(servicio);
    }
  }

  private destacar(id: string): void {
    this.pulso.set(id);
    setTimeout(() => this.pulso.set(null), 450);
  }
}
