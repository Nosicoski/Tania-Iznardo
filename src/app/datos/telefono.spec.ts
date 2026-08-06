import { normalizarTelefono } from './telefono';

describe('normalizarTelefono', () => {
  it('deja intacto el número local ya limpio', () => {
    expect(normalizarTelefono('3513493483').valor).toBe('3513493483');
  });

  it('saca el +54 que trae el autocompletado del navegador', () => {
    expect(normalizarTelefono('+543513493483').valor).toBe('3513493483');
  });

  it('saca también el 9 de celular del formato internacional', () => {
    expect(normalizarTelefono('+54 9 351 349-3483').valor).toBe('3513493483');
  });

  it('acepta el 00 como prefijo internacional', () => {
    expect(normalizarTelefono('005493513493483').valor).toBe('3513493483');
  });

  it('saca el 0 de larga distancia y el 15 del celular', () => {
    expect(normalizarTelefono('0351 15 3493483').valor).toBe('3513493483');
    expect(normalizarTelefono('011 15 41234567').valor).toBe('1141234567');
  });

  it('ignora espacios, guiones y paréntesis', () => {
    expect(normalizarTelefono(' (351) 349-3483 ').valor).toBe('3513493483');
  });

  it('marca los números de otro país sin tocarlos', () => {
    const otro = normalizarTelefono('+34 611 22 33 44');
    expect(otro.otroPais).toBe(true);
    expect(otro.valor).toBe('+34 611 22 33 44');
  });

  it('no confunde una característica con el prefijo del país', () => {
    // 2954 es Santa Rosa: empieza con 54 pero no es el código de país.
    expect(normalizarTelefono('2954123456').valor).toBe('2954123456');
  });

  it('el campo vacío sigue vacío', () => {
    expect(normalizarTelefono('').valor).toBe('');
  });
});
