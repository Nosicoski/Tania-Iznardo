import { Injectable, computed, inject, signal } from '@angular/core';
import { DatosContacto, Servicio, Tramo, TurnoGuardado } from '../modelos';
import { aHora, conHora } from '../datos/formato';
import { esCombinable } from '../datos/catalogo';
import { Consulta } from './disponibilidad';
import { AgendaGuardada } from './agenda-guardada';
import { Cuentas } from './cuentas';

/** Máximo de servicios en una misma visita. */
export const TOPE_SERVICIOS = 3;

/** Por qué un servicio no se puede sumar a la visita en curso. */
export type Impedimento =
  | 'tope'
  | 'ya-esta'
  /** Lo que se quiere agregar se reserva solo. */
  | 'no-combinable'
  /** En la visita ya hay un servicio que se reserva solo. */
  | 'visita-no-combinable';

/**
 * Estado de la reserva en curso. Una **visita** puede tener hasta
 * TOPE_SERVICIOS servicios: van consecutivos el mismo día, en el orden que
 * entre, y cada uno con su profesional. Los servicios no combinables
 * (programas y talleres) se reservan solos.
 */
@Injectable({ providedIn: 'root' })
export class ReservaStore {
  private readonly agenda = inject(AgendaGuardada);
  private readonly cuentas = inject(Cuentas);

  /** Servicios de la visita. El orden es el orden pretendido del bloque. */
  readonly carrito = signal<Servicio[]>([]);
  /** servicioId → profesionalId pedido a mano. Lo ausente lo asigna el sistema. */
  readonly preferidos = signal<Record<string, string>>({});
  /** El usuario reordenó a mano: dejamos de buscar el orden que mejor entra. */
  readonly ordenManual = signal(false);

  readonly fecha = signal<Date | null>(null);
  /** Hora de inicio del bloque completo. */
  readonly hora = signal<string | null>(null);
  /** La visita resuelta: quién atiende cada tramo y a qué hora. */
  readonly plan = signal<Tramo[] | null>(null);
  readonly datos = signal<DatosContacto | null>(null);
  readonly confirmada = signal(false);

  readonly hayServicios = computed(() => this.carrito().length > 0);
  readonly cantidad = computed(() => this.carrito().length);
  readonly total = computed(() =>
    this.carrito().reduce((suma, s) => suma + s.precio, 0)
  );
  /** Suma de los servicios, sin las transiciones (todavía no hay plan). */
  readonly duracionServicios = computed(() =>
    this.carrito().reduce((suma, s) => suma + s.duracionMin, 0)
  );
  /** Duración real del bloque, transiciones incluidas. Cae a la suma si no hay plan. */
  readonly duracionBloque = computed(() => {
    const plan = this.plan();
    if (!plan?.length) {
      return this.duracionServicios();
    }
    const ultimo = plan[plan.length - 1];
    return ultimo.inicioMin + ultimo.duracionMin - plan[0].inicioMin;
  });
  /** "12:50": a qué hora termina la visita. */
  readonly finBloque = computed(() => {
    const plan = this.plan();
    if (!plan?.length) {
      return null;
    }
    const ultimo = plan[plan.length - 1];
    return aHora(ultimo.inicioMin + ultimo.duracionMin);
  });

  /** La visita tiene un servicio que se reserva solo. */
  readonly esReservaUnica = computed(() => this.carrito().some((s) => !esCombinable(s)));
  readonly topeAlcanzado = computed(() => this.cantidad() >= TOPE_SERVICIOS);
  readonly listaParaDatos = computed(() => this.hayServicios() && this.plan() !== null);

  /** Lo que necesita Disponibilidad para resolver el bloque. */
  readonly consulta = computed<Consulta>(() => ({
    servicios: this.carrito(),
    preferidos: this.preferidos(),
    ordenFijo: this.ordenManual(),
    email: this.cuentas.sesion()?.email,
  }));

  // --- Carrito ------------------------------------------------------------

  enVisita(servicioId: string): boolean {
    return this.carrito().some((s) => s.id === servicioId);
  }

  /** null si se puede sumar; si no, el motivo para explicarlo en pantalla. */
  impedimentoPara(servicio: Servicio): Impedimento | null {
    if (this.enVisita(servicio.id)) {
      return 'ya-esta';
    }
    if (!this.hayServicios()) {
      return null;
    }
    if (this.esReservaUnica()) {
      return 'visita-no-combinable';
    }
    if (!esCombinable(servicio)) {
      return 'no-combinable';
    }
    return this.topeAlcanzado() ? 'tope' : null;
  }

