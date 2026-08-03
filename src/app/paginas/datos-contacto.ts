import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NavegacionReserva } from '../servicios/navegacion-reserva';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { FalloConfirmacion, ReservaStore } from '../servicios/reserva-store';
import { Cuentas } from '../servicios/cuentas';
import { Notificaciones } from '../servicios/notificaciones';

/** Con cuenta el turno queda guardado en "Mis turnos"; como invitado, no. */
type Modo = 'cuenta' | 'invitado';

const NIVELES = ['Débil', 'Aceptable', 'Buena', 'Fuerte'];

/**
 * Qué se le dice al paciente cuando el bloque que había elegido ya no se puede
 * tomar. Salvo 'ya-confirmada', todos terminan en "elegí otro horario".
 */
const MOTIVOS: Record<FalloConfirmacion, string> = {
  'ya-confirmada': 'Esta visita ya estaba confirmada: no la reservamos dos veces.',
  'sin-plan': 'Se soltó el horario que habías elegido. Elegí día y hora otra vez.',
  vencido: 'La hora que habías elegido ya pasó. Elegí un horario nuevo.',
  ocupado: 'Alguien tomó ese horario mientras completabas tus datos. Elegí otro, por favor.',
  'paciente-ocupado': 'Ya tenés un turno reservado que se superpone con ese horario. Elegí otro.',
};

