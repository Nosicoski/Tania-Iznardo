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
