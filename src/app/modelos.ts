export interface Servicio {
  id: string;
  nombre: string;
  categoria: string;
  duracionMin: number;
  precio: number;
  descripcion: string;
  detalle: string;
  badge?: string;
  /** Imágenes de referencia (opcionales, se muestran hasta 3). */
  imagenes?: string[];
}

export interface Profesional {
  id: string;
  nombre: string;
  /** Etiqueta corta que se muestra en el globo debajo del nombre. */
  profesion: string;
  matricula?: string;
  /** Ruta de la foto; si falta se muestra el avatar con iniciales. */
  foto?: string;
  /** Ids de los servicios que ofrece (ver SERVICIOS). */
  servicios: string[];
  /** Días que atiende, con la numeración de Date#getDay (1 = lunes). */
  dias: number[];
}

/** Rango ocupado en milisegundos, para detectar solapamientos. */
export interface Intervalo {
  inicio: number;
  fin: number;
}

/**
 * Un servicio ya ubicado dentro del bloque de la visita: con su profesional
 * resuelto y su horario en minutos desde la medianoche. Los tramos de una
 * misma visita son consecutivos y nunca se solapan.
 */
export interface Tramo {
  servicio: Servicio;
  profesional: Profesional;
  /** Inicio en minutos desde la medianoche (ver aMinutos/aHora). */
  inicioMin: number;
  duracionMin: number;
  /** El sistema lo asignó; el usuario no lo pidió explícitamente. */
  automatico: boolean;
}

/**
 * Turno ya confirmado y guardado en localStorage. Se persiste plano (ids y
 * milisegundos) para que sobreviva a los cambios del catálogo.
 */
export interface TurnoGuardado {
  servicioId: string;
  profesionalId: string;
  /** Inicio del turno en milisegundos desde época. */
  inicio: number;
  duracionMin: number;
  /** Cuenta que lo reservó; vacío si se reservó como invitado. */
  email?: string;
  /** A nombre de quién quedó el turno (se muestra en "Mis turnos"). */
  paciente?: string;
  /**
   * Visita a la que pertenece: los turnos de una reserva múltiple comparten
   * este id y se muestran agrupados. Los turnos viejos no lo tienen y cada uno
   * cuenta como su propia visita.
   */
  reservaId?: string;
}

export interface DatosContacto {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni?: string;
  observaciones?: string;
}

export interface Horarios {
  manana: string[];
  tarde: string[];
}
