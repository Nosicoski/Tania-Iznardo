import { Component, computed, input, output, signal } from '@angular/core';
import {
  fechaLarga,
  inicioDeMes,
  inicioDeSemana,
  inicioDelDia,
  mesYAnio,
  mismoDia,
  mismoMes,
  rangoSemana,
  sumarDias,
  sumarMeses,
} from '../datos/formato';

const NOMBRES_DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

type Vista = 'semana' | 'mes';

interface Celda {
  clave: string;
  fecha: Date | null;
  disponible: boolean;
}

/**
 * Calendario de disponibilidad. Arranca en vista semanal (la agenda cercana es
 * lo que más se usa) y el botón de la derecha alterna a la vista mensual. Los
 * días sin agenda quedan en gris; los que tienen horarios muestran un punto.
 */
@Component({
  selector: 'app-calendario',
  template: `
    <div class="cabecera">
      <div class="navegacion">
        <button
          type="button"
          class="flecha"
          (click)="mover(-1)"
          [disabled]="!puedeRetroceder()"
          [attr.aria-label]="esSemana() ? 'Semana anterior' : 'Mes anterior'"
        >
          ‹
        </button>
        <span class="titulo">{{ etiqueta() }}</span>
        <button
          type="button"
          class="flecha"
          (click)="mover(1)"
          [disabled]="!puedeAvanzar()"
          [attr.aria-label]="esSemana() ? 'Semana siguiente' : 'Mes siguiente'"
        >
          ›
        </button>
      </div>

      <!-- Un calendario "lleno" para el mes y uno de una sola fila para la semana -->
      <button
        type="button"
        class="cambiar-vista"
        (click)="alternarVista()"
        [attr.aria-label]="esSemana() ? 'Ver el mes completo' : 'Ver solo la semana'"
        [attr.title]="esSemana() ? 'Ver el mes completo' : 'Ver solo la semana'"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
          <rect
            x="3.2"
            y="4.8"
            width="17.6"
            height="15"
            rx="3"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <path d="M3.2 9.4h17.6" stroke="currentColor" stroke-width="1.6" />
          <path
            d="M8 2.8v3.2M16 2.8v3.2"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
          @if (esSemana()) {
            <!-- destino: mes -->
            <g fill="currentColor">
              <rect x="6.4" y="11.6" width="2.6" height="2.4" rx="0.8" />
              <rect x="10.7" y="11.6" width="2.6" height="2.4" rx="0.8" />
              <rect x="15" y="11.6" width="2.6" height="2.4" rx="0.8" />
              <rect x="6.4" y="15.6" width="2.6" height="2.4" rx="0.8" />
              <rect x="10.7" y="15.6" width="2.6" height="2.4" rx="0.8" />
              <rect x="15" y="15.6" width="2.6" height="2.4" rx="0.8" />
            </g>
          } @else {
            <!-- destino: semana (una sola fila) -->
            <g fill="currentColor">
              <rect x="6.4" y="13.6" width="2.6" height="2.4" rx="0.8" />
              <rect x="10.7" y="13.6" width="2.6" height="2.4" rx="0.8" />
              <rect x="15" y="13.6" width="2.6" height="2.4" rx="0.8" />
            </g>
          }
        </svg>
      </button>
    </div>

    <div class="semana">
      @for (d of nombresDias; track d) {
        <span>{{ d }}</span>
      }
    </div>

    <div class="grilla">
      @for (celda of celdas(); track celda.clave) {
        @if (celda.fecha) {
          <button
            type="button"
            class="dia"
            [class.seleccionado]="esSeleccionado(celda.fecha)"
            [disabled]="!celda.disponible"
            [attr.aria-label]="etiquetaDia(celda.fecha)"
            [attr.aria-pressed]="esSeleccionado(celda.fecha)"
            (click)="elegir.emit(celda.fecha)"
          >
            <span class="numero">{{ celda.fecha.getDate() }}</span>
            @if (celda.disponible) {
              <span class="punto"></span>
            }
          </button>
        } @else {
          <span class="hueco"></span>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1.1rem;
    }
    .navegacion {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
    }
    .titulo {
      font-weight: 700;
      font-size: 1rem;
      color: var(--secundario);
      white-space: nowrap;
    }
    .flecha {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: none;
      color: var(--primario);
      font-size: 1.3rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .flecha:hover:not(:disabled) {
      background: var(--primario-suave);
    }
    .flecha:disabled {
      color: var(--neutro-claro);
      opacity: 0.5;
    }
    .cambiar-vista {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      background: var(--blanco);
      border: 1.5px solid var(--borde);
      border-radius: 50%;
      padding: 0;
      color: var(--primario);
    }
    .cambiar-vista:hover {
      border-color: var(--primario);
      background: var(--primario-suave);
    }
    .semana,
    .grilla {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
    }
    .semana {
      margin-bottom: 0.35rem;
    }
    .semana span {
      text-align: center;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--neutro);
    }
    .dia {
      background: none;
      border: none;
      padding: 0.3rem 0 0.15rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }
    .numero {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--secundario);
    }
    .punto {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--primario);
    }
    .dia:disabled .numero {
      color: var(--neutro-claro);
      opacity: 0.65;
    }
    .dia:not(:disabled, .seleccionado):hover .numero {
      background: var(--primario-suave);
    }
    .dia.seleccionado .numero {
      background: var(--primario);
      color: var(--blanco);
    }
    .dia.seleccionado .punto {
      background: var(--terciario);
    }
    .hueco {
      display: block;
      height: 100%;
    }
    @media (max-width: 720px) {
      .numero {
        width: 32px;
        height: 32px;
        font-size: 0.9rem;
      }
      .titulo {
        font-size: 0.9rem;
      }
      .cambiar-vista {
        width: 32px;
        height: 32px;
      }
    }
  `,
})
export class Calendario {
  readonly seleccionada = input<Date | null>(null);
  /** Predicado de disponibilidad; se evalúa dentro de un computed, así que puede leer signals. */
  readonly disponible = input.required<(fecha: Date) => boolean>();
  /** Cuántos meses hacia adelante se pueden navegar. */
  readonly mesesMaximos = input(3);
  readonly elegir = output<Date>();

