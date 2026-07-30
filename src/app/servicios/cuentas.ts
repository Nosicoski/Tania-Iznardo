import { Injectable, computed, signal } from '@angular/core';

/** Datos de la cuenta que se muestran en la app (nunca incluye la clave). */
export interface Cuenta {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni?: string;
}

interface CuentaGuardada extends Cuenta {
  /**
   * Huella de la contraseña. Es un hash trivial, NO criptográfico: alcanza
   * para la demo (todo vive en el navegador) pero no sirve como autenticación
   * real; con backend esto se reemplaza por un login de verdad.
   */
  huella: string;
}

const CLAVE_CUENTAS = 'ti-cuentas';
const CLAVE_SESION = 'ti-sesion';

export type ModalCuenta = 'login' | 'registro' | null;

@Injectable({ providedIn: 'root' })
export class Cuentas {
  private readonly cuentas = signal<CuentaGuardada[]>(this.leerCuentas());
  private readonly emailActivo = signal<string | null>(this.leerSesion());
  /** Qué popup de cuenta está abierto (lo abren el header y el paso de datos). */
  readonly modal = signal<ModalCuenta>(null);

  readonly sesion = computed<Cuenta | null>(() => {
    const email = this.emailActivo();
    const cuenta = email ? this.cuentas().find((c) => c.email === email) : undefined;
    return cuenta ? this.sinHuella(cuenta) : null;
  });
  readonly haySesion = computed(() => this.sesion() !== null);

  abrir(modal: Exclude<ModalCuenta, null>): void {
    this.modal.set(modal);
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  /** Devuelve el mensaje de error, o null si la cuenta se creó. */
  registrar(datos: Cuenta, clave: string): string | null {
    const email = datos.email.trim().toLowerCase();
    if (this.cuentas().some((c) => c.email === email)) {
      return 'Ya existe una cuenta con ese email. Iniciá sesión.';
    }
    const cuenta: CuentaGuardada = { ...datos, email, huella: this.huella(clave) };
    const lista = [...this.cuentas(), cuenta];
    this.cuentas.set(lista);
    this.guardarCuentas(lista);
    this.activar(email);
    return null;
  }

  /** Devuelve el mensaje de error, o null si la sesión quedó iniciada. */
  iniciarSesion(email: string, clave: string): string | null {
    const buscado = email.trim().toLowerCase();
    const cuenta = this.cuentas().find((c) => c.email === buscado);
    if (!cuenta || cuenta.huella !== this.huella(clave)) {
      return 'Email o contraseña incorrectos.';
    }
    this.activar(cuenta.email);
    return null;
  }

  cerrarSesion(): void {
    this.emailActivo.set(null);
    this.escribir(CLAVE_SESION, null);
  }

  private activar(email: string): void {
    this.emailActivo.set(email);
    this.escribir(CLAVE_SESION, email);
    this.modal.set(null);
  }

  private sinHuella(cuenta: CuentaGuardada): Cuenta {
    const { huella, ...resto } = cuenta;
    return resto;
  }

  /** djb2: solo evita que la contraseña quede legible en localStorage. */
  private huella(clave: string): string {
    let total = 5381;
    for (const c of clave) {
      total = (total * 33) ^ c.charCodeAt(0);
    }
    return (total >>> 0).toString(36);
  }

  private leerCuentas(): CuentaGuardada[] {
    const crudo = this.leer(CLAVE_CUENTAS);
    if (!Array.isArray(crudo)) {
      return [];
    }
    return crudo.filter(
      (c): c is CuentaGuardada =>
        !!c && typeof c.email === 'string' && typeof c.huella === 'string'
    );
  }

  private leerSesion(): string | null {
    const email = this.leer(CLAVE_SESION);
    return typeof email === 'string' ? email : null;
  }

  private guardarCuentas(lista: CuentaGuardada[]): void {
    this.escribir(CLAVE_CUENTAS, lista);
  }

  private leer(clave: string): unknown {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      return JSON.parse(localStorage.getItem(clave) ?? 'null');
    } catch {
      return null;
    }
  }

  private escribir(clave: string, valor: unknown): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      if (valor === null) {
        localStorage.removeItem(clave);
      } else {
        localStorage.setItem(clave, JSON.stringify(valor));
      }
    } catch {
      // Modo privado o cuota llena: la sesión sigue viva solo en memoria.
    }
  }
}