  agregar(servicio: Servicio): void {
    if (this.impedimentoPara(servicio)) {
      return;
    }
    this.carrito.update((lista) => [...lista, servicio]);
    this.invalidarBloque();
  }

  quitar(servicioId: string): void {
    this.carrito.update((lista) => lista.filter((s) => s.id !== servicioId));
    this.preferidos.update(({ [servicioId]: _fuera, ...resto }) => resto);
    if (this.cantidad() < 2) {
      this.ordenManual.set(false);
    }
    this.invalidarBloque();
  }

  /** Vacía la visita y arranca de nuevo con un solo servicio. */
  reemplazarPor(servicio: Servicio): void {
    this.vaciar();
    this.carrito.set([servicio]);
  }

  vaciar(): void {
    this.carrito.set([]);
    this.preferidos.set({});
    this.ordenManual.set(false);
    this.invalidarBloque();
  }

  /** Sube (-1) o baja (+1) un servicio en el orden de la visita. */
  mover(servicioId: string, delta: number): void {
    const desde = this.carrito().findIndex((s) => s.id === servicioId);
    if (desde !== -1) {
      this.reubicar(servicioId, desde + delta);
    }
  }

  /** Lleva un servicio a una posición concreta (lo usa el drag and drop). */
  reubicar(servicioId: string, hasta: number): void {
    const lista = [...this.carrito()];
    const desde = lista.findIndex((s) => s.id === servicioId);
    if (desde === -1 || hasta < 0 || hasta >= lista.length || desde === hasta) {
      return;
    }
    lista.splice(hasta, 0, ...lista.splice(desde, 1));
    this.carrito.set(lista);
    // A partir de acá manda el orden del usuario, no el que mejor entra.
    this.ordenManual.set(true);
    this.invalidarBloque();
  }

  /** Vuelve a dejar que el sistema busque el orden que entra. */
  soltarOrden(): void {
    this.ordenManual.set(false);
    this.invalidarBloque();
  }

  // --- Agenda -------------------------------------------------------------

  elegirFecha(fecha: Date): void {
    this.fecha.set(fecha);
    this.invalidarBloque();
  }

  /** `plan` viene ya resuelto por Disponibilidad para esa hora de inicio. */
  elegirBloque(hora: string, plan: Tramo[]): void {
    this.hora.set(hora);
    this.plan.set(plan);
  }

  /** Suelta el horario elegido sin perder el día (la cruz sobre la hora). */
  soltarBloque(): void {
    this.hora.set(null);
    this.plan.set(null);
  }

  /** Fija (o suelta, con null) el profesional de un servicio de la visita. */
  fijarProfesional(servicioId: string, profesionalId: string | null): void {
    this.preferidos.update((actual) => {
      const { [servicioId]: _fuera, ...resto } = actual;
      return profesionalId ? { ...resto, [servicioId]: profesionalId } : resto;
    });
    this.invalidarBloque();
  }

  profesionalFijado(servicioId: string): string | null {
    return this.preferidos()[servicioId] ?? null;
  }

  // --- Confirmación -------------------------------------------------------

  /** Confirma la visita y persiste sus turnos para que esas franjas se ocupen. */
  confirmar(datos: DatosContacto): void {
    const plan = this.plan();
    const fecha = this.fecha();
    if (!plan?.length || !fecha) {
      return;
    }
    this.datos.set(datos);
    this.confirmada.set(true);
    const reservaId = nuevoReservaId();
    const email = this.cuentas.sesion()?.email;
    const paciente = `${datos.nombre} ${datos.apellido}`.trim();
    this.agenda.guardarVarios(
      plan.map<TurnoGuardado>((tramo) => ({
        servicioId: tramo.servicio.id,
        profesionalId: tramo.profesional.id,
        inicio: conHora(fecha, aHora(tramo.inicioMin)).getTime(),
        duracionMin: tramo.duracionMin,
        // Con sesión iniciada la visita queda en "Mis turnos" de esa cuenta.
        email,
        paciente,
        reservaId,
      }))
    );
  }

  reiniciar(): void {
    this.vaciar();
    this.fecha.set(null);
    this.datos.set(null);
  }

  /** Cualquier cambio en la visita invalida el horario ya elegido. */
  private invalidarBloque(): void {
    this.hora.set(null);
    this.plan.set(null);
    this.confirmada.set(false);
  }
}

function nuevoReservaId(): string {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
