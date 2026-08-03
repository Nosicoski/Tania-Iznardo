import { Injectable, inject, signal } from '@angular/core';
import { DatosContacto, Tramo } from '../modelos';
import { Negocio } from './negocio';
import { aHora, conHora, duracionTexto, fechaLarga, precioARS } from '../datos/formato';

/** Estado del envío, para avisar en la pantalla de confirmación. */
export type EstadoMail = 'inactivo' | 'enviando' | 'enviado' | 'error';

interface Visita {
  fecha: Date;
  plan: Tramo[];
  horaInicio: string;
  horaFin: string;
  total: number;
  reservaId: string;
  datos: DatosContacto;
}

/**
 * Mail de confirmación del turno. El envío lo hace `servidor/mail.mjs` (la API
 * key de Resend no puede estar acá); desde el front solo se arma el detalle y
 * se postea. Si el servidor no está levantado el turno se confirma igual: el
 * mail es un extra, no un paso del flujo.
 */
@Injectable({ providedIn: 'root' })
export class Notificaciones {
  readonly estado = signal<EstadoMail>('inactivo');
  readonly error = signal<string | null>(null);

  /** El mail lleva la dirección del negocio dueño de la agenda, no una fija. */
  private readonly negocio = inject(Negocio);

  async enviarConfirmacion(visita: Visita): Promise<void> {
    this.estado.set('enviando');
    this.error.set(null);

    try {
      const respuesta = await fetch('/api/turno-confirmado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.armar(visita)),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        throw new Error(cuerpo.error ?? this.explicar(respuesta.status));
      }
      this.estado.set('enviado');
    } catch (error) {
      const detalle = error instanceof Error ? error.message : 'No se pudo enviar el mail';
      this.estado.set('error');
      this.error.set(detalle);
      // La pantalla de confirmación ya no muestra el fallo: sin esto, un mail
      // que no sale no deja rastro en ningún lado.
      console.error('[mail] no se envió la confirmación:', detalle);
    }
  }

  /**
   * Un código pelado no dice nada. El 500 casi siempre es el proxy de Angular
   * avisando que nadie escucha en el puerto del servidor de mails.
   */
  private explicar(estado: number): string {
    if (estado === 500 || estado === 502 || estado === 504) {
      return (
        'El servidor de mails no está respondiendo. Levantalo con "npm run mail" ' +
        '(o usá "npm run dev", que arranca los dos juntos).'
      );
    }
    return `El servidor respondió ${estado}`;
  }

  reiniciar(): void {
    this.estado.set('inactivo');
    this.error.set(null);
  }

  /** Todo lo que el mail necesita, ya formateado: el servidor no repite lógica. */
  private armar(visita: Visita) {
    const { fecha, plan, datos } = visita;
    const negocio = this.negocio.datos();
    const tramos = plan.map((tramo) => {
      const inicio = conHora(fecha, aHora(tramo.inicioMin));
      const fin = new Date(inicio.getTime() + tramo.duracionMin * 60000);
      return {
        servicio: tramo.servicio.nombre,
        profesional: tramo.profesional.nombre,
        hora: aHora(tramo.inicioMin),
        duracion: duracionTexto(tramo.duracionMin),
        precio: precioARS(tramo.servicio.precio),
        inicioISO: inicio.toISOString(),
        finISO: fin.toISOString(),
      };
    });

    return {
      paciente: datos.nombre,
      email: datos.email,
      fechaTexto: fechaLarga(fecha),
      horaInicio: visita.horaInicio,
      horaFin: visita.horaFin,
      inicioISO: tramos[0].inicioISO,
      finISO: tramos[tramos.length - 1].finISO,
      tramos,
      total: precioARS(visita.total),
      direccion: `${negocio.direccion}, ${negocio.ciudad}`,
      observaciones: datos.observaciones?.trim() || undefined,
      reservaId: visita.reservaId,
      baseUrl: location.origin,
    };
  }
}
