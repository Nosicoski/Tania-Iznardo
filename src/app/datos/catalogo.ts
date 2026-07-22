import { Servicio } from '../modelos';

export const PROFESIONAL = {
  nombre: 'Lic. Tania Iznardo',
  matricula: 'MP 5787',
};

export const CONSULTORIO = {
  direccion: 'Av. Vélez Sarsfield 761, Depto. 1° B',
  ciudad: 'Córdoba Capital',
  horario: 'Lun a Vie · 9-13 y 15-20 hs',
};

export interface GrupoServicios {
  nombre: string;
  tagline: string;
}

export const GRUPOS: GrupoServicios[] = [
  { nombre: 'Osteopatía', tagline: 'Recuperá el equilibrio de tu cuerpo' },
  { nombre: 'Terapia Postural Activa', tagline: 'Movimiento consciente para tu postura' },
  { nombre: 'Nutrición', tagline: 'Alimentación al servicio de tu bienestar' },
  { nombre: 'Test de Aire Espirado', tagline: 'Diagnóstico digestivo simple y no invasivo' },
];

export const SERVICIOS: Servicio[] = [
  {
    id: 'osteopatia-sesion',
    nombre: 'Sesión de Osteopatía',
    categoria: 'Osteopatía',
    duracionMin: 50,
    precio: 35000,
    descripcion:
      'Tratamiento manual integral para dolores de columna, articulares y musculares, adaptado a tu motivo de consulta.',
    detalle:
      'Incluye evaluación del motivo de consulta y tratamiento con técnicas manuales sobre tejidos blandos, vísceras y articulaciones. Vení con ropa cómoda.',
    imagenes: ['img/servicios/manos.svg', 'img/servicios/columna.svg'],
  },
  {
    id: 'osteopatia-primera',
    nombre: 'Primera consulta de Osteopatía (valoración inicial)',
    categoria: 'Osteopatía',
    duracionMin: 60,
    precio: 40000,
    descripcion:
      'Evaluación completa de tu historia clínica y tu postura para definir el plan de tratamiento.',
    detalle:
      'Traé estudios previos si los tenés (radiografías, resonancias, análisis). En esta consulta se define la frecuencia y el enfoque del tratamiento.',
    badge: 'Nuevos pacientes',
    imagenes: ['img/servicios/columna.svg', 'img/servicios/manos.svg', 'img/servicios/postura.svg'],
  },
  {
    id: 'postural-individual',
    nombre: 'Terapia Postural Activa · sesión individual',
    categoria: 'Terapia Postural Activa',
    duracionMin: 45,
    precio: 28000,
    descripcion:
      'Ejercicios guiados para reeducar la postura, fortalecer la musculatura profunda y prevenir recaídas.',
    detalle:
      'Sesión personalizada de ejercicio terapéutico. Vení con ropa deportiva; el material de trabajo lo pone el consultorio.',
    imagenes: ['img/servicios/postura.svg'],
  },
  {
    id: 'nutricion-consulta',
    nombre: 'Consulta de Nutrición',
    categoria: 'Nutrición',
    duracionMin: 40,
    precio: 30000,
    descripcion:
      'Plan de alimentación personalizado, orientado a tu salud digestiva y a tu bienestar general.',
    detalle:
      'Primera consulta o seguimiento. Si tenés análisis de sangre recientes, traelos para ajustar mejor el plan.',
    imagenes: ['img/servicios/nutricion.svg'],
  },
  {
    id: 'aire-espirado',
    nombre: 'Test de Aire Espirado',
    categoria: 'Test de Aire Espirado',
    duracionMin: 30,
    precio: 25000,
    descripcion:
      'Detección de intolerancia a la lactosa y sobrecrecimiento bacteriano (SIBO) mediante aire espirado.',
    detalle:
      'Requiere preparación previa: ayuno de 8 hs y dieta especial el día anterior. Al reservar te enviamos las indicaciones completas.',
  },
];
