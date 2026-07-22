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
