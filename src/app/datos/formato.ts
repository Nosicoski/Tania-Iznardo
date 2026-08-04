export function precioARS(valor: number): string {
  return '$' + valor.toLocaleString('es-AR');
}

/** "Vie 24 de julio de 2026" */
export function fechaLarga(fecha: Date): string {
  const texto = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(fecha)
    .replace(',', '');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Martes 4 de agosto de 2026": el día con todas sus letras. */
export function fechaLargaCompleta(fecha: Date): string {
  const texto = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(fecha)
    .replace(',', '');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Lun", "Mar", ... */
export function diaSemanaCorto(fecha: Date): string {
  const texto = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
    .format(fecha)
    .replace('.', '');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Julio" */
export function nombreMes(fecha: Date): string {
  const texto = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Julio 2026" */
export function mesYAnio(fecha: Date): string {
  return `${nombreMes(fecha)} ${fecha.getFullYear()}`;
}

/** "Vie 24 · 15:00 hs" */
export function fechaCorta(fecha: Date, hora: string): string {
  const texto = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(fecha)
    .replace(/\./g, '')
    .replace(',', '');
  return `${texto.charAt(0).toUpperCase() + texto.slice(1)} · ${hora} hs`;
}

export function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

/** Primer día del mes de la fecha dada. */
export function inicioDeMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

/** Lunes de la semana de la fecha dada. */
export function inicioDeSemana(fecha: Date): Date {
  const d = inicioDelDia(fecha);
  return sumarDias(d, -((d.getDay() + 6) % 7));
}

/** "27 jul – 2 ago 2026" para la cabecera de la vista semanal. */
export function rangoSemana(lunes: Date): string {
  const domingo = sumarDias(lunes, 6);
  const dia = (f: Date) =>
    new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
      .format(f)
      .replace('.', '');
  return `${dia(lunes)} – ${dia(domingo)} ${domingo.getFullYear()}`;
}

export function sumarMeses(fecha: Date, meses: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + meses, 1);
}

/** Combina un día con una hora "15:30" en un Date. */
export function conHora(fecha: Date, hora: string): Date {
  const [h, m] = hora.split(':').map(Number);
  const d = new Date(fecha);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * "15:30" → 930. Los bloques de la agenda se calculan en minutos desde la
 * medianoche: sumar duraciones es trivial y no hay Date de por medio.
 */
export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** 930 → "15:30" (inverso de aMinutos). */
export function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  return `${h}:${String(minutos % 60).padStart(2, '0')}`;
}

/** 110 → "1h 50m"; 45 → "45 min". Para el carrito y el resumen. */
export function duracionTexto(minutos: number): string {
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h ${resto}m` : `${horas}h`;
}

export function mismoMes(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
