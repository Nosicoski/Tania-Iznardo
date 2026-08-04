import { Injectable, computed, inject, signal } from '@angular/core';
import { DatosContacto, Servicio, Tramo, TurnoGuardado } from '../modelos';
import { aHora, conHora } from '../datos/formato';
import { Consulta, Disponibilidad, PlanInvalido } from './disponibilidad';
import { AgendaGuardada } from './agenda-guardada';
import { Cuentas } from './cuentas';

/** Por qué no se pudo cerrar la reserva. Define el mensaje que ve el paciente. */
export type FalloConfirmacion =
  /** Se intentó confirmar dos veces la misma reserva (atrás del navegador, doble clic). */
  | 'ya-confirmada'
  /** No hay bloque elegido: hay que volver a la agenda. */
  | 'sin-plan'
  | PlanInvalido;

export type ResultadoConfirmacion = { ok: true } | { ok: false; motivo: FalloConfirmacion };

/** El mail identifica al paciente, así que se compara siempre normalizado. */
function normalizarEmail(email: string | null | undefined): string | null {
  const limpio = email?.trim().toLowerCase();
  return limpio ? limpio : null;
}

/**
 * Estado de la reserva en curso. Cada reserva es de **un solo servicio**: se
 * elige del catálogo, se agenda y se confirma. Al confirmar se puede dejar
 * anotado un servicio combinable para agendarlo a continuación, en su propio
 * día y horario.
 */
@Injectable({ providedIn: 'root' })
export class ReservaStore {
  private readonly agenda = inject(AgendaGuardada);
  private readonly cuentas = inject(Cuentas);
  private readonly disponibilidad = inject(Disponibilidad);

  /** El servicio que se está reservando. */
  readonly servicio = signal<Servicio | null>(null);
  /** servicioId → profesionalId pedido a mano. Lo ausente lo asigna el sistema. */
  readonly preferidos = signal<Record<string, string>>({});

  readonly fecha = signal<Date | null>(null);
  /** Hora de inicio del turno. */
  readonly hora = signal<string | null>(null);
  /** El turno resuelto: quién atiende y a qué hora. */
  readonly plan = signal<Tramo[] | null>(null);
  readonly datos = signal<DatosContacto | null>(null);
  readonly confirmada = signal(false);
  /**
   * Servicio combinable que el paciente aceptó sumar. Se agenda aparte, con su
   * propio día y horario, apenas se confirma la reserva en curso.
   */
  readonly combinablePendiente = signal<Servicio | null>(null);
  /**
   * Id de la reserva recién confirmada. Lo usa la pantalla de confirmación para
   * adjuntarla a la cuenta si el paciente se registra ahí mismo.
   */
  readonly ultimaReserva = signal<string | null>(null);
  /**
   * Mail de quien está reservando cuando no hay sesión. Lo carga el paso de
   * datos: a partir de ahí el invitado es una identidad igual que un usuario
   * con cuenta y sus propios turnos le bloquean horarios. Sobrevive a
   * `reiniciar()` a propósito: si vuelve a reservar en la misma visita al
   * sitio, seguimos sabiendo quién es.
   */
  readonly identidad = signal<string | null>(null);

  /**
   * Quién reserva: la cuenta con sesión y, si no hay, el mail que cargó el
   * invitado. Es lo que impide que la misma persona quede en dos turnos
   * superpuestos, tenga cuenta o no.
   */
  readonly emailPaciente = computed(
    () => normalizarEmail(this.cuentas.sesion()?.email) ?? this.identidad(),
  );

  readonly hayServicio = computed(() => this.servicio() !== null);
  readonly total = computed(() => this.servicio()?.precio ?? 0);
  readonly duracionServicio = computed(() => this.servicio()?.duracionMin ?? 0);
  /** "12:50": a qué hora termina el turno. */
  readonly finBloque = computed(() => {
    const plan = this.plan();
    if (!plan?.length) {
      return null;
    }
    const ultimo = plan[plan.length - 1];
    return aHora(ultimo.inicioMin + ultimo.duracionMin);
  });

  readonly listaParaDatos = computed(() => this.hayServicio() && this.plan() !== null);

