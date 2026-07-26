import { Injectable, computed, signal } from '@angular/core';
import { DatosContacto, Servicio } from '../modelos';

@Injectable({ providedIn: 'root' })
export class ReservaStore {
  /** Servicios agregados (permite reservar más de uno en una misma visita). */
  readonly carrito = signal<Servicio[]>([]);
  readonly fecha = signal<Date | null>(null);
  readonly hora = signal<string | null>(null);
  readonly datos = signal<DatosContacto | null>(null);
  readonly confirmada = signal(false);

  readonly hayServicios = computed(() => this.carrito().length > 0);
  readonly totalCarrito = computed(() =>
    this.carrito().reduce((total, s) => total + s.precio, 0)
  );
  readonly duracionTotal = computed(() =>
    this.carrito().reduce((total, s) => total + s.duracionMin, 0)
  );
  readonly listaParaConfirmar = computed(
    () => this.hayServicios() && !!this.fecha() && !!this.hora()
  );

  estaEnCarrito(id: string): boolean {
    return this.carrito().some((s) => s.id === id);
  }

  agregar(servicio: Servicio): void {
    if (this.estaEnCarrito(servicio.id)) return;
    this.carrito.update((lista) => [...lista, servicio]);
    this.confirmada.set(false);
  }

  quitar(id: string): void {
    this.carrito.update((lista) => lista.filter((s) => s.id !== id));
  }

  alternar(servicio: Servicio): void {
    if (this.estaEnCarrito(servicio.id)) {
      this.quitar(servicio.id);
    } else {
      this.agregar(servicio);
    }
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
