import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaStore } from '../servicios/reserva-store';
import { CONSULTORIO, PROFESIONAL } from '../datos/catalogo';
import { fechaLarga, precioARS } from '../datos/formato';

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
          <div>
            <dt>Servicio</dt>
            <dd>{{ store.servicio()!.nombre }} · {{ store.servicio()!.duracionMin }} min</dd>
          </div>
          <div>
            <dt>Fecha y hora</dt>
            <dd>{{ fecha(store.fecha()!) }} · {{ store.hora() }} hs</dd>
          </div>
          <div>
            <dt>Profesional</dt>
            <dd>{{ profesional.nombre }} · {{ profesional.matricula }}</dd>
          </div>
          <div>
            <dt>Dirección</dt>
            <dd>{{ consultorio.direccion }}</dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd class="valor">
              {{ precio(store.servicio()!.precio) }} · se abona en el consultorio
            </dd>
          </div>
        </dl>

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
    .valor {
      color: var(--primario);
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
  protected readonly store = inject(ReservaStore);
  protected readonly profesional = PROFESIONAL;
  protected readonly consultorio = CONSULTORIO;
  protected readonly precio = precioARS;
  protected readonly fecha = fechaLarga;

  protected agregarAlCalendario(): void {
    const servicio = this.store.servicio()!;
    const fecha = this.store.fecha()!;
    const [horas, minutos] = this.store.hora()!.split(':').map(Number);

    const inicio = new Date(fecha);
    inicio.setHours(horas, minutos, 0, 0);
    const fin = new Date(inicio.getTime() + servicio.duracionMin * 60000);

    const marca = (d: Date) =>
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') +
      'T' +
      String(d.getHours()).padStart(2, '0') +
      String(d.getMinutes()).padStart(2, '0') +
      '00';

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tania Iznardo Osteopatia//Turnos//ES',
      'BEGIN:VEVENT',
      `UID:turno-${marca(inicio)}@taniaiznardoosteopatia.com`,
      `DTSTART:${marca(inicio)}`,
      `DTEND:${marca(fin)}`,
      `SUMMARY:${servicio.nombre} · ${this.profesional.nombre}`,
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
