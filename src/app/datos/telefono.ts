import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Único código de país que toma el consultorio por ahora. */
const PAIS = '54';

/** Largo del número local argentino ya limpio: característica + abonado. */
const LARGO_LOCAL = 10;

export interface TelefonoLimpio {
  /** El número local pelado, solo dígitos (sin +54, sin 0 y sin 15). */
  valor: string;
  /** Vino con el código de otro país: el consultorio no lo puede tomar. */
  otroPais: boolean;
}

/**
 * Deja el teléfono como lo espera el formulario: solo el número local, porque
 * el "+54" ya está impreso al lado del campo.
 *
 * Hace falta para las dos formas de cargarlo. Tipeado a mano, la gente escribe
 * el 0 y el 15 de toda la vida; autocompletado por el navegador, lo que entra
 * es el número internacional entero ("+54 9 351 349-3483"), que sin limpiar
 * duplica el prefijo y encima no pasa la validación.
 *
 * Un número de otro país vuelve tal cual y marcado: sacarle el prefijo lo
 * convertiría en un teléfono argentino inventado.
 */
export function normalizarTelefono(texto: string): TelefonoLimpio {
  const bruto = (texto ?? '').trim();
  let digitos = bruto.replace(/\D/g, '');

  // "+" y "00" son lo mismo: lo que sigue es un código de país.
  const internacional = bruto.startsWith('+') || /^00\d/.test(digitos);
  if (digitos.startsWith('00')) {
    digitos = digitos.slice(2);
  }
  if (internacional && !digitos.startsWith(PAIS)) {
    return { valor: bruto, otroPais: true };
  }

  // El código de país ya lo pone el formulario. Ninguna característica
  // argentina empieza con 54, así que solo puede ser el prefijo.
  if (digitos.startsWith(PAIS) && digitos.length > LARGO_LOCAL) {
    digitos = digitos.slice(PAIS.length);
  }
  // El 9 de los celulares existe solo en el formato internacional.
  if (digitos.length === LARGO_LOCAL + 1 && digitos.startsWith('9')) {
    digitos = digitos.slice(1);
  }
  // El 0 de larga distancia.
  if (digitos.startsWith('0')) {
    digitos = digitos.slice(1);
  }
  // El 15 va detrás de la característica, que tiene 2, 3 o 4 dígitos.
  if (digitos.length === LARGO_LOCAL + 2) {
    for (const largo of [2, 3, 4]) {
      if (digitos.slice(largo, largo + 2) === '15') {
        digitos = digitos.slice(0, largo) + digitos.slice(largo + 2);
        break;
      }
    }
  }

  return { valor: digitos, otroPais: false };
}

/**
 * Valida el teléfono ya normalizado. De "es obligatorio" se sigue ocupando
 * `Validators.required`: acá un campo vacío pasa.
 */
export function telefonoArgentino(control: AbstractControl): ValidationErrors | null {
  const texto = (control.value ?? '') as string;
  if (!texto.trim()) {
    return null;
  }
  const { valor, otroPais } = normalizarTelefono(texto);
  if (otroPais) {
    return { otroPais: true };
  }
  return /^\d{8,12}$/.test(valor) ? null : { telefono: true };
}
