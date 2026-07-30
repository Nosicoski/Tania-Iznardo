import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaStore } from '../servicios/reserva-store';
import { CONSULTORIO } from '../datos/catalogo';
import { Profesional } from '../modelos';
import { conHora, fechaLarga, precioARS } from '../datos/formato';

/** Recordatorios de la demo: falta confirmarlos con el consultorio. */
const PREPARATIVOS = [
  {
    titulo: 'Llegá 10 minutos antes',
    detalle: 'Así podemos completar tu ficha con tranquilidad antes de empezar.',
  },
  {
    titulo: 'Traé ropa cómoda',
    detalle: 'Calzas o short y remera; en la sesión vas a necesitar moverte.',
  },
  {
    titulo: 'Estudios y documentación',
    detalle: 'Si tenés radiografías, resonancias o estudios recientes, traelos.',
  },
  {
    titulo: 'DNI y credencial',
    detalle: 'Documento y, si corresponde, la credencial de tu obra social.',
  },
  {
    titulo: 'Evitá comidas pesadas',
    detalle: 'Mejor no comer abundante en la hora previa al turno.',
  },
];

@Component({
  selector: 'app-confirmado',
  template: `
    <div class="contenedor">
      <div class="tarjeta panel">
        <div class="tilde">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
            <path
              d="m5 12.5 5 5L19 7"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h1>¡Turno confirmado!</h1>
        <p class="subtitulo">
          Te enviamos el detalle a tu correo y teléfono.<br />
          Recordá llegar 10 minutos antes.
        </p>

        <dl class="detalle">
          @if (store.servicio(); as s) {
            <div class="turno">
              <dt>
                {{ s.nombre }}
                <span class="dur">{{ s.duracionMin }} min</span>
                @if (store.profesionalFinal(); as p) {
                  <span class="dur">con {{ p.nombre }} · {{ credencial(p) }}</span>
                }
              </dt>
              <dd>
                {{ fecha(store.fecha()!) }}<span class="hora">{{ store.hora() }} hs</span>
              </dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{{ consultorio.direccion }}</dd>
            </div>
            <div>
              <dt>Valor</dt>
              <dd class="valor">{{ precio(s.precio) }} · se abona en el consultorio</dd>
            </div>
          }
        </dl>

        <!-- Recordatorios mockeados: falta la lista real del consultorio -->
        <section class="preparar">
          <h2>Prepará tu visita</h2>
          <ul>
            @for (item of preparativos; track item.titulo) {
              <li>
                <span class="check" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                    <path
                      d="M3 8.5 6.5 12 13 4.5"
                      stroke="currentColor"
                      stroke-width="2.4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span class="texto">
                  <b>{{ item.titulo }}</b>
                  <span>{{ item.detalle }}</span>
                </span>
              </li>
            }
          </ul>
        </section>

        <div class="acciones">
          <button type="button" class="btn btn-primario" (click)="agregarAlCalendario()">
            Agregar al calendario
          </button>
          <button type="button" class="btn btn-borde" (click)="volverAlInicio()">
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .contenedor {
      padding-top: 2.5rem;
    }
    .panel {
      max-width: 640px;
      margin: 0 auto;
      padding: 2.5rem 2rem;
      text-align: center;
    }
    .tilde {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      margin: 0 auto 1.25rem;
    }
    .subtitulo {
      color: var(--neutro);
      margin: 0.6rem 0 1.75rem;
    }
    .detalle {
      background: var(--fondo);
      border-radius: var(--radio-chico);
      padding: 1rem 1.25rem;
      margin: 0 0 1.75rem;
      text-align: left;
    }
    .detalle div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.45rem 0;
      font-size: 0.88rem;
    }
    dt {
      color: var(--neutro);
    }
    dd {
      margin: 0;
      font-weight: 700;
      text-align: right;
    }
    .turno {
      border-bottom: 1px solid var(--borde);
      padding-bottom: 0.7rem;
      margin-bottom: 0.3rem;
      align-items: flex-start;
    }
    .turno dt {
      color: var(--secundario);
      font-weight: 700;
      text-align: left;
    }
    .dur,
    .hora {
      display: block;
      font-weight: 500;
      font-size: 0.8rem;
      color: var(--neutro);
    }
    .hora {
      color: var(--primario);
      font-weight: 700;
    }
    .valor {
      color: var(--primario);
    }
    /* Prepará tu visita */
    .preparar {
      text-align: left;
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      padding: 1.25rem 1.4rem;
      margin-bottom: 1.75rem;
    }
    .preparar h2 {
      font-size: 0.95rem;
      margin-bottom: 0.9rem;
    }
    .preparar ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .preparar li {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
    }
    .check {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .texto {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      font-size: 0.85rem;
    }
    .texto b {
      color: var(--secundario);
    }
    .texto span {
      color: var(--neutro);
      line-height: 1.45;
    }

    .acciones {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    @media (max-width: 720px) {
      .contenedor {
        padding-bottom: 3rem; /* sin barra "Tu reserva" en esta página */
      }
      .acciones {
        flex-direction: column;
      }
      .acciones .btn {
        width: 100%;
      }
    }
  `,
})
export class Confirmado {
  private readonly router = inject(Router);
  protected readonly preparativos = PREPARATIVOS;
  protected readonly store = inject(ReservaStore);
  protected readonly consultorio = CONSULTORIO;
  protected readonly precio = precioARS;
  protected readonly fecha = fechaLarga;

  protected credencial(profesional: Profesional): string {
    return profesional.matricula ?? profesional.profesion;
  }

  protected agregarAlCalendario(): void {
    const marca = (d: Date) =>
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') +
      'T' +
      String(d.getHours()).padStart(2, '0') +
      String(d.getMinutes()).padStart(2, '0') +
      '00';

    const servicio = this.store.servicio();
    const fecha = this.store.fecha();
    const hora = this.store.hora();
    if (!servicio || !fecha || !hora) {
      return;
    }
    const profesional = this.store.profesionalFinal();
    const inicio = conHora(fecha, hora);
    const fin = new Date(inicio.getTime() + servicio.duracionMin * 60000);

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tania Iznardo Osteopatia//Turnos//ES',
      'BEGIN:VEVENT',
      `UID:turno-${servicio.id}-${marca(inicio)}@taniaiznardoosteopatia.com`,
      `DTSTART:${marca(inicio)}`,
      `DTEND:${marca(fin)}`,
      `SUMMARY:${servicio.nombre}${profesional ? ' · ' + profesional.nombre : ''}`,
      `LOCATION:${this.consultorio.direccion}, ${this.consultorio.ciudad}`,
      'DESCRIPTION:Recordá llegar 10 minutos antes. Se abona en el consultorio.',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'turno-tania-iznardo.ics';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  protected volverAlInicio(): void {
    this.store.reiniciar();
    this.router.navigate(['/servicio']);
  }
}
