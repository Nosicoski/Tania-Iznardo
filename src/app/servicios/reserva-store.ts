import { Injectable, computed, inject, signal } from '@angular/core';
import { DatosContacto, Profesional, Servicio } from '../modelos';
import { conHora } from '../datos/formato';
import { AgendaGuardada } from './agenda-guardada';
import { Cuentas } from './cuentas';

/**
 * Estado de la reserva en curso. El usuario agenda **un solo turno por vez**:
 * un servicio, un profesional, un día y un horario.
 */
@Injectable({ providedIn: 'root' })
export class ReservaStore {
  private readonly agenda = inject(AgendaGuardada);
  private readonly cuentas = inject(Cuentas);

  readonly servicio = signal<Servicio | null>(null);
  /** Profesional elegido a mano; null mientras esté en "Cualquiera disponible". */
  readonly profesional = signal<Profesional | null>(null);
  /** Quién termina atendiendo: en modo "cualquiera" se resuelve al elegir la hora. */
  private readonly asignado = signal<Profesional | null>(null);
  readonly fecha = signal<Date | null>(null);
  readonly hora = signal<string | null>(null);
  readonly datos = signal<DatosContacto | null>(null);
  readonly confirmada = signal(false);

  /** El profesional definitivo del turno (el elegido o el asignado automáticamente). */
  readonly profesionalFinal = computed(() => this.profesional() ?? this.asignado());
  /** El equipo lo asignó la página, el usuario no lo eligió. */
  readonly profesionalAutomatico = computed(
    () => this.profesional() === null && this.asignado() !== null
  );

  readonly hayServicio = computed(() => this.servicio() !== null);
  readonly hayHorario = computed(() => this.fecha() !== null && this.hora() !== null);
  /** Listo para pasar al paso de datos: servicio, horario y profesional asignado. */
  readonly listaParaDatos = computed(
    () => this.hayServicio() && this.hayHorario() && this.profesionalFinal() !== null
  );

  /** Elige el servicio y descarta el horario anterior (es otro turno). */
  elegirServicio(servicio: Servicio): void {
    this.servicio.set(servicio);
    this.profesional.set(null);
    this.asignado.set(null);
    this.fecha.set(null);
    this.hora.set(null);
    this.confirmada.set(false);
  }

  elegirProfesional(profesional: Profesional | null): void {
    this.profesional.set(profesional);
    // El horario elegido puede no existir en la agenda del nuevo profesional.
    this.hora.set(null);
    this.asignado.set(null);
  }

  elegirFecha(fecha: Date): void {
    this.fecha.set(fecha);
    this.hora.set(null);
    this.asignado.set(null);
  }

  /** `atiende` es quien queda a cargo del turno en esa franja. */
  elegirHora(hora: string, atiende: Profesional): void {
    this.hora.set(hora);
    this.asignado.set(atiende);
  }

  /** Confirma el turno y lo persiste para que esa franja deje de ofrecerse. */
  confirmar(datos: DatosContacto): void {
    const servicio = this.servicio();
    const profesional = this.profesionalFinal();
    const fecha = this.fecha();
    const hora = this.hora();
    if (!servicio || !profesional || !fecha || !hora) {
      return;
    }
    this.datos.set(datos);
    this.confirmada.set(true);
    this.agenda.guardar({
      servicioId: servicio.id,
      profesionalId: profesional.id,
      inicio: conHora(fecha, hora).getTime(),
      duracionMin: servicio.duracionMin,
      // Con sesión iniciada el turno queda en "Mis turnos" de esa cuenta.
      email: this.cuentas.sesion()?.email,
      paciente: `${datos.nombre} ${datos.apellido}`.trim(),
    });
  }

  reiniciar(): void {
    this.servicio.set(null);
    this.profesional.set(null);
    this.asignado.set(null);
    this.fecha.set(null);
    this.hora.set(null);
    this.datos.set(null);
    this.confirmada.set(false);
  }
}
