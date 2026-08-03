/**
 * Contenido de la landing de muestra. Todo lo que identifica al negocio vive
 * acá: cambiando este archivo (y las fotos) la misma página sirve para un spa,
 * una estética o un consultorio, que es justamente lo que queremos demostrar.
 *
 * Es un sitio ficticio: la marca, el equipo y los textos son inventados. Lo
 * único real es el reservador que se embebe adentro.
 */

import { NEGOCIO_DEMO } from '../datos/negocios';

const FOTOS = 'img/imgFalsas/';

export const MARCA = {
  nombre: 'Aura',
  apellido: 'Casa de Bienestar',
  claim: 'Un espacio para volver a tu eje',
  bajada:
    'Terapias manuales, movimiento consciente y nutrición en un mismo lugar. ' +
    'Reservá tu turno online en menos de un minuto, las 24 horas.',
  telefono: '+54 351 000 0000',
  email: 'hola@aurabienestar.com',
  direccion: NEGOCIO_DEMO.direccion,
  ciudad: NEGOCIO_DEMO.ciudad,
  horario: 'Lunes a viernes · 9 a 13 y 15 a 20 h',
};

export const FOTO = {
  hero: `${FOTOS}IMG-EspacioSpaTrasfondo.jpg`,
  espacio: `${FOTOS}IMG-EspacioSpa.jpg`,
  masaje: `${FOTOS}IMG-ServicioMasaje.jpg`,
  velas: `${FOTOS}IMG-SPA-Velas.jpg`,
  facial: `${FOTOS}IMG-LimpiezaFacial.jpg`,
};

/** Los tres argumentos del reservador, que es lo que la landing viene a vender. */
export const PROMESAS = [
  {
    titulo: 'Sin registro',
    texto: 'Reservás con tu nombre y tu mail. Crear la cuenta es opcional y lleva un minuto.',
  },
  {
    titulo: 'Las 24 horas',
    texto: 'La agenda está siempre abierta: elegís el turno cuando te queda cómodo a vos.',
  },
  {
    titulo: 'Confirmación al instante',
    texto: 'Recibís el detalle por mail apenas terminás, con la opción de cancelar.',
  },
];

export const EQUIPO = {
  nombre: 'Lic. Valentina Ríos',
  rol: 'Dirección profesional · MP 00.000',
  parrafos: [
    'Coordina el equipo de Aura desde 2015. Formada en terapias manuales y en reeducación del movimiento, acompaña procesos donde el cuerpo, el descanso y los hábitos se trabajan juntos.',
    'Nuestro enfoque no busca tapar el síntoma: buscamos entender por qué aparece. Por eso cada primera consulta arranca con una evaluación completa y termina con un plan que podés sostener.',
    'Atendemos a personas de todas las edades, desde quien llega con una contractura hasta quien quiere moverse mejor y sostener el cambio en el tiempo.',
  ],
};

/**
 * Vidriera de servicios. Cada tarjeta apunta a una categoría **real** del
 * catálogo del reservador: el título y la bajada son de vidriera, pero al abrir
 * el turno se reserva contra el mismo catálogo y la misma agenda que la
 * aplicación. Así la landing nunca ofrece algo que después no se pueda reservar.
 */
export interface TarjetaServicio {
  /** Nombre exacto de la categoría en el catálogo. */
  categoria: string;
  titulo: string;
  bajada: string;
  imagen: string;
}

export const VIDRIERA: TarjetaServicio[] = [
  {
    categoria: 'Masoterapia',
    titulo: 'Masajes',
    bajada: 'Descarga profunda para soltar lo que el día te deja en los hombros.',
    imagen: FOTO.masaje,
  },
  {
    categoria: 'Osteopatía',
    titulo: 'Terapia manual',
    bajada: 'Manos entrenadas que devuelven movilidad y equilibrio a tu cuerpo.',
    imagen: FOTO.espacio,
  },
  {
    categoria: 'Terapia Postural Activa',
    titulo: 'Movimiento consciente',
    bajada: 'Reeducá tu postura con sesiones guiadas, a tu ritmo y sin apuro.',
    imagen: FOTO.velas,
  },
  {
    categoria: 'Nutrición',
    titulo: 'Nutrición y hábitos',
    bajada: 'Un plan de alimentación que se adapta a tu vida, no al revés.',
    imagen: FOTO.facial,
  },
  {
    categoria: 'Test de Aire Espirado',
    titulo: 'Estudios digestivos',
    bajada: 'Diagnóstico simple, no invasivo, con resultados claros en el día.',
    imagen: FOTO.hero,
  },
  {
    categoria: 'Programas y Talleres',
    titulo: 'Programas y talleres',
    bajada: 'Procesos de varios encuentros para sostener el cambio en el tiempo.',
    imagen: FOTO.velas,
  },
];
