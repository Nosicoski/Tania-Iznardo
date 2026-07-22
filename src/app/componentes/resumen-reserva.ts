import { Component, inject, input, output, signal } from '@angular/core';
import { ReservaStore } from '../servicios/reserva-store';
import { PROFESIONAL } from '../datos/catalogo';
import { fechaLarga, precioARS } from '../datos/formato';

/**
 * Panel "Tu reserva": tarjeta lateral en desktop y barra fija inferior
 * (colapsable) en mobile. En el paso de datos, la barra mobile muestra
 * además el botón de confirmación (cta).
 */
@Component({
  selector: 'app-resumen-reserva',
  template: `
    <!-- Tarjeta desktop -->
    <aside class="panel tarjeta">
      <h3 class="titulo">Tu reserva</h3>
      @if (!store.servicio()) {
        <div class="vacio">
          Todavía no elegiste un servicio.<br />
          Seleccioná uno para comenzar.
        </div>
        <div class="fila">
          <span class="clave">Profesional</span>
          <span class="valor">
            {{ profesional.nombre }}
            <span class="mp">{{ profesional.matricula }}</span>
          </span>
        </div>
      } @else {
        <div class="servicio">
          <strong>{{ store.servicio()!.nombre }}</strong>
          <span>
            {{ store.servicio()!.duracionMin }} min ·
            <b class="precio">{{ precio(store.servicio()!.precio) }}</b>
          </span>
        </div>
        @if (store.fecha()) {
          <div class="fila">
            <span class="clave">Fecha</span>
            <span class="valor">{{ fecha(store.fecha()!) }}</span>
          </div>
        }
        @if (store.hora()) {
          <div class="fila">
            <span class="clave">Hora</span>
            <span class="valor">{{ store.hora() }} hs</span>
          </div>
        }
        <div class="fila">
          <span class="clave">Profesional</span>
          <span class="valor">
            {{ profesional.nombre }}
            <span class="mp">{{ profesional.matricula }}</span>
          </span>
        </div>
        <div class="total">
          <span>Total</span>
          <b>{{ precio(store.servicio()!.precio) }}</b>
        </div>
        @if (notaPago()) {
          <div class="nota">Se abona en el consultorio. No se requiere pago online.</div>
        }
      }
    </aside>

    <!-- Barra mobile -->
    <div class="barra" [class.abierta]="abierta()">
      <button
        type="button"
        class="barra-cabecera"
        (click)="abierta.set(!abierta())"
        [attr.aria-expanded]="abierta()"
      >
        <span class="barra-info">
          <span class="barra-titulo">Tu reserva</span>
          @if (store.servicio(); as s) {
            <span class="barra-detalle">
              <strong>{{ s.nombre }}</strong>
              @if (store.fecha() && store.hora()) {
                · {{ fecha(store.fecha()!) }} · {{ store.hora() }}
              }
              · <b class="precio">{{ precio(s.precio) }}</b>
            </span>
          } @else {
            <span class="barra-detalle">Elegí un servicio para comenzar</span>
          }
        </span>
        <span class="flecha" [class.girada]="abierta()">▲</span>
      </button>
      @if (abierta() && store.servicio()) {
        <div class="barra-cuerpo">
          <div class="fila">
            <span class="clave">Profesional</span>
            <span class="valor">
              {{ profesional.nombre }} · {{ profesional.matricula }}
            </span>
          </div>
          @if (store.fecha()) {
            <div class="fila">
              <span class="clave">Fecha</span>
              <span class="valor">{{ fecha(store.fecha()!) }}</span>
            </div>
          }
          @if (store.hora()) {
            <div class="fila">
              <span class="clave">Hora</span>
              <span class="valor">{{ store.hora() }} hs</span>
            </div>
          }
          @if (notaPago()) {
            <div class="nota">Se abona en el consultorio. No se requiere pago online.</div>
          }
        </div>
      }
      @if (cta()) {
        <div class="barra-cta">
          <button
            type="button"
            class="btn btn-primario"
            [disabled]="ctaDeshabilitada()"
            (click)="ctaClick.emit()"
          >
            {{ cta() }}
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .panel {
      padding: 1.25rem;
      position: sticky;
      top: 1rem;
    }
    .titulo {
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .vacio {
      border: 1.5px dashed var(--borde);
      border-radius: var(--radio-chico);
      padding: 1.25rem 1rem;
      text-align: center;
      color: var(--neutro);
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .servicio {
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      margin-bottom: 0.9rem;
      font-size: 0.9rem;
    }
    .servicio span {
      color: var(--neutro);
      font-size: 0.82rem;
    }
    .precio {
      color: var(--primario);
    }
    .fila {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.45rem 0;
      font-size: 0.85rem;
    }
    .clave {
      color: var(--neutro);
    }
    .valor {
      font-weight: 700;
      text-align: right;
    }
    .mp {
      display: block;
      color: var(--neutro-claro);
      font-weight: 500;
      font-size: 0.75rem;
    }
    .total {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid var(--borde);
      margin-top: 0.6rem;
      padding-top: 0.8rem;
      font-size: 0.95rem;
    }
    .total b {
      color: var(--primario);
    }
    .nota {
      margin-top: 0.9rem;
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      border-radius: var(--radio-chico);
      padding: 0.6rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Barra mobile */
    .barra {
      display: none;
    }
    @media (max-width: 720px) {
      .panel {
        display: none;
      }
      .barra {
        display: block;
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 20;
        background: var(--blanco);
        border-top: 1px solid var(--borde);
        box-shadow: 0 -4px 16px rgba(22, 48, 47, 0.08);
        padding: 0.6rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
      }
      .barra-cabecera {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        background: none;
        border: none;
        padding: 0;
        text-align: left;
        color: inherit;
      }
      .barra-info {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        min-width: 0;
      }
      .barra-titulo {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--neutro);
      }
      .barra-detalle {
        font-size: 0.85rem;
        color: var(--neutro);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .flecha {
        color: var(--neutro);
        font-size: 0.7rem;
        transition: transform 0.15s ease;
        flex-shrink: 0;
      }
      .flecha.girada {
        transform: rotate(180deg);
      }
      .barra-cuerpo {
        border-top: 1px solid var(--borde);
        margin-top: 0.6rem;
        padding-top: 0.4rem;
      }
      .barra-cta {
        margin-top: 0.6rem;
      }
      .barra-cta .btn {
        width: 100%;
      }
    }
  `,
})
export class ResumenReserva {
  protected readonly store = inject(ReservaStore);
  protected readonly profesional = PROFESIONAL;
  protected readonly abierta = signal(false);

  /** Muestra la nota "se abona en el consultorio" (paso de datos). */
  readonly notaPago = input(false);
  /** Etiqueta del botón de acción en la barra mobile (ej. "Confirmar turno"). */
  readonly cta = input<string | null>(null);
  readonly ctaDeshabilitada = input(false);
  readonly ctaClick = output<void>();

  protected precio = precioARS;
  protected fecha = fechaLarga;
}
