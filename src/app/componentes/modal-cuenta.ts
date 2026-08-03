import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Cuenta, Cuentas } from '../servicios/cuentas';

/** Lo que gana el usuario al registrarse; se muestra solo en el alta. */
const BENEFICIOS = [
  'Seguí tus próximos turnos y tu historial',
  'Reservá más rápido, sin volver a cargar tus datos',
  'Recibí los recordatorios de cada visita',
];

const NIVELES = ['Débil', 'Aceptable', 'Buena', 'Fuerte'];

/** Autorrelleno: separación entre campos y cuánto dura el destello. */
const PASO_MS = 110;
const DESTELLO_MS = 620;

/**
 * Popup de cuenta: inicia sesión o registra, según lo que pida `Cuentas.modal`.
 * Sin backend, las cuentas viven en el navegador (ver `Cuentas`).
 */
@Component({
  selector: 'app-modal-cuenta',
  imports: [ReactiveFormsModule],
  template: `
    @if (cuentas.modal()) {
      <div class="fondo" (click)="cerrar()">
        <div
          class="panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cuenta-titulo"
          (click)="$event.stopPropagation()"
        >
          <button type="button" class="cerrar" (click)="cerrar()" aria-label="Cerrar">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
              <path
                d="M5.5 5.5l9 9m0-9l-9 9"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <div class="cabecera">
            <span class="marca-icono" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <circle cx="12" cy="9" r="3.4" stroke="currentColor" stroke-width="1.8" />
                <path
                  d="M4.8 19.5c.9-3.4 3.7-5.2 7.2-5.2s6.3 1.8 7.2 5.2"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <h2 id="modal-cuenta-titulo">
              {{ esLogin() ? '¡Qué bueno verte de nuevo!' : 'Creá tu cuenta' }}
            </h2>
            <p class="bajada">
              {{
                esLogin()
                  ? 'Entrá para ver y gestionar tus turnos.'
                  : 'Te lleva menos de un minuto y no la perdés más.'
              }}
            </p>
          </div>

          <!-- Cambiar de modo sin salir del popup -->
          <div class="selector" role="tablist" aria-label="Cuenta">
            <button
              type="button"
              role="tab"
              class="opcion"
              [class.activa]="esLogin()"
              [attr.aria-selected]="esLogin()"
              (click)="ir('login')"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              class="opcion"
              [class.activa]="!esLogin()"
              [attr.aria-selected]="!esLogin()"
              (click)="ir('registro')"
            >
              Crear cuenta
            </button>
          </div>

          <form [formGroup]="formulario" (ngSubmit)="enviar()">
            @if (!esLogin()) {
              <div class="par">
                <label class="campo">
                  <span class="etiqueta">Nombre</span>
                  <span class="control" [class.relleno]="rellenando('nombre')">
                    <span class="icono" aria-hidden="true">
                      <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                        <circle cx="10" cy="7" r="2.8" stroke="currentColor" stroke-width="1.5" />
                        <path
                          d="M4.5 16c.7-2.6 2.8-4 5.5-4s4.8 1.4 5.5 4"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                      </svg>
                    </span>
                    <input type="text" formControlName="nombre" placeholder="María" />
                  </span>
                  @if (invalido('nombre')) {
                    <span class="error" role="alert">Ingresá tu nombre.</span>
                  }
                </label>
                <label class="campo">
                  <span class="etiqueta">Apellido</span>
                  <span class="control" [class.relleno]="rellenando('apellido')">
                    <input type="text" formControlName="apellido" placeholder="García" />
                  </span>
                  @if (invalido('apellido')) {
                    <span class="error" role="alert">Ingresá tu apellido.</span>
                  }
                </label>
              </div>
            }

            <label class="campo">
              <span class="etiqueta">Email</span>
              <span class="control" [class.relleno]="rellenando('email')">
                <span class="icono" aria-hidden="true">
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                    <rect
                      x="2.5"
                      y="4.5"
                      width="15"
                      height="11"
                      rx="2"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                    <path
                      d="m3.5 6 6.5 5 6.5-5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <input
                  type="email"
                  formControlName="email"
                  placeholder="vos@mail.com"
                  autocomplete="email"
                />
              </span>
              @if (invalido('email')) {
                <span class="error" role="alert">Ingresá un email válido.</span>
              }
            </label>

            @if (!esLogin()) {
              <div class="par">
                <label class="campo">
                  <span class="etiqueta">Teléfono</span>
                  <span class="control" [class.relleno]="rellenando('telefono')">
                    <span class="prefijo">+54</span>
                    <input
                      type="tel"
                      formControlName="telefono"
                      placeholder="3511234567"
                      inputmode="numeric"
                    />
                  </span>
                  @if (invalido('telefono')) {
                    <span class="error" role="alert">Solo números, sin el 0 y sin el 15.</span>
                  }
                </label>
                <label class="campo">
                  <span class="etiqueta">DNI</span>
                  <span class="control" [class.relleno]="rellenando('dni')">
                    <input
                      type="text"
                      formControlName="dni"
                      placeholder="30123456"
                      inputmode="numeric"
                    />
                  </span>
                  @if (invalido('dni')) {
                    <span class="error" role="alert">7 u 8 números, sin puntos.</span>
                  }
                </label>
              </div>
            }

            <label class="campo">
              <span class="etiqueta">Contraseña</span>
              <span class="control">
                <span class="icono" aria-hidden="true">
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                    <rect
                      x="4"
                      y="8.5"
                      width="12"
                      height="7.5"
                      rx="2"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                    <path
                      d="M7 8.5V6.8a3 3 0 0 1 6 0v1.7"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
                <input
                  [type]="verClave() ? 'text' : 'password'"
                  formControlName="clave"
                  [placeholder]="esLogin() ? 'Tu contraseña' : 'Al menos 6 caracteres'"
                  [attr.autocomplete]="esLogin() ? 'current-password' : 'new-password'"
                />
                <button
                  type="button"
                  class="ojo"
                  (click)="verClave.set(!verClave())"
                  [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  [attr.aria-pressed]="verClave()"
                >
                  @if (verClave()) {
                    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true">
                      <path
                        d="M3 10s2.8-4.5 7-4.5S17 10 17 10s-2.8 4.5-7 4.5S3 10 3 10Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                      <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.5" />
                      <path
                        d="m4 16 12-12"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                    </svg>
                  } @else {
                    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true">
                      <path
                        d="M3 10s2.8-4.5 7-4.5S17 10 17 10s-2.8 4.5-7 4.5S3 10 3 10Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                      <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.5" />
                    </svg>
                  }
                </button>
              </span>

              @if (!esLogin()) {
                <!-- Medidor: solo orienta, no bloquea el alta -->
                <span class="fuerza">
                  <span class="barras" aria-hidden="true">
                    @for (i of [0, 1, 2, 3]; track i) {
                      <span class="barra" [class.llena]="i < fuerza()"></span>
                    }
                  </span>
                  <span class="nivel">{{ etiquetaFuerza() }}</span>
                </span>
              }
              @if (invalido('clave')) {
                <span class="error" role="alert">Usá al menos 6 caracteres.</span>
              }
            </label>

            @if (!esLogin()) {
              <label class="campo">
                <span class="etiqueta">Repetí la contraseña</span>
                <span class="control">
                  <span class="icono" aria-hidden="true">
                    <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                      <rect
                        x="4"
                        y="8.5"
                        width="12"
                        height="7.5"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                      <path
                        d="M7 8.5V6.8a3 3 0 0 1 6 0v1.7"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                    </svg>
                  </span>
                  <input
                    [type]="verConfirmacion() ? 'text' : 'password'"
                    formControlName="confirmacion"
                    placeholder="Repetila para confirmar"
                    autocomplete="new-password"
                  />
                  @if (coinciden()) {
                    <span class="tilde" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                        <path
                          d="M3 8.5 6.5 12 13 4.5"
                          stroke="currentColor"
                          stroke-width="2.4"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  }
                  <button
                    type="button"
                    class="ojo"
                    (click)="verConfirmacion.set(!verConfirmacion())"
                    [attr.aria-label]="
                      verConfirmacion() ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    "
                    [attr.aria-pressed]="verConfirmacion()"
                  >
                    @if (verConfirmacion()) {
                      <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true">
                        <path
                          d="M3 10s2.8-4.5 7-4.5S17 10 17 10s-2.8 4.5-7 4.5S3 10 3 10Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.5" />
                        <path
                          d="m4 16 12-12"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                      </svg>
                    } @else {
                      <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true">
                        <path
                          d="M3 10s2.8-4.5 7-4.5S17 10 17 10s-2.8 4.5-7 4.5S3 10 3 10Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    }
                  </button>
                </span>
                @if (invalido('confirmacion')) {
                  <span class="error" role="alert">Las contraseñas no coinciden.</span>
                }
              </label>
            }

            @if (esLogin()) {
              <button type="button" class="olvide" (click)="pedirAyuda.set(true)">
                ¿Olvidaste tu contraseña?
              </button>
              @if (pedirAyuda()) {
                <p class="ayuda-caja">
                  Todavía no hay recuperación automática. Escribinos por WhatsApp y la
                  restablecemos con vos.
                </p>
              }
            }

            @if (error(); as e) {
              <p class="error-caja" role="alert">{{ e }}</p>
            }

            <button type="submit" class="btn btn-primario enviar" [disabled]="formulario.invalid">
              {{ esLogin() ? 'Entrar' : 'Crear mi cuenta' }}
            </button>
          </form>

          @if (!esLogin()) {
            <ul class="beneficios">
              @for (b of beneficios; track b) {
                <li>
                  <span class="punto" aria-hidden="true">
                    <svg viewBox="0 0 16 16" width="10" height="10" fill="none">
                      <path
                        d="M3 8.5 6.5 12 13 4.5"
                        stroke="currentColor"
                        stroke-width="2.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                  {{ b }}
                </li>
              }
            </ul>
          }

          <p class="aviso">
            Demo sin servidor: la cuenta se guarda solo en este navegador.
          </p>
        </div>
      </div>
    }
  `,
  styles: `
    .fondo {
      position: fixed;
      inset: 0;
      z-index: 120;
      background: rgba(22, 48, 47, 0.55);
      backdrop-filter: blur(3px);
      display: grid;
      place-items: center;
      padding: 1.25rem;
      overflow-y: auto;
      animation: aparecer 0.18s ease;
    }
    @keyframes aparecer {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .panel {
      position: relative;
      width: min(430px, 100%);
      background: var(--blanco);
      border-radius: var(--radio);
      box-shadow: 0 24px 60px rgba(22, 48, 47, 0.3);
      padding: 2rem 1.75rem 1.4rem;
      animation: subir 0.24s ease;
    }
    /* Franja de marca arriba del popup */
    .panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      border-radius: var(--radio) var(--radio) 0 0;
      background: linear-gradient(90deg, var(--primario), var(--terciario));
    }
    @keyframes subir {
      from {
        transform: translateY(12px) scale(0.98);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }
    .cerrar {
      position: absolute;
      top: 0.9rem;
      right: 0.9rem;
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      border-radius: 50%;
      color: var(--neutro);
      display: grid;
      place-items: center;
    }
    .cerrar:hover {
      background: var(--fondo);
      color: var(--secundario);
    }

    .cabecera {
      text-align: center;
      margin-bottom: 1.2rem;
    }
    .marca-icono {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: var(--primario-suave);
      color: var(--primario);
      display: grid;
      place-items: center;
      margin: 0 auto 0.75rem;
    }
    .cabecera h2 {
      font-size: 1.2rem;
      line-height: 1.3;
    }
    .bajada {
      margin: 0.35rem 0 0;
      color: var(--neutro);
      font-size: 0.85rem;
    }

    /* Selector login / registro */
    .selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.25rem;
      background: var(--fondo);
      border-radius: 999px;
      padding: 0.25rem;
      margin-bottom: 1.25rem;
    }
    .opcion {
      background: none;
      border: none;
      border-radius: 999px;
      padding: 0.5rem 0.5rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--neutro);
      transition: background 0.15s ease, color 0.15s ease;
    }
    .opcion:hover {
      color: var(--secundario);
    }
    .opcion.activa {
      background: var(--blanco);
      color: var(--primario);
      box-shadow: 0 1px 4px rgba(22, 48, 47, 0.1);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .par {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .campo {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      min-width: 0;
    }
    .etiqueta {
      font-size: 0.78rem;
      font-weight: 700;
    }
    /* Caja del input: icono a la izquierda, acciones a la derecha */
    .control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1.5px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0 0.7rem;
      background: var(--blanco);
      transition: border-color 0.15s ease;
    }
    .control:focus-within {
      border-color: var(--primario);
    }
    /*
     * Autorrelleno: el campo se enciende y se apaga solo. Anima únicamente
     * color de fondo y borde, así el navegador no rehace layout en ningún
     * frame y los cinco destellos encadenados salen parejos.
     */
    .control.relleno {
      animation: destello 0.62s ease-out;
    }
    @keyframes destello {
      0% {
        background: var(--primario-suave);
        border-color: var(--primario);
        box-shadow: 0 0 0 4px rgba(52, 129, 126, 0.16);
      }
      70% {
        background: var(--primario-suave);
        border-color: var(--primario);
        box-shadow: 0 0 0 4px rgba(52, 129, 126, 0);
      }
      100% {
        background: var(--blanco);
        border-color: var(--borde);
        box-shadow: none;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .control.relleno {
        animation: none;
      }
    }
    .icono {
      color: var(--neutro-claro);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .control:focus-within .icono {
      color: var(--primario);
    }
    .prefijo {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--neutro);
      flex-shrink: 0;
    }
    input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: none;
      padding: 0.62rem 0;
      font-size: 0.9rem;
      color: var(--secundario);
    }
    input::placeholder {
      color: var(--neutro-claro);
    }
    .ojo {
      flex-shrink: 0;
      border: none;
      background: none;
      padding: 0.2rem;
      color: var(--neutro);
      display: grid;
      place-items: center;
      border-radius: 50%;
    }
    .ojo:hover {
      color: var(--primario);
    }
    .tilde {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
    }

    /* Medidor de fuerza */
    .fuerza {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.1rem;
    }
    .barras {
      display: flex;
      gap: 3px;
      flex: 1;
    }
    .barra {
      height: 4px;
      flex: 1;
      border-radius: 999px;
      background: var(--borde);
      transition: background 0.2s ease;
    }
    .barra.llena {
      background: var(--primario);
    }
    .nivel {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--neutro);
      min-width: 62px;
      text-align: right;
    }

    .error {
      color: #b3392f;
      font-size: 0.74rem;
      font-weight: 600;
    }
    .error-caja {
      margin: 0;
      background: rgba(179, 57, 47, 0.08);
      color: #b3392f;
      border-radius: var(--radio-chico);
      padding: 0.55rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .olvide {
      align-self: flex-end;
      background: none;
      border: none;
      padding: 0;
      color: var(--primario);
      font-size: 0.78rem;
      font-weight: 700;
    }
    .olvide:hover {
      text-decoration: underline;
    }
    .ayuda-caja {
      margin: 0;
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      border-radius: var(--radio-chico);
      padding: 0.55rem 0.75rem;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .enviar {
      width: 100%;
      margin-top: 0.3rem;
    }
    .enviar:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .beneficios {
      list-style: none;
      margin: 1.1rem 0 0;
      padding: 0.9rem 0 0;
      border-top: 1px solid var(--borde);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .beneficios li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--neutro);
      line-height: 1.4;
    }
    .punto {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--primario-suave);
      color: var(--primario);
      display: grid;
      place-items: center;
      margin-top: 0.1rem;
    }
    .aviso {
      margin: 1rem 0 0;
      text-align: center;
      font-size: 0.72rem;
      color: var(--neutro-claro);
    }

    @media (max-width: 480px) {
      .par {
        grid-template-columns: 1fr;
      }
      .panel {
        padding: 1.75rem 1.15rem 1.15rem;
      }
    }
  `,
  host: {
    '(document:keydown.escape)': 'cerrar()',
  },
})
export class ModalCuenta {
  protected readonly cuentas = inject(Cuentas);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly beneficios = BENEFICIOS;
  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);
  protected readonly verConfirmacion = signal(false);
  protected readonly pedirAyuda = signal(false);
  protected readonly esLogin = computed(() => this.cuentas.modal() === 'login');

  protected readonly formulario = this.fb.group({
    nombre: [''],
    apellido: [''],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    dni: [''],
    clave: ['', [Validators.required, Validators.minLength(6)]],
    confirmacion: [''],
  });

  /** Campos que están destellando por el autorrelleno. */
  private readonly recienRellenados = signal<readonly string[]>([]);
  private temporizadores: ReturnType<typeof setTimeout>[] = [];

  private readonly claveEscrita = signal('');
  private readonly confirmacionEscrita = signal('');

  /** 0 a 4: largo y variedad de caracteres. Orienta, no bloquea. */
  protected readonly fuerza = computed(() => {
    const clave = this.claveEscrita();
    if (!clave) {
      return 0;
    }
    let puntos = 0;
    if (clave.length >= 6) puntos++;
    if (clave.length >= 10) puntos++;
    if (/[A-Z]/.test(clave) && /[a-z]/.test(clave)) puntos++;
    if (/\d/.test(clave) && /[^A-Za-z0-9]/.test(clave)) puntos++;
    return Math.min(puntos, 4);
  });

  protected readonly etiquetaFuerza = computed(() =>
    this.fuerza() === 0 ? '' : NIVELES[this.fuerza() - 1]
  );

  protected readonly coinciden = computed(() => {
    const confirmacion = this.confirmacionEscrita();
    return confirmacion.length > 0 && confirmacion === this.claveEscrita();
  });

  constructor() {
    // Los datos personales solo se piden (y se validan) al crear la cuenta:
    // hay que reajustar cada vez que cambia el modo, no solo al alternar.
    effect(() => {
      const modo = this.cuentas.modal();
      if (modo) {
        this.ajustarValidaciones(modo === 'registro');
      }
    });
    // Alta abierta desde el turno confirmado: los datos ya cargados se
    // completan solos, en cascada, para que se vea de dónde salen.
    effect(() => {
      const datos = this.cuentas.prellenado();
      if (this.cuentas.modal() === 'registro' && datos) {
        this.autocompletar(datos);
      }
    });
    inject(DestroyRef).onDestroy(() => this.limpiarTemporizadores());
    this.formulario.valueChanges.subscribe(() => this.error.set(null));
    // Espejo en signals de lo tipeado, para el medidor y el check de coincidencia.
    this.formulario.controls.clave.valueChanges.subscribe((valor) => {
      this.claveEscrita.set(valor);
      // Si se corrige la contraseña, la confirmación tiene que revalidarse.
      this.formulario.controls.confirmacion.updateValueAndValidity({ emitEvent: false });
    });
    this.formulario.controls.confirmacion.valueChanges.subscribe((valor) =>
      this.confirmacionEscrita.set(valor)
    );
  }

  protected ir(modo: 'login' | 'registro'): void {
    if (this.cuentas.modal() === modo) {
      return;
    }
    this.error.set(null);
    this.pedirAyuda.set(false);
    this.cuentas.abrir(modo);
  }

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && control.touched;
  }

  protected rellenando(campo: string): boolean {
    return this.recienRellenados().includes(campo);
  }

  protected cerrar(): void {
    this.error.set(null);
    this.pedirAyuda.set(false);
    this.verClave.set(false);
    this.verConfirmacion.set(false);
    this.limpiarTemporizadores();
    this.formulario.reset();
    this.cuentas.cerrarModal();
  }

  /**
   * Completa los datos que ya cargó el paciente, de a un campo por vez con un
   * destello que se apaga solo. La animación es puro color: no toca layout.
   */
  private autocompletar(datos: Cuenta): void {
    this.limpiarTemporizadores();
    const valores: [string, string][] = [
      ['nombre', datos.nombre],
      ['apellido', datos.apellido],
      ['email', datos.email],
      ['telefono', datos.telefono],
      ['dni', datos.dni ?? ''],
    ];

    if (this.sinAnimacion()) {
      valores.forEach(([campo, valor]) => this.formulario.get(campo)?.setValue(valor));
      return;
    }

    valores.forEach(([campo, valor], i) => {
      this.temporizadores.push(
        setTimeout(() => {
          this.formulario.get(campo)?.setValue(valor);
          this.recienRellenados.update((lista) => [...lista, campo]);
          this.temporizadores.push(
            setTimeout(
              () =>
                this.recienRellenados.update((lista) =>
                  lista.filter((c) => c !== campo)
                ),
              DESTELLO_MS
            )
          );
        }, i * PASO_MS)
      );
    });
  }

  private sinAnimacion(): boolean {
    return (
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  private limpiarTemporizadores(): void {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
    this.recienRellenados.set([]);
  }

  protected enviar(): void {
    this.ajustarValidaciones(!this.esLogin());
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    const error = this.esLogin()
      ? this.cuentas.iniciarSesion(v.email, v.clave)
      : this.cuentas.registrar(
          {
            nombre: v.nombre,
            apellido: v.apellido,
            email: v.email,
            telefono: v.telefono,
            dni: v.dni || undefined,
          },
          v.clave
        );

    if (error) {
      this.error.set(error);
      return;
    }
    this.formulario.reset();
    this.verClave.set(false);
    this.verConfirmacion.set(false);
  }

  /** En registro se piden los datos personales y la confirmación de la clave. */
  private ajustarValidaciones(registro: boolean): void {
    for (const campo of ['nombre', 'apellido'] as const) {
      const control = this.formulario.controls[campo];
      control.setValidators(registro ? [Validators.required] : []);
      control.updateValueAndValidity({ emitEvent: false });
    }
    const telefono = this.formulario.controls.telefono;
    telefono.setValidators(
      registro ? [Validators.required, Validators.pattern(/^\d{8,12}$/)] : []
    );
    telefono.updateValueAndValidity({ emitEvent: false });

    const dni = this.formulario.controls.dni;
    dni.setValidators(registro ? [Validators.required, Validators.pattern(/^\d{7,8}$/)] : []);
    dni.updateValueAndValidity({ emitEvent: false });

    const confirmacion = this.formulario.controls.confirmacion;
    confirmacion.setValidators(registro ? [Validators.required, this.igualAClave] : []);
    confirmacion.updateValueAndValidity({ emitEvent: false });
  }

  private readonly igualAClave = (control: AbstractControl): ValidationErrors | null =>
    control.value === this.formulario.controls.clave.value ? null : { noCoincide: true };
}
