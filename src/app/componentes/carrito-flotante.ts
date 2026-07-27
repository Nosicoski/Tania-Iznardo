import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaStore } from '../servicios/reserva-store';
import { precioARS } from '../datos/formato';

/**
 * Menú que se despliega desde abajo cuando hay servicios agregados.
 * Permite reservar varios servicios de una vez ("Agendar ahora").
 */
@Component({
  selector: 'app-carrito-flotante',
  template: `
    @if (store.hayServicios()) {
      <div class="carrito">
        @if (abierto()) {
          <div class="detalle" id="carrito-detalle">
            <ul class="lista">
              @for (item of store.carrito(); track item.servicio.id) {
                <li class="fila">
                  <div class="fila-info">
                    <strong>{{ item.servicio.nombre }}</strong>
                    <span class="fila-meta">
                      {{ item.servicio.duracionMin }} min ·
                      {{ precio(item.servicio.precio * item.cantidad) }}
                    </span>
                  </div>
                  <div class="stepper">
                    <button
                      type="button"
                      class="stepper-btn stepper-quitar"
                      (click)="store.quitarUno(item.servicio.id)"
                      [attr.aria-label]="'Quitar uno de ' + item.servicio.nombre"
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
                    <span class="stepper-cant">{{ item.cantidad }}</span>
                    <button
                      type="button"
                      class="stepper-btn stepper-sumar"
                      (click)="store.agregar(item.servicio)"
                      [attr.aria-label]="'Agregar otro ' + item.servicio.nombre"
                    >
                      +
                    </button>
                  </div>
                </li>
              }
            </ul>
          </div>
        }
        <div class="carrito-inner">
          <button
            type="button"
            class="carrito-info"
            (click)="alternar()"
            [attr.aria-expanded]="abierto()"
            aria-controls="carrito-detalle"
          >
            <span class="carrito-textos">
              <strong class="carrito-titulo">{{ titulo() }}</strong>
              <span class="carrito-total">{{ precio(store.totalCarrito()) }}</span>
            </span>
            <svg
              class="flecha"
              [class.girada]="abierto()"
              viewBox="0 0 20 20"
              width="16"
              height="16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m5 12 5-5 5 5"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div class="carrito-acciones">
            <button
              type="button"
              class="carrito-vaciar"
              (click)="store.vaciarCarrito()"
              aria-label="Vaciar selección"
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
    /* Cabecera clickeable: abre el detalle hacia arriba. */
    .carrito-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
      background: none;
      border: none;
      padding: 0;
      text-align: left;
    }
    .carrito-textos {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .flecha {
      color: var(--primario);
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
    .flecha.girada {
      transform: rotate(180deg);
    }

    /* Detalle desplegable con los servicios del carrito */
    .detalle {
      max-height: min(45vh, 320px);
      overflow-y: auto;
      border-bottom: 1px solid var(--borde);
      margin-bottom: 0.7rem;
      animation: desplegar 0.2s ease;
    }
    @keyframes desplegar {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    .lista {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .fila {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.6rem 0.1rem;
    }
    .fila + .fila {
      border-top: 1px solid var(--borde);
    }
    .fila-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .fila-info strong {
      font-size: 0.85rem;
      color: var(--secundario);
      line-height: 1.3;
    }
    .fila-meta {
      font-size: 0.78rem;
      color: var(--neutro);
    }
    .stepper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1.5px solid var(--borde);
      border-radius: 999px;
      padding: 0.2rem 0.3rem;
      flex-shrink: 0;
    }
    .stepper-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      background: none;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: background 0.15s ease;
    }
    .stepper-quitar {
      color: #b3392f;
    }
    .stepper-quitar:hover {
      background: rgba(179, 57, 47, 0.1);
    }
    .stepper-sumar {
      color: var(--primario);
      font-size: 1.1rem;
      line-height: 1;
      border: 1.5px solid var(--primario);
    }
    .stepper-sumar:hover {
      background: var(--primario-suave);
    }
    .stepper-cant {
      min-width: 1ch;
      text-align: center;
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--secundario);
    }
    .carrito-titulo {
      font-size: 0.95rem;
      color: var(--secundario);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .carrito-total {
      font-size: 0.85rem;
      color: var(--primario);
      font-weight: 800;
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
      transition: border-color 0.15s ease, color 0.15s ease;
    }
    .carrito-vaciar:hover {
      border-color: #b3392f;
      color: #b3392f;
    }
    .carrito-cta {
      white-space: nowrap;
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
    }
  `,
})
export class CarritoFlotante {
  protected readonly store = inject(ReservaStore);
  private readonly router = inject(Router);
  protected readonly precio = precioARS;

  /** Detalle desplegado hacia arriba con la lista de servicios. */
  protected readonly abierto = signal(false);

  protected readonly titulo = computed(() => {
    const items = this.store.carrito();
    if (items.length === 1 && items[0].cantidad === 1) {
      return items[0].servicio.nombre;
    }
    return `${this.store.cantidadItems()} servicios seleccionados`;
  });

  constructor() {
    // Si el carrito queda vacío, el detalle no debe reaparecer abierto.
    effect(() => {
      if (!this.store.hayServicios()) {
        this.abierto.set(false);
      }
    });
  }

  protected alternar(): void {
    this.abierto.update((v) => !v);
  }

  protected agendar(): void {
    this.router.navigate(['/fecha-hora']);
  }
}