  /** Lo que necesita Disponibilidad para resolver el turno. */
  readonly consulta = computed<Consulta>(() => {
    const servicio = this.servicio();
    return {
      servicios: servicio ? [servicio] : [],
      preferidos: this.preferidos(),
      ordenFijo: true,
      email: this.emailPaciente() ?? undefined,
    };
  });

  // --- Servicio -----------------------------------------------------------

  /** Arranca una reserva nueva con este servicio (pisa la anterior si había). */
  elegirServicio(servicio: Servicio): void {
    this.servicio.set(servicio);
    this.preferidos.set({});
    this.invalidarBloque();
  }

  vaciar(): void {
    this.servicio.set(null);
    this.preferidos.set({});
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

  /** Fija (o suelta, con null) el profesional del servicio. */
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

  // --- Combinables --------------------------------------------------------

  /** Anota (o suelta, con null) el combinable a agendar después de confirmar. */
  elegirCombinable(servicio: Servicio | null): void {
    this.combinablePendiente.set(servicio);
  }

  // --- Confirmación -------------------------------------------------------

  /** Deja registrado quién reserva cuando no hay sesión iniciada. */
  identificar(email: string): void {
    this.identidad.set(normalizarEmail(email));
  }

  /**
   * ¿El bloque elegido se puede confirmar ahora mismo? Revalida contra la
   * agenda real sin guardar nada, para que el paso de datos no cree la cuenta
   * de alguien cuyo turno ya no está disponible. null = adelante.
   */
  revisar(): FalloConfirmacion | null {
    if (this.confirmada()) {
      return 'ya-confirmada';
    }
    const plan = this.plan();
    const fecha = this.fecha();
    if (!plan?.length || !fecha) {
      return 'sin-plan';
    }
    return this.disponibilidad.validarPlan(plan, fecha, this.emailPaciente() ?? undefined);
  }

  /**
   * Confirma la reserva y persiste el turno para que esa franja se ocupe.
   * Revalida antes de escribir: el plan se armó minutos atrás y en el medio la
   * franja pudo ocuparse o pudo pasar la hora. Si algo falla no guarda nada y
   * suelta el horario para que el paciente elija otro.
   */
  confirmar(datos: DatosContacto): ResultadoConfirmacion {
    this.identificar(datos.email);
    const fallo = this.revisar();
    if (fallo) {
      // 'ya-confirmada' no toca nada: la reserva buena ya está guardada.
      if (fallo !== 'ya-confirmada') {
        this.soltarBloque();
      }
      return { ok: false, motivo: fallo };
    }
    // revisar() ya garantizó que están; el chequeo es para el compilador.
    const plan = this.plan();
    const fecha = this.fecha();
    if (!plan?.length || !fecha) {
      return { ok: false, motivo: 'sin-plan' };
    }

    this.datos.set(datos);
    this.confirmada.set(true);
    const reservaId = nuevoReservaId();
    this.ultimaReserva.set(reservaId);
    // Siempre queda el mail: sin él un turno de invitado no tendría contacto
    // ni podría bloquearle a esa persona otro turno superpuesto.
    const email = this.emailPaciente() ?? undefined;
    const paciente = `${datos.nombre} ${datos.apellido}`.trim();
    this.agenda.guardarVarios(
      plan.map<TurnoGuardado>((tramo) => ({
        servicioId: tramo.servicio.id,
        profesionalId: tramo.profesional.id,
        inicio: conHora(fecha, aHora(tramo.inicioMin)).getTime(),
        duracionMin: tramo.duracionMin,
        // Si esa cuenta existe (o se crea después), la reserva aparece en
        // "Mis turnos" sola.
        email,
        paciente,
        reservaId,
      })),
    );
    return { ok: true };
  }

  reiniciar(): void {
    this.vaciar();
    this.fecha.set(null);
    this.datos.set(null);
    this.ultimaReserva.set(null);
    this.combinablePendiente.set(null);
  }

  /** Cualquier cambio en la reserva invalida el horario ya elegido. */
  private invalidarBloque(): void {
    this.hora.set(null);
    this.plan.set(null);
    this.confirmada.set(false);
  }
}

function nuevoReservaId(): string {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