  protected readonly nombresDias = NOMBRES_DIAS;

  private readonly hoy = inicioDelDia(new Date());
  private readonly vista = signal<Vista>('semana');
  /** Día de referencia: define la semana o el mes que se está mirando. */
  private readonly referencia = signal(inicioDelDia(new Date()));

  protected readonly esSemana = computed(() => this.vista() === 'semana');

  private readonly lunesVisible = computed(() => inicioDeSemana(this.referencia()));
  private readonly mesVisible = computed(() => inicioDeMes(this.referencia()));
  /** Hasta dónde se puede navegar hacia adelante. */
  private readonly tope = computed(() => sumarMeses(this.hoy, this.mesesMaximos()));

  protected readonly etiqueta = computed(() =>
    this.esSemana() ? rangoSemana(this.lunesVisible()) : mesYAnio(this.mesVisible())
  );

  protected readonly puedeRetroceder = computed(() =>
    this.esSemana()
      ? this.lunesVisible() > inicioDeSemana(this.hoy)
      : !mismoMes(this.mesVisible(), this.hoy)
  );

  protected readonly puedeAvanzar = computed(() =>
    this.esSemana() ? this.lunesVisible() < this.tope() : this.mesVisible() < this.tope()
  );

  protected readonly celdas = computed<Celda[]>(() =>
    this.esSemana() ? this.celdasDeSemana() : this.celdasDeMes()
  );

  protected etiquetaDia = fechaLarga;

  protected esSeleccionado(fecha: Date): boolean {
    const elegida = this.seleccionada();
    return !!elegida && mismoDia(elegida, fecha);
  }

  protected alternarVista(): void {
    this.vista.update((v) => (v === 'semana' ? 'mes' : 'semana'));
  }

  protected mover(pasos: number): void {
    this.referencia.update((ref) =>
      this.esSemana()
        ? sumarDias(inicioDeSemana(ref), pasos * 7)
        : sumarMeses(ref, pasos)
    );
  }

  /** Deja visible el período de una fecha dada (al volver a un turno ya elegido). */
  mostrarFecha(fecha: Date): void {
    this.referencia.set(inicioDelDia(fecha));
  }

  private celdasDeSemana(): Celda[] {
    const lunes = this.lunesVisible();
    const estaDisponible = this.disponible();
    return Array.from({ length: 7 }, (_, i) => {
      const fecha = sumarDias(lunes, i);
      return {
        clave: fecha.toDateString(),
        fecha,
        disponible: estaDisponible(fecha),
      };
    });
  }

  private celdasDeMes(): Celda[] {
    const mes = this.mesVisible();
    const estaDisponible = this.disponible();
    const primerDiaSemana = (mes.getDay() + 6) % 7; // lunes = 0
    const diasDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();

    const celdas: Celda[] = Array.from({ length: primerDiaSemana }, (_, i) => ({
      clave: `hueco-${i}`,
      fecha: null,
      disponible: false,
    }));

    for (let dia = 1; dia <= diasDelMes; dia++) {
      const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia);
      celdas.push({
        clave: fecha.toDateString(),
        fecha,
        disponible: estaDisponible(fecha),
      });
    }
    return celdas;
  }
}
