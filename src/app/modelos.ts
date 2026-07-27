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
  /** Categorías de servicio que atiende (ver GRUPOS). */
  especialidades: string[];
}

export interface ItemCarrito {
  servicio: Servicio;
  cantidad: number;
}

/**
 * Una unidad del carrito con su propio horario: si el carrito tiene un servicio
 * con cantidad 2, se agendan dos turnos independientes.
 */
export interface Turno {
  /** Id estable `${servicioId}#${unidad}`, sobrevive a los cambios del carrito. */
  id: string;
  servicio: Servicio;
  /** Posición 1-based dentro de la lista, para el contador "Servicio 1 de 3". */
  numero: number;
  fecha: Date | null;
  hora: string | null;
  /** Profesional elegido para este turno (paso 2). */
  profesional: Profesional | null;
}

/** Rango ocupado en milisegundos, para detectar solapamientos. */
export interface Intervalo {
  inicio: number;
  fin: number;
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
