import { Profesional } from '../modelos';

const FOTOS = 'img/MockProfesionales';

/**
 * Equipo del consultorio. `especialidades` usa los nombres de GRUPOS, así el
 * paso de profesional puede ofrecer solo a quienes atienden lo que hay en el
 * carrito.
 */
export const PROFESIONALES: Profesional[] = [
  {
    id: 'tania-iznardo',
    nombre: 'Tania Iznardo',
    profesion: 'Osteópata',
    matricula: 'MP 5787',
    especialidades: ['Osteopatía', 'Nutrición', 'Test de Aire Espirado', 'Programas y Talleres'],
  },
  {
    id: 'martin-salazar',
    nombre: 'Martín Salazar',
    profesion: 'Osteópata',
    matricula: 'MP 6104',
    foto: `${FOTOS}/doctor-headshots.jpg`,
    especialidades: ['Osteopatía', 'Masoterapia'],
  },
  {
    id: 'brenda-ocampo',
    nombre: 'Brenda Ocampo',
    profesion: 'Nutricionista',
    matricula: 'MP 4892',
    foto: `${FOTOS}/doctor-headshots2.webp`,
    especialidades: ['Nutrición', 'Test de Aire Espirado', 'Programas y Talleres'],
  },
  {
    id: 'camila-ferreyra',
    nombre: 'Camila Ferreyra',
    profesion: 'Kinesióloga',
    matricula: 'MP 7233',
    foto: `${FOTOS}/doctor-headshots3.webp`,
    especialidades: ['Terapia Postural Activa', 'Masoterapia', 'Programas y Talleres'],
  },
  {
    id: 'nicolas-duarte',
    nombre: 'Nicolás Duarte',
    profesion: 'Masoterapeuta',
    foto: `${FOTOS}/doctor-headshots1.jpeg`,
    especialidades: ['Masoterapia', 'Terapia Postural Activa'],
  },
  {
    id: 'julieta-ramos',
    nombre: 'Julieta Ramos',
    profesion: 'Prof. de Ed. Física',
    especialidades: ['Terapia Postural Activa', 'Programas y Talleres'],
  },
];

/** Iniciales para el avatar cuando el profesional no tiene foto. */
export function inicialesDe(nombre: string): string {
  return nombre
    .split(' ')
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/** Profesionales que atienden al menos una de las categorías indicadas. */
export function profesionalesPara(categorias: string[]): Profesional[] {
  if (categorias.length === 0) {
    return PROFESIONALES;
  }
  const coinciden = PROFESIONALES.filter((p) =>
    p.especialidades.some((e) => categorias.includes(e))
  );
  return coinciden.length > 0 ? coinciden : PROFESIONALES;
}
