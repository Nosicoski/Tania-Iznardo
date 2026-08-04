import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Cuenta, Cuentas } from '../servicios/cuentas';

const NIVELES = ['Débil', 'Aceptable', 'Buena', 'Fuerte'];

/** Autorrelleno: separación entre campos y cuánto dura el destello. */
const PASO_MS = 110;
const DESTELLO_MS = 620;

/** Cuánto queda el tilde en pantalla antes de cerrar el popup solo. */
const ESPERA_EXITO_MS = 1500;

/**
 * Popup de cuenta: inicia sesión o registra, según lo que pida `Cuentas.modal`.
 * Sin backend, las cuentas viven en el navegador (ver `Cuentas`).
 */
@Component({
  selector: 'app-modal-cuenta',
  imports: [ReactiveFormsModule],
  template: `
    <!-- El estado de éxito mantiene el panel en pantalla después de que
         Cuentas cierra el modal: sin eso, el tilde no llegaría a verse. -->
    @if (cuentas.modal() || exito()) {
      <!--
        El fondo no cierra: un toque al costado mientras se tipea la contraseña
        borraba todo lo cargado. Se sale por la cruz (que además limpia) o con
        Escape (que deja el formulario como estaba).
      -->
      <div class="fondo">
        <div class="panel" role="dialog" aria-modal="true" aria-labelledby="modal-cuenta-titulo">
          @if (exito(); as logrado) {
            <div class="exito" role="status" aria-live="polite">
              <span class="exito-circulo" aria-hidden="true">
                <svg viewBox="0 0 52 52" width="46" height="46" fill="none">
                  <path
                    class="exito-tilde"
                    d="M14 27.5 22.5 36 38 18"
                    stroke="currentColor"
                    stroke-width="4.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <strong>
                {{ logrado === 'registro' ? 'Cuenta confirmada' : 'Inicio exitoso' }}
              </strong>
              <span>
                {{
                  logrado === 'registro'
                    ? 'Ya podés reservar sin volver a cargar tus datos.'
                    : '¡Qué bueno verte de nuevo!'
                }}
              </span>
            </div>
          } @else {
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

            <div class="hero" aria-hidden="true">
              <span class="hero-circulo hero-circulo-1"></span>
              <span class="hero-circulo hero-circulo-2"></span>
              <span class="marca-icono">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <circle cx="12" cy="9" r="3.4" stroke="currentColor" stroke-width="1.8" />
                  <path
                    d="M4.8 19.5c.9-3.4 3.7-5.2 7.2-5.2s6.3 1.8 7.2 5.2"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
            </div>
            <div class="cabecera">
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

              <!-- En el alta las dos claves comparten fila: el popup entra sin scroll -->
              <div [class.par]="!esLogin()">
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
                    [placeholder]="esLogin() ? 'Tu contraseña' : 'Mínimo 6 caracteres'"
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
                      <svg
                        viewBox="0 0 20 20"
                        width="17"
                        height="17"
                        fill="none"
                        aria-hidden="true"
                      >
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
                      <svg
                        viewBox="0 0 20 20"
                        width="17"
                        height="17"
                        fill="none"
                        aria-hidden="true"
                      >
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
                  <span class="etiqueta">Repetila</span>
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
                      placeholder="Otra vez"
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
                        <svg
                          viewBox="0 0 20 20"
                          width="17"
                          height="17"
                          fill="none"
                          aria-hidden="true"
                        >
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
                        <svg
                          viewBox="0 0 20 20"
                          width="17"
                          height="17"
                          fill="none"
                          aria-hidden="true"
                        >
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
              </div>

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

            <p class="aviso">Demo sin servidor: la cuenta se guarda solo en este navegador.</p>
          }
        </div>
      </div>
    }
  `,
  styles: `
    /* Confirmación con tilde dibujado: el círculo entra, el trazo se dibuja
       y recién ahí el panel se cierra solo. */
    .exito {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.35rem;
      padding: 2.25rem 1rem 1.75rem;
    }
    .exito-circulo {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      margin-bottom: 0.75rem;
      animation: exito-entra 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .exito-tilde {
      /* 46 ≈ el largo del trazo; se dibuja de punta a punta. */
      stroke-dasharray: 46;
      stroke-dashoffset: 46;
      animation: exito-traza 0.3s 0.1s ease-out forwards;
    }
    .exito strong {
      font-size: 1.15rem;
      color: var(--secundario);
    }
    .exito span {
      font-size: 0.88rem;
      color: var(--neutro);
    }
    @keyframes exito-entra {
      from {
        opacity: 0;
        transform: scale(0.4);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes exito-traza {
      to {
        stroke-dashoffset: 0;
      }
    }
    /* Sin animación: el tilde ya está dibujado desde el primer cuadro. */
    @media (prefers-reduced-motion: reduce) {
      .exito-circulo {
        animation: none;
      }
      .exito-tilde {
        animation: none;
        stroke-dashoffset: 0;
      }
    }

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
      box-shadow:
        0 28px 70px rgba(22, 48, 47, 0.35),
        0 4px 16px rgba(22, 48, 47, 0.12);
      padding: 0 1.75rem 1.2rem;
      overflow: hidden;
      animation: subir 0.24s ease;
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
      z-index: 1;
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      color: var(--blanco);
      display: grid;
      place-items: center;
      backdrop-filter: blur(2px);
    }
    .cerrar:hover {
      background: rgba(255, 255, 255, 0.4);
    }

    /* Cabecera de marca: degradado con círculos suaves y el ícono colgando */
    .hero {
      position: relative;
      margin: 0 -1.75rem 1.75rem;
      height: 64px;
      background: linear-gradient(120deg, var(--primario), var(--terciario));
      overflow: visible;
    }
    .hero-circulo {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.14);
    }
    .hero-circulo-1 {
      width: 130px;
      height: 130px;
      top: -55px;
      left: -35px;
    }
    .hero-circulo-2 {
      width: 90px;
      height: 90px;
      right: -25px;
      bottom: -40px;
      background: rgba(255, 255, 255, 0.1);
    }
    .marca-icono {
      position: absolute;
      left: 50%;
      bottom: -24px;
      transform: translateX(-50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--blanco);
      color: var(--primario);
      display: grid;
      place-items: center;
      box-shadow:
        0 0 0 5px var(--blanco),
        0 6px 18px rgba(22, 48, 47, 0.22);
    }
    .cabecera {
      text-align: center;
      margin-bottom: 0.95rem;
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
      margin-bottom: 1rem;
    }
    .opcion {
      background: none;
      border: none;
      border-radius: 999px;
      padding: 0.5rem 0.5rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--neutro);
      transition:
        background 0.15s ease,
        color 0.15s ease;
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
      gap: 0.7rem;
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

    .aviso {
      margin: 0.85rem 0 0;
      text-align: center;
      font-size: 0.72rem;
      color: var(--neutro-claro);
    }

    @media (max-width: 720px) {
      /* El panel es más alto que la pantalla y se scrollea: sin este respiro
         el botón de confirmar queda pegado al borde (y bajo la barra del
         navegador en iOS). */
      .panel {
        margin-bottom: calc(1rem + env(safe-area-inset-bottom));
      }
      /* Objetivos táctiles: mostrar/ocultar contraseña y cerrar el diálogo
         eran de ~23 y ~31 px, imposibles de acertar con el pulgar. */
      .ojo {
        width: 40px;
        height: 40px;
        margin-right: -0.4rem;
      }
      .cerrar {
        width: 40px;
        height: 40px;
        top: 0.6rem;
        right: 0.6rem;
      }
    }
    /* En teléfonos las columnas colapsan y el alta suma campos: se compacta
       todo lo decorativo para que el popup entre sin scroll. */
    @media (max-width: 480px) {
      .par {
        grid-template-columns: 1fr;
      }
      .panel {
        padding: 0 1.15rem 1rem;
      }
      .hero {
        margin: 0 -1.15rem 1.5rem;
        height: 44px;
      }
      .marca-icono {
        width: 40px;
        height: 40px;
        bottom: -20px;
      }
      .marca-icono svg {
        width: 20px;
        height: 20px;
      }
      .bajada {
        display: none;
      }
      .cabecera {
        margin-bottom: 0.7rem;
      }
      .cabecera h2 {
        font-size: 1.05rem;
      }
      .selector {
        margin-bottom: 0.75rem;
      }
      form {
        gap: 0.5rem;
      }
      input {
        padding: 0.5rem 0;
      }
      /* El medidor solo orienta: en pantallas chicas se sacrifica por espacio. */
      .fuerza {
        display: none;
      }
      .aviso {
        margin-top: 0.6rem;
      }
    }
  `,
  host: {
    // Escape sale, pero sin vaciar el formulario: ver `cerrarConservando`.
    '(document:keydown.escape)': 'cerrarConservando()',
  },
})
export class ModalCuenta {
  protected readonly cuentas = inject(Cuentas);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);
  protected readonly verConfirmacion = signal(false);
  protected readonly pedirAyuda = signal(false);
  /** Alta o login recién resueltos: mientras dura, el panel muestra el tilde. */
  protected readonly exito = signal<'registro' | 'login' | null>(null);
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
    this.fuerza() === 0 ? '' : NIVELES[this.fuerza() - 1],
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
      this.confirmacionEscrita.set(valor),
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

  /** Cierre deliberado (la cruz): se va y no queda nada cargado. */
  protected cerrar(): void {
    this.replegar();
    this.formulario.reset();
    this.cuentas.cerrarModal();
  }

  /**
   * Escape: sale sin tocar el formulario. Se puede apretar sin querer mientras
   * se tipea, así que al volver a abrir tiene que estar todo como estaba.
   */
  protected cerrarConservando(): void {
    this.replegar();
    this.cuentas.cerrarModal();
  }

  /** Estado efímero que no sobrevive a ningún cierre (ni siquiera al de Escape). */
  private replegar(): void {
    this.exito.set(null);
    this.error.set(null);
    this.pedirAyuda.set(false);
    this.verClave.set(false);
    this.verConfirmacion.set(false);
    this.limpiarTemporizadores();
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
              () => this.recienRellenados.update((lista) => lista.filter((c) => c !== campo)),
              DESTELLO_MS,
            ),
          );
        }, i * PASO_MS),
      );
    });
  }

  private sinAnimacion(): boolean {
    return (
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
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
    // Se guarda antes de llamar: `esLogin()` deriva de `cuentas.modal()`, que
    // queda en null en cuanto la sesión se activa.
    const modo = this.esLogin() ? 'login' : 'registro';
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
          v.clave,
        );

    if (error) {
      this.error.set(error);
      return;
    }
    this.formulario.reset();
    this.verClave.set(false);
    this.verConfirmacion.set(false);
    // `Cuentas` ya cerró el modal al activar la sesión; el panel se sostiene
    // con `exito` el tiempo que dura el tilde y después se va solo.
    this.exito.set(modo);
    this.temporizadores.push(setTimeout(() => this.cerrar(), ESPERA_EXITO_MS));
  }

  /** En registro se piden los datos personales y la confirmación de la clave. */
  private ajustarValidaciones(registro: boolean): void {
    for (const campo of ['nombre', 'apellido'] as const) {
      const control = this.formulario.controls[campo];
      control.setValidators(registro ? [Validators.required] : []);
      control.updateValueAndValidity({ emitEvent: false });
    }
    const telefono = this.formulario.controls.telefono;
    telefono.setValidators(registro ? [Validators.required, Validators.pattern(/^\d{8,12}$/)] : []);
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
