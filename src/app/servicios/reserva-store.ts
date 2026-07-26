import { Injectable, computed, signal } from '@angular/core';
import { DatosContacto, Intervalo, ItemCarrito, Servicio, Turno } from '../modelos';
import { conHora } from '../datos/formato';

/** Horario elegido para un turno (la hora se limpia al cambiar de día). */
interface Asignacion {
  fecha: Date | null;
  hora: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReservaStore {
  /** Servicios agregados, con cantidad (permite más de un turno del mismo servicio, ej. acompañante). */
  readonly carrito = signal<ItemCarrito[]>([]);
  /** Fecha y hora por turno, indexadas por el id estable del turno. */
  private readonly asignaciones = signal<Record<string, Asignacion>>({});
  /** Turno que se está agendando en el paso 2. */
  readonly indiceActual = signal(0);
  readonly datos = signal<DatosContacto | null>(null);
  readonly confirmada = signal(false);

  /** Un turno por unidad del carrito: cantidad 2 = dos turnos con horarios distintos. */
  readonly turnos = computed<Turno[]>(() => {
    const asignadas = this.asignaciones();
    const lista: Turno[] = [];
    for (const item of this.carrito()) {
      for (let unidad = 0; unidad < item.cantidad; unidad++) {
        const id = `${item.servicio.id}#${unidad}`;
        lista.push({
          id,
          servicio: item.servicio,
          numero: lista.length + 1,
          fecha: asignadas[id]?.fecha ?? null,
          hora: asignadas[id]?.hora ?? null,
        });
      }
    }
    return lista;
  });

  readonly turnoActual = computed<Turno | null>(
    () => this.turnos()[this.indiceActual()] ?? null
  );
  readonly cantidadTurnos = computed(() => this.turnos().length);
  readonly turnosAgendados = computed(() =>
    this.turnos().filter((t) => t.fecha && t.hora)
  );
  /** Turnos ordenados cronológicamente (para el resumen y el confirmado). */
  readonly turnosEnOrden = computed(() =>
    [...this.turnosAgendados()].sort(
      (a, b) => this.inicioMs(a) - this.inicioMs(b)
    )
  );

  readonly hayServicios = computed(() => this.carrito().length > 0);
  readonly cantidadItems = computed(() =>
    this.carrito().reduce((total, i) => total + i.cantidad, 0)
  );
  readonly totalCarrito = computed(() =>
    this.carrito().reduce((total, i) => total + i.servicio.precio * i.cantidad, 0)
  );
  readonly listaParaConfirmar = computed(
    () => this.cantidadTurnos() > 0 && this.turnosAgendados().length === this.cantidadTurnos()
  );

  cantidadDe(id: string): number {
    return this.carrito().find((i) => i.servicio.id === id)?.cantidad ?? 0;
  }

  estaEnCarrito(id: string): boolean {
    return this.cantidadDe(id) > 0;
  }

  agregar(servicio: Servicio): void {
    const existe = this.carrito().some((i) => i.servicio.id === servicio.id);
    this.carrito.update((lista) =>
      existe
        ? lista.map((i) =>
            i.servicio.id === servicio.id ? { ...i, cantidad: i.cantidad + 1 } : i
          )
        : [...lista, { servicio, cantidad: 1 }]
    );
    this.confirmada.set(false);
  }

  /** Resta una unidad; si llega a 0, saca el servicio del carrito. */
  quitarUno(id: string): void {
    this.carrito.update((lista) =>
      lista
        .map((i) => (i.servicio.id === id ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0)
    );
    this.podarAsignaciones();
  }

  quitar(id: string): void {
    this.carrito.update((lista) => lista.filter((i) => i.servicio.id !== id));
    this.podarAsignaciones();
  }

  vaciarCarrito(): void {
    this.carrito.set([]);
    this.asignaciones.set({});
    this.indiceActual.set(0);
  }

  // --- Agenda por turno ---------------------------------------------------

  asignarFecha(id: string, fecha: Date): void {
    this.asignaciones.update((a) => ({ ...a, [id]: { fecha, hora: null } }));
  }

  asignarHora(id: string, hora: string): void {
    this.asignaciones.update((a) => ({
      ...a,
      [id]: { fecha: a[id]?.fecha ?? null, hora },
    }));
  }

  irAlTurno(indice: number): void {
    const ultimo = Math.max(0, this.cantidadTurnos() - 1);
    this.indiceActual.set(Math.min(Math.max(0, indice), ultimo));
  }

  /** Posiciona el paso 2 en el primer turno sin horario (o en el último si están todos). */
  irAlPrimerPendiente(): void {
    const pendiente = this.turnos().findIndex((t) => !t.fecha || !t.hora);
    this.irAlTurno(pendiente === -1 ? this.cantidadTurnos() - 1 : pendiente);
  }

  /**
   * Rangos ya ocupados por los otros turnos de esta misma reserva. Se usa para
   * que dos servicios no puedan quedar en horarios que se pisen.
   */
  ocupados(exceptoId?: string): Intervalo[] {
    return this.turnos()
      .filter((t) => t.id !== exceptoId && t.fecha && t.hora)
      .map((t) => {
        const inicio = this.inicioMs(t);
        return { inicio, fin: inicio + t.servicio.duracionMin * 60000 };
      });
  }

  confirmar(datos: DatosContacto): void {
    this.datos.set(datos);
    this.confirmada.set(true);
  }

  reiniciar(): void {
    this.carrito.set([]);
    this.asignaciones.set({});
    this.indiceActual.set(0);
    this.datos.set(null);
    this.confirmada.set(false);
  }

  private inicioMs(turno: Turno): number {
    return conHora(turno.fecha!, turno.hora!).getTime();
  }

  /** Descarta horarios de unidades que ya no existen en el carrito. */
  private podarAsignaciones(): void {
    const vigentes = new Set(this.turnos().map((t) => t.id));
    this.asignaciones.update((a) =>
      Object.fromEntries(Object.entries(a).filter(([id]) => vigentes.has(id)))
    );
    this.irAlTurno(this.indiceActual());
  }
}
