import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ReservaStore } from '../servicios/reserva-store';
import { Profesional, Servicio } from '../modelos';
import { aHora, duracionTexto, fechaCorta, fechaLargaCompleta, precioARS } from '../datos/formato';

/** La línea del resumen: el servicio y, si ya está resuelto, su horario. */
interface Linea {
  servicio: Servicio;
  profesional: Profesional | null;
  hora: string | null;
  fin: string | null;
  automatico: boolean;
}

/**
 * Panel "Tu reserva" del turno en curso: tarjeta lateral en desktop y barra
 * fija inferior (colapsable) en mobile. En el paso de datos, la barra mobile
 * muestra además el botón de confirmación (cta).
 */
@Component({
  selector: 'app-resumen-reserva',
  template: `
    <!-- Tarjeta desktop -->
    <aside class="panel tarjeta">
      <h3 class="titulo">Tu reserva</h3>
      @if (store.hayServicio()) {
        <!-- El día con todas sus letras; la hora vive en el renglón del servicio -->
        @if (store.fecha(); as f) {
          <p class="dia">{{ fecha(f) }}</p>
        }
        <div class="lineas">
          @if (linea(); as l) {
            <div class="servicio">
              <strong>{{ l.servicio.nombre }}</strong>
              <span>
                {{ duracion(l.servicio.duracionMin) }} ·
                <b class="precio">{{ precio(l.servicio.precio) }}</b>
              </span>
              @if (l.hora) {
                <span class="cuando">{{ l.hora }} – {{ l.fin }} hs</span>
              } @else {
                <span class="pendiente">Falta elegir fecha y hora</span>
              }
              @if (l.profesional; as p) {
                <span class="con">
                  con {{ p.nombre }} · {{ credencial(p) }}
                  @if (l.automatico) {
                    <i class="auto">asignado automáticamente</i>
                  }
                </span>
              } @else {
                <span class="pendiente">Profesional a asignar</span>
              }
            </div>
          }
        </div>
        <div class="total">
          <span>Total</span>
          <b>{{ precio(store.total()) }}</b>
        </div>
        @if (notaPago()) {
          <div class="nota">Se abona en el consultorio. No se requiere pago online.</div>
        }
      } @else {
        <div class="vacio">
          Todavía no elegiste un servicio.<br />
          Seleccioná uno para comenzar.
        </div>
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
          @if (store.servicio(); as servicio) {
            <span class="barra-detalle">
              <strong>{{ servicio.nombre }}</strong>
              @if (store.fecha(); as f) {
                @if (store.hora(); as h) {
                  · {{ corta(f, h) }}
                }
              }
              · <b class="precio">{{ precio(store.total()) }}</b>
            </span>
          } @else {
            <span class="barra-detalle">Elegí un servicio para comenzar</span>
          }
        </span>
        <span class="flecha" [class.girada]="abierta()">▲</span>
      </button>
      @if (abierta() && store.hayServicio()) {
        <div class="barra-cuerpo">
          @if (linea(); as l) {
            <div class="fila">
              <span class="clave">
                {{ l.servicio.nombre }}
                @if (l.hora) {
                  <span class="cuando">{{ l.hora }} – {{ l.fin }} hs</span>
                } @else {
                  <span class="pendiente">Falta elegir fecha y hora</span>
                }
                @if (l.profesional; as p) {
                  <span class="con">con {{ p.nombre }}</span>
                } @else {
                  <span class="pendiente">Profesional a asignar</span>
                }
              </span>
              <span class="valor">{{ precio(l.servicio.precio) }}</span>
            </div>
          }
          <div class="fila">
            <span class="clave">Total · {{ duracion(store.duracionServicio()) }}</span>
            <span class="valor precio">{{ precio(store.total()) }}</span>
          </div>
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
    /* Día de la visita: una sola vez arriba, con el día de la semana entero */
    .dia {
      margin: 0 0 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--secundario);
    }
    .lineas {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 0.9rem;
    }
    .servicio {
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.9rem;
    }
    .servicio strong {
      line-height: 1.3;
    }
    /*
     * Solo los renglones de datos, que son hijos directos del bloque del
     * servicio.
     */
    .servicio > span {
      color: var(--neutro);
      font-size: 0.82rem;
    }
    .cuando {
      color: var(--secundario) !important;
      font-weight: 700;
    }
    .pendiente {
      color: var(--neutro-claro) !important;
      font-style: italic;
    }
    /* Profesional asignado al turno */
    .con {
      color: var(--secundario) !important;
      font-weight: 600;
    }
    .auto {
      display: block;
      color: var(--neutro);
      font-weight: 500;
      font-size: 0.75rem;
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
    @media (max-width: 1024px) {
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
        max-height: 45vh;
        overflow-y: auto;
      }
      .barra-cuerpo .cuando,
      .barra-cuerpo .pendiente,
      .barra-cuerpo .con {
        display: block;
        font-size: 0.78rem;
      }
      .barra-cuerpo .fila {
        align-items: flex-start;
      }
      .barra-cuerpo .clave {
        flex: 1;
        min-width: 0;
      }
      .barra-cuerpo .valor {
        white-space: nowrap;
      }
      .barra-cta {
        margin-top: 0.6rem;
      }
      .barra-cta .btn {
        width: 100%;
      }
      /* Visible desde el arranque, atenuado hasta que la reserva esté completa. */
      .barra-cta .btn:disabled {
        opacity: 0.45;
        cursor: default;
      }
    }
  `,
})
export class ResumenReserva {
  protected readonly store = inject(ReservaStore);
  protected readonly abierta = signal(false);

  /** Con el turno resuelto manda el plan; si no, el servicio sin horario. */
  protected readonly linea = computed<Linea | null>(() => {
    const plan = this.store.plan();
    if (plan?.length) {
      const t = plan[0];
      return {
        servicio: t.servicio,
        profesional: t.profesional,
        hora: aHora(t.inicioMin),
        fin: aHora(t.inicioMin + t.duracionMin),
        automatico: t.automatico,
      };
    }
    const servicio = this.store.servicio();
    return servicio
      ? { servicio, profesional: null, hora: null, fin: null, automatico: false }
      : null;
  });

  protected credencial(profesional: Profesional): string {
    return profesional.matricula ?? profesional.profesion;
  }

  /** Muestra la nota "se abona en el consultorio" (paso de datos). */
  readonly notaPago = input(false);
  /** Etiqueta del botón de acción en la barra mobile (ej. "Confirmar turno"). */
  readonly cta = input<string | null>(null);
  readonly ctaDeshabilitada = input(false);
  readonly ctaClick = output<void>();

  protected precio = precioARS;
  protected fecha = fechaLargaCompleta;
  protected corta = fechaCorta;
  protected duracion = duracionTexto;
}
