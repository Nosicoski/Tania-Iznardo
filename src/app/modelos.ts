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