@Component({
  selector: 'app-datos-contacto',
  imports: [ReactiveFormsModule, Stepper, ResumenReserva],
  template: `
    <app-stepper [paso]="3" />
    <div class="contenedor">
      <h1>Completá tus datos</h1>

      <div class="disposicion">
        <div class="columna">
          @if (cuentas.sesion(); as usuario) {
            <div class="sesion tarjeta">
              <span class="sesion-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="m5 12.5 5 5L19 7"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <div>
                <strong>Reservás como {{ usuario.nombre }} {{ usuario.apellido }}</strong>
                <span>El turno va a quedar guardado en tus turnos.</span>
              </div>
            </div>
          } @else {
            <!-- Reservar sin cuenta va primero: es el camino sin fricción -->
            <div class="solapas" role="tablist" aria-label="Cómo querés reservar">
              <button
                type="button"
                class="solapa"
                role="tab"
                [class.activa]="modo() === 'invitado'"
                [attr.aria-selected]="modo() === 'invitado'"
                (click)="cambiarModo('invitado')"
              >
                <span class="solapa-icono" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <circle cx="12" cy="9" r="3.4" stroke="currentColor" stroke-width="1.8" />
                    <path
                      d="M4.8 19.5c.9-3.4 3.7-5.2 7.2-5.2s6.3 1.8 7.2 5.2"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
                <span class="solapa-textos">
                  <strong>Completá tus datos</strong>
                  <span>Reservá sin registrarte, solo para este turno</span>
                </span>
              </button>
              <button
                type="button"
                class="solapa"
                role="tab"
                [class.activa]="modo() === 'cuenta'"
                [attr.aria-selected]="modo() === 'cuenta'"
                (click)="cambiarModo('cuenta')"
              >
                <span class="solapa-icono" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path
                      d="M12 4.6 19 8v4.6c0 3.7-2.7 6.4-7 7.4-4.3-1-7-3.7-7-7.4V8l7-3.4Z"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linejoin="round"
                    />
                    <path
                      d="m9 12 2.2 2.2L15.4 10"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span class="solapa-textos">
                  <strong>Creá tu cuenta</strong>
                  <span>Seguí tus turnos y reservá más rápido la próxima vez</span>
                </span>
              </button>
            </div>

            @if (modo() === 'cuenta') {
              <p class="ya-tengo">
                ¿Ya tenés cuenta?
                <button type="button" class="enlace" (click)="cuentas.abrir('login')">
                  Iniciá sesión
                </button>
              </p>
            }
          }

          <form class="tarjeta formulario" [formGroup]="formulario" (ngSubmit)="confirmar()">
            <div class="campos">
              <label class="campo">
                <span class="etiqueta">Nombre <i>*</i></span>
                <span class="control">
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
                  <input type="text" formControlName="nombre" placeholder="Ej: María" />
                </span>
                @if (invalido('nombre')) {
                  <span class="error" role="alert">Ingresá tu nombre.</span>
                }
              </label>

              <label class="campo">
                <span class="etiqueta">Apellido <i>*</i></span>
                <span class="control">
                  <input type="text" formControlName="apellido" placeholder="Ej: García" />
                </span>
                @if (invalido('apellido')) {
                  <span class="error" role="alert">Ingresá tu apellido.</span>
                }
              </label>

              <label class="campo">
                <span class="etiqueta">Email <i>*</i></span>
                <span class="control">
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
                    placeholder="juan@mail.com"
                    autocomplete="email"
                  />
                </span>
                @if (invalido('email')) {
                  <span class="error" role="alert">Ingresá un email válido.</span>
                }
              </label>

              <label class="campo">
                <span class="etiqueta">Teléfono <i>*</i></span>
                <span class="control">
                  <span class="prefijo">+54</span>
                  <input
                    type="tel"
                    formControlName="telefono"
                    placeholder="3511234567"
                    inputmode="numeric"
                    autocomplete="tel"
                  />
                </span>
                <span class="ayuda"> Con código de área, sin el 0 y sin el 15. </span>
                @if (invalido('telefono')) {
                  <span class="error" role="alert">
                    Ingresá un teléfono válido (solo números).
                  </span>
                }
              </label>

              <label class="campo">
                <span class="etiqueta">DNI <i>*</i></span>
                <span class="control">
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
                      <circle cx="7.2" cy="9.2" r="1.8" stroke="currentColor" stroke-width="1.4" />
                      <path
                        d="M11.5 8.4h4M11.5 11.2h4M4.6 13.4c.5-1.2 1.4-1.8 2.6-1.8s2.1.6 2.6 1.8"
                        stroke="currentColor"
                        stroke-width="1.4"
                        stroke-linecap="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    formControlName="dni"
                    placeholder="30123456"
                    inputmode="numeric"
                  />
                </span>
                @if (invalido('dni')) {
                  <span class="error" role="alert">Ingresá tu DNI (7 u 8 números).</span>
                }
              </label>

              @if (pideClave()) {
                <label class="campo">
                  <span class="etiqueta">Contraseña <i>*</i></span>
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
                      placeholder="Al menos 6 caracteres"
                      autocomplete="new-password"
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
                  <!-- Medidor: solo orienta, no bloquea el alta -->
                  <span class="fuerza">
                    <span class="barras" aria-hidden="true">
                      @for (i of [0, 1, 2, 3]; track i) {
                        <span class="barra" [class.llena]="i < fuerza()"></span>
                      }
                    </span>
                    <span class="nivel">{{ etiquetaFuerza() }}</span>
                  </span>
                  @if (invalido('clave')) {
                    <span class="error" role="alert">Usá al menos 6 caracteres.</span>
                  }
                </label>

                <label class="campo">
                  <span class="etiqueta">Repetí la contraseña <i>*</i></span>
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

              <label class="campo campo-ancho">
                <span class="etiqueta">Observaciones</span>
                <span class="control control-area">
                  <textarea
                    formControlName="observaciones"
                    rows="4"
                    placeholder="Escribí información relevante para tu turno"
                  ></textarea>
                </span>
              </label>
            </div>

            @if (errorCuenta(); as e) {
              <p class="error-caja">{{ e }}</p>
            }

            <!-- El horario dejó de estar disponible: no se guardó nada -->
            @if (errorTurno(); as e) {
              <div class="error-caja error-turno" role="alert">
                <p>{{ e }}</p>
                @if (puedeReelegir()) {
                  <button type="button" class="btn btn-primario" (click)="volver()">
                    Elegir otro horario
                  </button>
                }
              </div>
            }

            <p class="legal">
              Te notificaremos sobre tu turno al correo y/o teléfono que indiques.
            </p>
          </form>
        </div>

        <app-resumen-reserva
          [notaPago]="true"
          cta="Confirmar turno"
          [ctaDeshabilitada]="formulario.invalid || enviando()"
          (ctaClick)="confirmar()"
        />
      </div>

      <div class="acciones">
        <button type="button" class="btn btn-borde" (click)="volver()">Anterior</button>
        <button
          type="button"
          class="btn btn-primario confirmar-desktop"
          [disabled]="formulario.invalid || enviando()"
          (click)="confirmar()"
        >
          Confirmar turno
        </button>
      </div>
    </div>
  `,
  styles: `
    .disposicion {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
      align-items: start;
      margin-top: 1.25rem;
    }
    .columna {
      min-width: 0;
    }

    /* Elegir entre reservar sin cuenta (primero) o crearla */
    .solapas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 0.9rem;
    }
    .solapa {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      text-align: left;
      background: var(--blanco);
      border: 1.5px solid var(--borde);
      border-radius: var(--radio);
      padding: 0.95rem 1.1rem;
      overflow: hidden;
      transition:
        border-color 0.15s ease,
        background 0.15s ease,
        box-shadow 0.15s ease,
        transform 0.15s ease;
    }
    /* Franja de marca que aparece solo en la elegida */
    .solapa::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--primario);
      transform: scaleY(0);
      transform-origin: center;
      transition: transform 0.2s ease;
    }
    .solapa.activa::before {
      transform: scaleY(1);
    }
    .solapa-icono {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--fondo);
      color: var(--neutro);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition:
        background 0.15s ease,
        color 0.15s ease;
    }
    .solapa-textos {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }
    .solapa strong {
      font-size: 0.92rem;
      color: var(--secundario);
      line-height: 1.25;
    }
    .solapa-textos span {
      font-size: 0.78rem;
      color: var(--neutro);
      line-height: 1.35;
    }
    .solapa:hover {
      border-color: var(--primario);
      box-shadow: 0 4px 14px rgba(22, 48, 47, 0.07);
    }
    .solapa.activa {
      border-color: var(--primario);
      background: var(--primario-suave);
    }
    .solapa.activa strong {
      color: var(--primario);
    }
    .solapa.activa .solapa-icono {
      background: var(--primario);
      color: var(--blanco);
    }
    .ya-tengo {
      margin: 0 0 0.9rem;
      font-size: 0.82rem;
      color: var(--neutro);
    }
    .enlace {
      background: none;
      border: none;
      padding: 0;
      color: var(--primario);
      font-weight: 700;
      font-size: 0.82rem;
    }
    .enlace:hover {
      text-decoration: underline;
    }

    /* Ya hay sesión: no hace falta elegir nada */
    .sesion {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.9rem 1.1rem;
      margin-bottom: 0.9rem;
      border-left: 4px solid var(--primario);
    }
    .sesion-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .sesion strong {
      display: block;
      font-size: 0.9rem;
    }
    /* Solo el texto de abajo: si alcanzara al avatar le pisaría el color del tick. */
    .sesion div span {
      font-size: 0.8rem;
      color: var(--neutro);
    }

    .formulario {
      padding: 1.5rem;
    }
    .campos {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.1rem 1.5rem;
    }
    .campo {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .campo-ancho {
      grid-column: 1 / -1;
    }
    .etiqueta {
      font-weight: 700;
      font-size: 0.85rem;
    }
    /* Rojo, no verde: el asterisco avisa, no decora */
    .etiqueta i {
      color: #b3392f;
      font-style: normal;
      font-weight: 800;
    }

    /* Caja del input: ícono a la izquierda, acciones a la derecha */
    .control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1.5px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0 0.7rem;
      background: var(--blanco);
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .control:focus-within {
      border-color: var(--primario);
      box-shadow: 0 0 0 3px var(--primario-suave);
    }
    .control-area {
      align-items: stretch;
      padding: 0.15rem 0.7rem;
    }
    .icono {
      color: var(--neutro-claro);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: color 0.15s ease;
    }
    .control:focus-within .icono {
      color: var(--primario);
    }
    input,
    textarea {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: none;
      padding: 0.62rem 0;
      font-size: 0.9rem;
      color: var(--secundario);
      font-family: inherit;
      resize: vertical;
    }
    input::placeholder,
    textarea::placeholder {
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
    .prefijo {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--neutro);
      flex-shrink: 0;
    }
    .ayuda {
      color: var(--neutro);
      font-size: 0.75rem;
    }

    /* Medidor de fuerza de la contraseña */
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
      font-size: 0.75rem;
      font-weight: 600;
    }
    .error-caja {
      margin: 1.1rem 0 0;
      background: rgba(179, 57, 47, 0.08);
      color: #b3392f;
      border-radius: var(--radio-chico);
      padding: 0.6rem 0.85rem;
      font-size: 0.82rem;
      font-weight: 600;
    }
    /* El turno se cayó: además del motivo, la salida para reelegir horario */
    .error-turno {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      border-left: 3px solid #b3392f;
    }
    .error-turno p {
      margin: 0;
      flex: 1;
      min-width: 12rem;
    }
    .error-turno .btn {
      flex-shrink: 0;
      padding: 0.5rem 1.1rem;
      font-size: 0.85rem;
    }
    .legal {
      margin: 1.25rem 0 0;
      color: var(--neutro);
      font-size: 0.8rem;
    }
    .acciones {
      display: flex;
      justify-content: space-between;
      margin-top: 1.5rem;
    }
    /* Desde acá el resumen pasa a la barra desplegable de abajo. */
    @media (max-width: 1024px) {
      .disposicion {
        display: block;
      }
      /* El botón de confirmar vive en la barra "Tu reserva". */
      .confirmar-desktop {
        display: none;
      }
    }
    @media (max-width: 720px) {
      .campos,
      .solapas {
        grid-template-columns: 1fr;
      }
      /* Objetivos táctiles: el ojo de la contraseña medía 23px y el enlace a
         iniciar sesión 17px de alto. */
      .ojo {
        width: 40px;
        height: 40px;
        margin-right: -0.4rem;
      }
      .enlace {
        padding: 0.4rem 0;
        min-height: 36px;
      }
    }
  `,
})
export class DatosContacto {
  private readonly navegacion = inject(NavegacionReserva);
  private readonly store = inject(ReservaStore);
  protected readonly cuentas = inject(Cuentas);
  private readonly notificaciones = inject(Notificaciones);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Reservar sin cuenta es el camino por defecto: la cuenta se ofrece al final. */
  protected readonly modo = signal<Modo>('invitado');
  protected readonly errorCuenta = signal<string | null>(null);
  /** El bloque elegido ya no se puede tomar; el turno NO se guardó. */
  protected readonly errorTurno = signal<string | null>(null);
  /** Confirmación en curso: evita que un doble clic reserve dos veces. */
  protected readonly enviando = signal(false);
  /** Con la visita ya confirmada no tiene sentido ofrecer otro horario. */
  protected readonly puedeReelegir = signal(true);
  protected readonly verClave = signal(false);
  protected readonly verConfirmacion = signal(false);

