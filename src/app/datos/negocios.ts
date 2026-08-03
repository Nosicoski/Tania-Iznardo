/**
 * Ficha de cada negocio que puede ser dueño de la agenda.
 *
 * El reservador es el mismo para todos: lo único que cambia es qué negocio lo
 * está hospedando. Por eso las pantallas del flujo no leen una constante fija
 * sino `Negocio.datos()`, que resuelve cuál corresponde según dónde esté
 * corriendo el reservador.
 */
export interface FichaNegocio {
  nombre: string;
  direccion: string;
  ciudad: string;
  horario: string;
}

/** El consultorio real: la aplicación cuando corre por su cuenta. */
export const CONSULTORIO: FichaNegocio = {
  nombre: 'Tania Iznardo Osteopatía',
  direccion: 'Av. Vélez Sarsfield 761, Depto. 1° B',
  ciudad: 'Córdoba Capital',
  horario: 'Lun a Vie · 9-13 y 15-20 hs',
};

/** El negocio ficticio de la landing de muestra (`/webp`). */
export const NEGOCIO_DEMO: FichaNegocio = {
  nombre: 'Aura · Casa de Bienestar',
  direccion: 'Av. del Bosque 1240, Piso 2',
  ciudad: 'Córdoba',
  horario: 'Lun a Vie · 9-13 y 15-20 hs',
};
