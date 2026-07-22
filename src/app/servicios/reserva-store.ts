import { Injectable, computed, signal } from '@angular/core';
import { DatosContacto, Servicio } from '../modelos';

@Injectable({ providedIn: 'root' })
export class ReservaStore {
  readonly servicio = signal<Servicio | null>(null);
  readonly fecha = signal<Date | null>(null);
  readonly hora = signal<string | null>(null);
  readonly datos = signal<DatosContacto | null>(null);
  readonly confirmada = signal(false);

  readonly listaParaConfirmar = computed(
    () => !!this.servicio() && !!this.fecha() && !!this.hora()
  );

  elegirServicio(servicio: Servicio): void {
    this.servicio.set(servicio);
    this.fecha.set(null);
    this.hora.set(null);
    this.confirmada.set(false);
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
    this.servicio.set(null);
    this.fecha.set(null);
    this.hora.set(null);
    this.datos.set(null);
    this.confirmada.set(false);
  }
}
