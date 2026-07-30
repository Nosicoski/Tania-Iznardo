import { Profesional } from '../modelos';
import { SERVICIOS } from './catalogo';

const FOTOS = 'img/MockProfesionales';

/**
 * Equipo del consultorio. `servicios` lista los ids del catálogo que ofrece
 * cada uno (dos osteópatas no dan exactamente las mismas prestaciones), y
 * `dias` (1 = lunes … 5 = viernes) los días que atiende. De ahí salen tanto el
 * filtro del paso 1 como los profesionales disponibles del paso 2.
 */
export const PROFESIONALES: Profesional[] = [
  {
    id: 'tania-iznardo',
    nombre: 'Tania Iznardo',
    profesion: 'Osteópata',
    matricula: 'MP 5787',
    dias: [1, 2, 3, 4, 5],
    servicios: [
      'osteopatia-primera',
      'osteopatia-sesion',
      'osteopatia-control',
      'osteopatia-visceral',
      'osteopatia-craneal',
      'osteopatia-embarazo',
      'aire-espirado',
      'aire-sibo',
      'aire-fructosa',
      'aire-sorbitol',
      'aire-helicobacter',
      'aire-interpretacion',
      'programa-osteo-4',
      'taller-higiene-postural',
    ],
  },
  {
    id: 'martin-salazar',
    nombre: 'Martín Salazar',
    profesion: 'Osteópata',
    matricula: 'MP 6104',
    foto: `${FOTOS}/doctor-headshots.jpg`,
    dias: [2, 4],
    servicios: [
      'osteopatia-primera',
      'osteopatia-sesion',
      'osteopatia-control',
      'osteopatia-craneal',
      'osteopatia-deportiva',
      'masaje-descontracturante',
      'masaje-deportivo',
      'programa-osteo-4',
      'taller-corredores',
    ],
  },
  {
    id: 'brenda-ocampo',
    nombre: 'Brenda Ocampo',
    profesion: 'Nutricionista',
    matricula: 'MP 4892',
    foto: `${FOTOS}/doctor-headshots2.webp`,
    dias: [1, 3, 5],
    servicios: [
      'nutricion-consulta',
      'nutricion-seguimiento',
      'nutricion-digestiva',
      'nutricion-deportiva',
      'nutricion-antropometria',
      'nutricion-vegetariana',
      'aire-espirado',
      'aire-sibo',
      'aire-fructosa',
      'aire-interpretacion',
      'programa-nutricion-3',
      'taller-alimentacion-consciente',
    ],
  },
  {
    id: 'camila-ferreyra',
    nombre: 'Camila Ferreyra',
    profesion: 'Kinesióloga',
    matricula: 'MP 7233',
    foto: `${FOTOS}/doctor-headshots3.webp`,
    dias: [2, 3, 4],
    servicios: [
      'postural-evaluacion',
      'postural-individual',
      'postural-duo',
      'postural-respiracion',
      'postural-oficina',
      'masaje-relajante',
      'masaje-drenaje',
      'programa-postural-8',
      'taller-higiene-postural',
    ],
  },
  {
    id: 'nicolas-duarte',
    nombre: 'Nicolás Duarte',
    profesion: 'Masoterapeuta',
    foto: `${FOTOS}/doctor-headshots1.jpeg`,
    dias: [1, 4, 5],
    servicios: [
      'masaje-descontracturante',
      'masaje-relajante',
      'masaje-drenaje',
      'masaje-deportivo',
      'masaje-piernas',
      'postural-individual',
      'taller-corredores',
    ],
  },
  {
    id: 'julieta-ramos',
    nombre: 'Julieta Ramos',
    profesion: 'Prof. de Ed. Física',
    dias: [2, 5],
    servicios: [
      'postural-individual',
      'postural-grupal',
      'postural-oficina',
      'programa-postural-8',
      'taller-higiene-postural',
      'taller-corredores',
    ],
  },
];

const NOMBRE_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Iniciales para el avatar cuando el profesional no tiene foto. */
export function inicialesDe(nombre: string): string {
  return nombre
    .split(' ')
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/** "Lun · Mié · Vie" a partir de los días que atiende. */
export function diasDeAtencion(profesional: Profesional): string {
  return [...profesional.dias]
    .sort((a, b) => a - b)
    .map((d) => NOMBRE_DIA[d])
    .join(' · ');
}

/** Categorías del catálogo que cubren los servicios del profesional. */
export function categoriasDe(profesional: Profesional): string[] {
  const categorias = SERVICIOS.filter((s) => profesional.servicios.includes(s.id)).map(
    (s) => s.categoria
  );
  return [...new Set(categorias)];
}

export function ofrece(profesional: Profesional, servicioId: string): boolean {
  return profesional.servicios.includes(servicioId);
}

/** Profesionales que ofrecen ese servicio puntual. */
export function profesionalesPara(servicioId: string): Profesional[] {
  return PROFESIONALES.filter((p) => ofrece(p, servicioId));
}
