import { Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { ReservaStore } from '../servicios/reserva-store';
import { Cuentas } from '../servicios/cuentas';

/** Con cuenta el turno queda guardado en "Mis turnos"; como invitado, no. */
type Modo = 'cuenta' | 'invitado';

@Component({
  selector: 'app-datos-contacto',
  imports: [ReactiveFormsModule, Stepper, ResumenReserva],
  template: `
    <app-stepper [paso]="2" />
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
            <div class="solapas" role="tablist" aria-label="Cómo querés reservar">
              <button
                type="button"
                class="solapa"
                role="tab"
                [class.activa]="modo() === 'cuenta'"
                [attr.aria-selected]="modo() === 'cuenta'"
                (click)="cambiarModo('cuenta')"
              >
                <strong>Creá tu cuenta</strong>
                <span>Seguí tus turnos y reservá más rápido la próxima vez</span>
              </button>
              <button
                type="button"
                class="solapa"
                role="tab"
                [class.activa]="modo() === 'invitado'"
                [attr.aria-selected]="modo() === 'invitado'"
                (click)="cambiarModo('invitado')"
              >
                <strong>Completá tus datos</strong>
                <span>Reservá sin registrarte, solo para este turno</span>
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
                <input type="text" formControlName="nombre" placeholder="Ej: María" />
                @if (invalido('nombre')) {
                  <span class="error">Ingresá tu nombre.</span>
                }
              </label>

              <label class="campo">
                <span class="etiqueta">Apellido <i>*</i></span>
                <input type="text" formControlName="apellido" placeholder="Ej: García" />
                @if (invalido('apellido')) {
                  <span class="error">Ingresá tu apellido.</span>
                }
              </label>

              <label class="campo">
                <span class="etiqueta">Email <i>*</i></span>
                <input type="email" formControlName="email" placeholder="juan@mail.com" />
                @if (invalido('email')) {
                  <span class="error">Ingresá un email válido.</span>
                }
              </label>

              <label class="campo">
                <span class="etiqueta">Teléfono <i>*</i></span>
                <span class="telefono">
                  <span class="prefijo">+54</span>
                  <input
                    type="tel"
                    formControlName="telefono"
                    placeholder="3511234567"
                    inputmode="numeric"
                  />
                </span>
                <span class="ayuda">
                  Ingresá tu número con código de área, sin el 0 y sin el 15.
                </span>
                @if (invalido('telefono')) {
                  <span class="error">Ingresá un teléfono válido (solo números).</span>
                }
              </label>

              @if (pideClave()) {
                <label class="campo">
                  <span class="etiqueta">Contraseña <i>*</i></span>
                  <span class="con-ojo">
                    <input
                      [type]="verClave() ? 'text' : 'password'"
                      formControlName="clave"
                      placeholder="Mínimo 6 caracteres"
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
                  @if (invalido('clave')) {
                    <span class="error">Usá al menos 6 caracteres.</span>
                  }
                </label>
              }

              <label class="campo">
                <span class="etiqueta">DNI <span class="opcional">(opcional)</span></span>
                <input type="text" formControlName="dni" placeholder="DNI" inputmode="numeric" />
              </label>

              <label class="campo campo-ancho">
                <span class="etiqueta">Observaciones</span>
                <textarea
                  formControlName="observaciones"
                  rows="4"
                  placeholder="Escribí información relevante para tu turno"
                ></textarea>
              </label>
            </div>

            @if (errorCuenta(); as e) {
              <p class="error-caja">{{ e }}</p>
            }

            <p class="legal">
              Te notificaremos sobre tu turno al correo y/o teléfono que indiques.
            </p>
          </form>
        </div>

        <app-resumen-reserva
          [notaPago]="true"
          cta="Confirmar turno"
          [ctaDeshabilitada]="formulario.invalid"
          (ctaClick)="confirmar()"
        />
      </div>

      <div class="acciones">
        <button type="button" class="btn btn-borde" (click)="volver()">Anterior</button>
        <button
          type="button"
          class="btn btn-primario confirmar-desktop"
          [disabled]="formulario.invalid"
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

    /* Elegir entre crear cuenta o reservar como invitado */
    .solapas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 0.9rem;
    }
    .solapa {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      text-align: left;
      background: var(--blanco);
      border: 1.5px solid var(--borde);
      border-radius: var(--radio);
      padding: 0.9rem 1.1rem;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .solapa strong {
      font-size: 0.92rem;
      color: var(--secundario);
    }
    .solapa span {
      font-size: 0.78rem;
      color: var(--neutro);
      line-height: 1.35;
    }
    .solapa:hover {
      border-color: var(--primario);
    }
    .solapa.activa {
      border-color: var(--primario);
      background: var(--primario-suave);
    }
    .solapa.activa strong {
      color: var(--primario);
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
    .etiqueta i {
      color: var(--primario);
      font-style: normal;
    }
    .opcional {
      color: var(--neutro);
      font-weight: 500;
    }
    input,
    textarea {
      border: 1.5px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0.6rem 0.85rem;
      font-size: 0.9rem;
      color: var(--secundario);
      background: var(--blanco);
      width: 100%;
      resize: vertical;
    }
    input::placeholder,
    textarea::placeholder {
      color: var(--neutro-claro);
    }
    input:focus,
    textarea:focus {
      outline: none;
      border-color: var(--primario);
    }
    .telefono {
      display: flex;
      gap: 0.5rem;
    }
    /* Contraseña con el botón de mostrar/ocultar dentro del campo */
    .con-ojo {
      position: relative;
      display: block;
    }
    .con-ojo input {
      padding-right: 2.6rem;
    }
    .ojo {
      position: absolute;
      top: 50%;
      right: 0.5rem;
      transform: translateY(-50%);
      border: none;
      background: none;
      padding: 0.2rem;
      color: var(--neutro);
      display: grid;
      place-items: center;
    }
    .ojo:hover {
      color: var(--primario);
    }
    .prefijo {
      border: 1.5px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0.6rem 0.75rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--neutro);
      background: var(--fondo);
      flex-shrink: 0;
    }
    .ayuda {
      color: var(--neutro);
      font-size: 0.75rem;
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
    }
  `,
})
export class DatosContacto {
  private readonly router = inject(Router);
  private readonly store = inject(ReservaStore);
  protected readonly cuentas = inject(Cuentas);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly modo = signal<Modo>('cuenta');
  protected readonly errorCuenta = signal<string | null>(null);
  protected readonly verClave = signal(false);

  protected readonly formulario = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{8,12}$/)]],
    clave: ['', [Validators.required, Validators.minLength(6)]],
    dni: [''],
    observaciones: [''],
  });

  constructor() {
    // También cubre iniciar sesión desde el popup sin salir de esta pantalla.
    effect(() => {
      this.cuentas.sesion();
      this.aplicarSesion();
    });
    this.formulario.controls.clave.valueChanges.subscribe(() =>
      this.errorCuenta.set(null)
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
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();

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
        v.clave
      );
      if (error) {
        this.errorCuenta.set(error);
        return;
      }
    }

    this.store.confirmar({
      nombre: v.nombre,
      apellido: v.apellido,
      email: v.email,
      telefono: v.telefono,
      dni: v.dni,
      observaciones: v.observaciones,
    });
    this.router.navigate(['/confirmado']);
  }

  protected volver(): void {
    this.router.navigate(['/agendar']);
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
    const clave = this.formulario.controls.clave;
    clave.setValidators(
      this.pideClave() ? [Validators.required, Validators.minLength(6)] : []
    );
    clave.updateValueAndValidity({ emitEvent: false });
  }
}
