import { Injectable, computed, signal } from '@angular/core';
import { DatosContacto, ItemCarrito, Servicio } from '../modelos';

@Injectable({ providedIn: 'root' })
export class ReservaStore {
  /** Servicios agregados, con cantidad (permite más de un turno del mismo servicio, ej. acompañante). */
  readonly carrito = signal<ItemCarrito[]>([]);
  readonly fecha = signal<Date | null>(null);
  readonly hora = signal<string | null>(null);
  readonly datos = signal<DatosContacto | null>(null);
  readonly confirmada = signal(false);

  readonly hayServicios = computed(() => this.carrito().length > 0);
  readonly cantidadItems = computed(() =>
    this.carrito().reduce((total, i) => total + i.cantidad, 0)
  );
  readonly totalCarrito = computed(() =>
    this.carrito().reduce((total, i) => total + i.servicio.precio * i.cantidad, 0)
  );
  readonly duracionTotal = computed(() =>
    this.carrito().reduce((total, i) => total + i.servicio.duracionMin * i.cantidad, 0)
  );
  readonly listaParaConfirmar = computed(
    () => this.hayServicios() && !!this.fecha() && !!this.hora()
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
  }

  quitar(id: string): void {
    this.carrito.update((lista) => lista.filter((i) => i.servicio.id !== id));
  }

  vaciarCarrito(): void {
    this.carrito.set([]);
    this.fecha.set(null);
    this.hora.set(null);
  }

  elegirFecha(fecha: Date): void {
    this.fecha.set(fecha);
    this.hora.set(null);
  }

  elegirHora(hora: string): void {
    this.hora.set(hora);
  }

  confirmar(datos: DatosContacto): void {
    this.datos.set(datos);
    this.confirmada.set(true);
  }

  reiniciar(): void {
    this.carrito.set([]);
    this.fecha.set(null);
    this.hora.set(null);
    this.datos.set(null);
    this.confirmada.set(false);
  }
}
