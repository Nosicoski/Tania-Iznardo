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

export function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
