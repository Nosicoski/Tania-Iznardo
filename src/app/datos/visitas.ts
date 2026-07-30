import { Profesional, Servicio, TurnoGuardado } from '../modelos';
import { SERVICIOS, imagenDe } from './catalogo';
import { PROFESIONALES } from './profesionales';

/** Un servicio dentro de una visita, ya resuelto contra el catálogo. */
export interface TramoGuardado {
  clave: string;
  servicio: Servicio | null;
  profesional: Profesional | null;
  imagen: string;
  inicio: Date;
  fin: Date;
  duracionMin: number;
}

/**
 * Una visita: uno o varios servicios consecutivos del mismo día, reservados de
 * una sola vez. Los turnos viejos, sin reservaId, son visitas de un solo turno.
 */
export interface Visita {
  clave: string;
  tramos: TramoGuardado[];
  titulo: string;
  /** Imagen de portada: la del primer servicio de la visita. */
  imagen: string;
  inicio: Date;
  fin: Date;
  duracionMin: number;
  precio: number;
  profesionales: string;
  paciente?: string;
  pasado: boolean;
  /** Días de calendario que faltan; 0 es hoy. Solo aplica a las próximas. */
  faltan: number;
}

const DIA_MS = 24 * 60 * 60 * 1000;
const SIN_IMAGEN = 'img/servicios/manos.svg';

/**
 * Agrupa turnos guardados en visitas, de la más próxima a la más lejana. Lo
 * usan tanto "Mis turnos" como el carrusel del menú de la cuenta, así los dos
 * cuentan y titulan igual.
 */
export function agruparEnVisitas(turnos: TurnoGuardado[]): Visita[] {
  const ahora = Date.now();
  const hoy = new Date().setHours(0, 0, 0, 0);
  const grupos = new Map<string, TramoGuardado[]>();
  const pacientes = new Map<string, string | undefined>();

  for (const t of turnos) {
    const clave = t.reservaId ?? `solo-${t.servicioId}-${t.inicio}`;
    const servicio = SERVICIOS.find((s) => s.id === t.servicioId) ?? null;
    const tramo: TramoGuardado = {
      clave: `${t.servicioId}-${t.inicio}`,
      servicio,
      profesional: PROFESIONALES.find((p) => p.id === t.profesionalId) ?? null,
      imagen: servicio ? imagenDe(servicio) : SIN_IMAGEN,
      inicio: new Date(t.inicio),
      fin: new Date(t.inicio + t.duracionMin * 60000),
      duracionMin: t.duracionMin,
    };
    grupos.set(clave, [...(grupos.get(clave) ?? []), tramo]);
    pacientes.set(clave, t.paciente);
  }

  return [...grupos.entries()]
    .map(([clave, sinOrden]) => {
      const tramos = [...sinOrden].sort(
        (a, b) => a.inicio.getTime() - b.inicio.getTime()
      );
      const inicio = tramos[0].inicio;
      const fin = tramos[tramos.length - 1].fin;
      return {
        clave,
        tramos,
        titulo:
          tramos.length === 1
            ? tramos[0].servicio?.nombre ?? 'Servicio'
            : `Visita · ${tramos.length} servicios`,
        imagen: tramos[0].imagen,
        inicio,
        fin,
        duracionMin: tramos.reduce((total, t) => total + t.duracionMin, 0),
        precio: tramos.reduce((total, t) => total + (t.servicio?.precio ?? 0), 0),
        profesionales: [
          ...new Set(tramos.map((t) => t.profesional?.nombre ?? 'A confirmar')),
        ].join(' · '),
        paciente: pacientes.get(clave),
        pasado: fin.getTime() < ahora,
        // Días de calendario, no horas: si no, un turno de mañana a la tarde
        // se muestra como "en 2 días".
        faltan: Math.round((new Date(inicio).setHours(0, 0, 0, 0) - hoy) / DIA_MS),
      };
    })
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

/** "Es hoy", "Mañana", "En 3 días"… a partir de los días que faltan. */
export function cuandoEsVisita(visita: Visita): string {
  if (visita.faltan === 0) return 'Es hoy';
  if (visita.faltan === 1) return 'Mañana';
  if (visita.faltan < 7) return `En ${visita.faltan} días`;
  if (visita.faltan < 14) return 'En una semana';
  return `En ${Math.round(visita.faltan / 7)} semanas`;
}

/** "15:30" a partir de un Date. */
export function horaDe(fecha: Date): string {
  return `${fecha.getHours()}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}
