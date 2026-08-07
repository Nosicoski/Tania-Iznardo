/**
 * Cómo llegar preparado a la visita. Se muestran en dos momentos: en el paso de
 * datos (columna lateral, solo escritorio) para que el paciente los lea antes
 * de confirmar, y en la pantalla de turno confirmado.
 *
 * Recordatorios de la demo: falta confirmarlos con el consultorio.
 */
export interface Preparativo {
  titulo: string;
  detalle: string;
}

export const PREPARATIVOS: Preparativo[] = [
  {
    titulo: 'Llegá 10 minutos antes',
    detalle: 'Así podemos completar tu ficha con tranquilidad antes de empezar.',
  },
  {
    titulo: 'Traé ropa cómoda',
    detalle: 'Calzas o short y remera; en la sesión vas a necesitar moverte.',
  },
  {
    titulo: 'Estudios y documentación',
    detalle: 'Si tenés radiografías, resonancias o estudios recientes, traelos.',
  },
  {
    titulo: 'DNI y credencial',
    detalle: 'Documento y, si corresponde, la credencial de tu obra social.',
  },
  {
    titulo: 'Evitá comidas pesadas',
    detalle: 'Mejor no comer abundante en la hora previa al turno.',
  },
];
