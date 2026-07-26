import { Component, computed, inject } from '@angular/core';
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
        <div class="carrito-inner">
          <div class="carrito-info">
            <strong class="carrito-titulo">{{ titulo() }}</strong>
            <span class="carrito-total">{{ precio(store.totalCarrito()) }}</span>
          </div>
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
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 40;
      background: var(--blanco);
      border-top: 1px solid var(--borde);
      box-shadow: 0 -6px 20px rgba(22, 48, 47, 0.1);
      padding: 0.85rem 1.5rem calc(0.85rem + env(safe-area-inset-bottom));
      animation: subir 0.28s ease;
    }
    @keyframes subir {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }
    .carrito-inner {
      max-width: 1160px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .carrito-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
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

  protected readonly titulo = computed(() => {
    const items = this.store.carrito();
    return items.length === 1 ? items[0].nombre : `${items.length} servicios seleccionados`;
  });

  protected agendar(): void {
    this.router.navigate(['/fecha-hora']);
  }
}
