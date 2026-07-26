import { Component, computed, input, output, signal } from '@angular/core';
import {
  fechaLarga,
  inicioDeMes,
  inicioDelDia,
  mesYAnio,
  mismoDia,
  mismoMes,
  sumarMeses,
} from '../datos/formato';

const NOMBRES_DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

interface Celda {
  clave: string;
  fecha: Date | null;
  disponible: boolean;
}

/**
 * Calendario mensual: los días sin agenda quedan en gris y los que tienen
 * horarios compatibles muestran un punto debajo del número.
 */
@Component({
  selector: 'app-calendario-mes',
  template: `
    <div class="cabecera">
      <button
        type="button"
        class="flecha"
        (click)="mover(-1)"
        [disabled]="!puedeRetroceder()"
        aria-label="Mes anterior"
      >
        ‹
      </button>
      <span class="titulo">{{ etiqueta() }}</span>
      <button
        type="button"
        class="flecha"
        (click)="mover(1)"
        [disabled]="!puedeAvanzar()"
        aria-label="Mes siguiente"
      >
        ›
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
      gap: 0.5rem;
      margin-bottom: 1.1rem;
    }
    .titulo {
      font-weight: 700;
      font-size: 1rem;
      color: var(--secundario);
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
    }
    .flecha:hover:not(:disabled) {
      background: var(--primario-suave);
    }
    .flecha:disabled {
      color: var(--neutro-claro);
      opacity: 0.5;
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
    }
  `,
})
export class CalendarioMes {
  readonly seleccionada = input<Date | null>(null);
  /** Predicado de disponibilidad; se evalúa dentro de un computed, así que puede leer signals. */
  readonly disponible = input.required<(fecha: Date) => boolean>();
  /** Cuántos meses hacia adelante se pueden navegar. */
  readonly mesesMaximos = input(3);
  readonly elegir = output<Date>();

  protected readonly nombresDias = NOMBRES_DIAS;

  private readonly hoy = inicioDelDia(new Date());
  private readonly mesVisible = signal(inicioDeMes(new Date()));

  protected readonly etiqueta = computed(() => mesYAnio(this.mesVisible()));

  protected readonly puedeRetroceder = computed(
    () => !mismoMes(this.mesVisible(), this.hoy)
  );

  protected readonly puedeAvanzar = computed(
    () => this.mesVisible() < sumarMeses(this.hoy, this.mesesMaximos())
  );

  protected readonly celdas = computed<Celda[]>(() => {
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
  });

  protected etiquetaDia = fechaLarga;

  protected esSeleccionado(fecha: Date): boolean {
    const elegida = this.seleccionada();
    return !!elegida && mismoDia(elegida, fecha);
  }

  protected mover(meses: number): void {
    this.mesVisible.update((m) => sumarMeses(m, meses));
  }

  /** Deja visible el mes de una fecha dada (al volver a un turno ya agendado). */
  mostrarMesDe(fecha: Date): void {
    this.mesVisible.set(inicioDeMes(fecha));
  }
}
