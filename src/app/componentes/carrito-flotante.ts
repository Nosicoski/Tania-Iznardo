import { Component, computed, inject, signal } from '@angular/core';
import { NavegacionReserva } from '../servicios/navegacion-reserva';
import { ReservaStore, TOPE_SERVICIOS } from '../servicios/reserva-store';
import { duracionTexto, precioARS } from '../datos/formato';

/**
 * Barra que sube desde abajo cuando hay servicios en la visita. Cerrada
 * resume ("2 servicios · 1h 50m"); abierta despliega hacia arriba la lista de
 * servicios para quitarlos o cambiarles el orden antes de ir a la agenda.
 */
@Component({
  selector: 'app-carrito-flotante',
  template: `
    @if (store.hayServicios()) {
      <div class="carrito">
        @if (abierto()) {
          <div class="detalle" id="carrito-detalle">
            <div class="detalle-cabecera">
              <span class="detalle-titulo">Tu visita</span>
              @if (store.cantidad() > 1) {
                <span class="detalle-orden"> Se hacen uno después del otro, en este orden </span>
              }
            </div>

            <ul class="items">
              @for (s of store.carrito(); track s.id; let i = $index; let ultimo = $last) {
                <li class="item">
                  <span class="item-numero">{{ i + 1 }}</span>
                  <span class="item-textos">
                    <strong>{{ s.nombre }}</strong>
                    <span class="item-meta">
                      {{ s.duracionMin }} min · {{ precio(s.precio) }}
                    </span>
                  </span>
                  @if (store.cantidad() > 1) {
                    <span class="flechas">
                      <button
                        type="button"
                        class="flecha"
                        [disabled]="i === 0"
                        (click)="store.mover(s.id, -1)"
                        [attr.aria-label]="'Adelantar ' + s.nombre"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          width="12"
                          height="12"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 10 8 6l4 4"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="flecha"
                        [disabled]="ultimo"
                        (click)="store.mover(s.id, 1)"
                        [attr.aria-label]="'Atrasar ' + s.nombre"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          width="12"
                          height="12"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 6l4 4 4-4"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </span>
                  }
                  <button
                    type="button"
                    class="item-quitar"
                    (click)="store.quitar(s.id)"
                    [attr.aria-label]="'Quitar ' + s.nombre"
                  >
                    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
                      <path
                        d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6 0v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6"
                        stroke="currentColor"
                        stroke-width="1.4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              }
            </ul>

            @if (store.ordenManual()) {
              <button type="button" class="enlace" (click)="store.soltarOrden()">
                Volver al orden automático
              </button>
            }
            @if (store.esReservaUnica()) {
              <p class="nota">
                Este servicio se reserva solo: no se combina con otros en la misma visita.
              </p>
            } @else if (store.topeAlcanzado()) {
              <p class="nota">Llegaste al máximo de {{ tope }} servicios por visita.</p>
            }
          </div>
        }

        <div class="carrito-inner">
          <button
            type="button"
            class="carrito-info"
            (click)="abierto.set(!abierto())"
            [attr.aria-expanded]="abierto()"
            aria-controls="carrito-detalle"
          >
            <span class="carrito-titulo">
              <!--
                El texto necesita su propio span: los cortes con puntos
                suspensivos no funcionan sobre un contenedor flex, y sin esto
                el nombre largo empuja el chevron fuera de la pantalla.
              -->
              <span class="carrito-nombre">{{ titulo() }}</span>
              <span class="chevron" [class.girado]="abierto()" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                  <path
                    d="M4 10 8 6l4 4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </span>
            <!--
              Con más de un servicio la duración real incluye el traslado entre
              profesionales, que recién se sabe al armar el bloque: lo decimos
              en vez de mostrar un número que después no coincide.
            -->
            <span class="carrito-total">
              {{ duracion(store.duracionServicios()) }}
              @if (store.cantidad() > 1) {
                <i class="traslados">+ traslados</i>
              }
              · {{ precio(store.total()) }}
            </span>
          </button>
          <div class="carrito-acciones">
            <button
              type="button"
              class="carrito-vaciar"
              (click)="vaciar()"
              aria-label="Vaciar la visita"
            >
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
                <path
                  d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6 0v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <button type="button" class="btn btn-primario carrito-cta" (click)="agendar()">
              Agendar ahora
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .carrito {
      position: fixed;
      left: 50%;
      bottom: 1.5rem;
      transform: translateX(-50%);
      z-index: 40;
      width: min(480px, calc(100% - 2.5rem));
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio);
      box-shadow: 0 14px 34px rgba(22, 48, 47, 0.2);
      padding: 0.75rem 0.9rem calc(0.75rem + env(safe-area-inset-bottom));
      animation: subir 0.28s ease;
    }
    @keyframes subir {
      from {
        transform: translate(-50%, calc(100% + 1.5rem));
        opacity: 0;
      }
      to {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }
    .carrito-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .carrito-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 0;
      background: none;
      border: none;
      padding: 0;
      text-align: left;
    }
    .carrito-titulo {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--secundario);
      max-width: 100%;
      min-width: 0;
    }
    /* El corte va acá, no en el flex: el chevron siempre queda a la vista. */
    .carrito-nombre {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .chevron {
      color: var(--neutro);
      display: grid;
      place-items: center;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }
    .chevron.girado {
      transform: rotate(180deg);
    }
    .carrito-info:hover .chevron {
      color: var(--primario);
    }
    .carrito-total {
      font-size: 0.85rem;
      color: var(--primario);
      font-weight: 800;
    }
    /* El tiempo entre servicios se conoce recién al armar el bloque */
    .traslados {
      color: var(--neutro);
      font-weight: 600;
      font-style: normal;
    }
    .carrito-acciones {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }
    .carrito-vaciar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1.5px solid var(--borde);
      background: var(--blanco);
      color: var(--neutro);
      display: grid;
      place-items: center;
      transition:
        border-color 0.15s ease,
        color 0.15s ease;
    }
    .carrito-vaciar:hover {
      border-color: #b3392f;
      color: #b3392f;
    }
    .carrito-cta {
      white-space: nowrap;
    }

    /* Panel que se despliega hacia arriba */
    .detalle {
      border-bottom: 1px solid var(--borde);
      margin-bottom: 0.75rem;
      padding-bottom: 0.6rem;
      max-height: min(52vh, 420px);
      overflow-y: auto;
      animation: desplegar 0.2s ease;
    }
    @keyframes desplegar {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .detalle-cabecera {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      margin-bottom: 0.6rem;
    }
    .detalle-titulo {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--neutro);
    }
    .detalle-orden {
      font-size: 0.75rem;
      color: var(--neutro);
    }
    .items {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: var(--fondo);
      border-radius: var(--radio-chico);
      padding: 0.5rem 0.6rem;
    }
    .item-numero {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      font-size: 0.7rem;
      font-weight: 800;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .item-textos {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }
    .item-textos strong {
      font-size: 0.82rem;
      line-height: 1.25;
      color: var(--secundario);
    }
    .item-meta {
      font-size: 0.74rem;
      color: var(--neutro);
    }
    .flechas {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      flex-shrink: 0;
    }
    .flecha {
      width: 22px;
      height: 18px;
      border: none;
      background: none;
      color: var(--neutro);
      display: grid;
      place-items: center;
      border-radius: var(--radio-chico);
    }
    .flecha:hover:not(:disabled) {
      color: var(--primario);
      background: var(--primario-suave);
    }
    .flecha:disabled {
      opacity: 0.3;
      cursor: default;
    }
    .item-quitar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: none;
      color: #b3392f;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .item-quitar:hover {
      background: rgba(179, 57, 47, 0.1);
    }
    .enlace {
      background: none;
      border: none;
      padding: 0.5rem 0 0;
      color: var(--primario);
      font-weight: 700;
      font-size: 0.78rem;
    }
    .enlace:hover {
      text-decoration: underline;
    }
    .nota {
      margin: 0.6rem 0 0;
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      border-radius: var(--radio-chico);
      padding: 0.5rem 0.65rem;
      font-size: 0.76rem;
      font-weight: 600;
    }

    @media (max-width: 720px) {
      .carrito {
        bottom: 1rem;
        width: calc(100% - 2rem);
        padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom));
      }
      .carrito-cta {
        padding: 0.6rem 1.15rem;
      }
      .carrito-acciones {
        gap: 0.5rem;
      }
    }
  `,
})
export class CarritoFlotante {
  protected readonly store = inject(ReservaStore);
  private readonly navegacion = inject(NavegacionReserva);
  protected readonly precio = precioARS;
  protected readonly duracion = duracionTexto;
  protected readonly tope = TOPE_SERVICIOS;

  protected readonly abierto = signal(false);

  protected readonly titulo = computed(() => {
    const lista = this.store.carrito();
    if (lista.length === 1) {
      return lista[0].nombre;
    }
    return `${lista.length} servicios seleccionados`;
  });

  protected vaciar(): void {
    this.abierto.set(false);
    this.store.vaciar();
  }

  protected agendar(): void {
    this.abierto.set(false);
    this.navegacion.ir('agendar');
  }
}