  protected readonly formulario = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{8,12}$/)]],
    // Obligatorio en los dos modos: el consultorio lo necesita para la ficha.
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    clave: ['', [Validators.required, Validators.minLength(6)]],
    confirmacion: [''],
    observaciones: [''],
  });

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
    // También cubre iniciar sesión desde el popup sin salir de esta pantalla.
    effect(() => {
      this.cuentas.sesion();
      this.aplicarSesion();
    });
    this.formulario.controls.clave.valueChanges.subscribe((valor) => {
      this.errorCuenta.set(null);
      this.claveEscrita.set(valor);
      // Si se corrige la contraseña, la confirmación tiene que revalidarse.
      this.formulario.controls.confirmacion.updateValueAndValidity({ emitEvent: false });
    });
    this.formulario.controls.confirmacion.valueChanges.subscribe((valor) =>
      this.confirmacionEscrita.set(valor),
    );
  }

  /** El campo de contraseña solo aparece si se va a crear la cuenta acá. */
  protected pideClave(): boolean {
    return !this.cuentas.haySesion() && this.modo() === 'cuenta';
  }

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && control.touched;
  }

  protected cambiarModo(modo: Modo): void {
    this.modo.set(modo);
    this.errorCuenta.set(null);
    this.ajustarClave();
  }

  protected confirmar(): void {
    // Una visita, una confirmación: el doble clic no puede duplicarla.
    if (this.enviando()) {
      return;
    }
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    this.errorTurno.set(null);

    // A partir de acá sabemos quién reserva aunque no tenga cuenta: sus
    // propios turnos pasan a bloquearle horarios como a cualquiera.
    this.store.identificar(v.email);

    // Se revisa ANTES de crear la cuenta: si el horario ya no está, no dejamos
    // a alguien registrado con un turno que nunca existió.
    const previo = this.store.revisar();
    if (previo) {
      this.rechazar(previo);
      return;
    }

    this.enviando.set(true);

    // Crear la cuenta primero: si el email ya existe, no se confirma el turno.
    if (this.pideClave()) {
      const error = this.cuentas.registrar(
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
        this.errorCuenta.set(error);
        this.enviando.set(false);
        return;
      }
    }

    const resultado = this.store.confirmar({
      nombre: v.nombre,
      apellido: v.apellido,
      email: v.email,
      telefono: v.telefono,
      dni: v.dni,
      observaciones: v.observaciones,
    });
    if (!resultado.ok) {
      // Carrera perdida entre el chequeo y la escritura: no se guardó nada.
      this.enviando.set(false);
      this.rechazar(resultado.motivo);
      return;
    }

    this.avisarPorMail();
    this.navegacion.ir('confirmado');
  }

  /** El turno no se pudo tomar: se explica el motivo y se ofrece la salida. */
  private rechazar(motivo: FalloConfirmacion): void {
    this.errorTurno.set(MOTIVOS[motivo]);
    this.puedeReelegir.set(motivo !== 'ya-confirmada');
    if (motivo === 'ya-confirmada') {
      this.navegacion.ir('confirmado');
      return;
    }
    // El bloque ya no sirve: se suelta para que el resumen deje de mostrar un
    // horario que no se puede tomar. El día elegido se conserva.
    this.store.soltarBloque();
  }

  /**
   * Dispara el mail de confirmación sin esperarlo: el turno ya está guardado y
   * la pantalla de confirmación muestra cómo salió el envío.
   */
  private avisarPorMail(): void {
    const fecha = this.store.fecha();
    const plan = this.store.plan();
    const datos = this.store.datos();
    const reservaId = this.store.ultimaReserva();
    const horaInicio = this.store.hora();
    const horaFin = this.store.finBloque();
    if (!fecha || !plan?.length || !datos || !reservaId || !horaInicio || !horaFin) {
      return;
    }
    void this.notificaciones.enviarConfirmacion({
      fecha,
      plan,
      horaInicio,
      horaFin,
      total: this.store.total(),
      reservaId,
      datos,
    });
  }

  protected volver(): void {
    this.navegacion.ir('agendar');
  }

  /** Con sesión iniciada los datos vienen cargados y no se pide contraseña. */
  private aplicarSesion(): void {
    const usuario = this.cuentas.sesion();
    if (usuario) {
      this.formulario.patchValue({
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        dni: usuario.dni ?? '',
      });
    }
    this.ajustarClave();
  }

  private ajustarClave(): void {
    const pide = this.pideClave();
    const clave = this.formulario.controls.clave;
    clave.setValidators(pide ? [Validators.required, Validators.minLength(6)] : []);
    clave.updateValueAndValidity({ emitEvent: false });

    const confirmacion = this.formulario.controls.confirmacion;
    confirmacion.setValidators(pide ? [Validators.required, this.igualAClave] : []);
    confirmacion.updateValueAndValidity({ emitEvent: false });
  }

  private readonly igualAClave = (control: AbstractControl): ValidationErrors | null =>
    control.value === this.formulario.controls.clave.value ? null : { noCoincide: true };
}
