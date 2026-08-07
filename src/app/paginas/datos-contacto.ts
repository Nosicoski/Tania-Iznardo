import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { normalizarTelefono, telefonoArgentino } from '../datos/telefono';
import { NavegacionReserva } from '../servicios/navegacion-reserva';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { FalloConfirmacion, ReservaStore } from '../servicios/reserva-store';
import { Cuentas } from '../servicios/cuentas';
import { Notificaciones } from '../servicios/notificaciones';
import { PREPARATIVOS } from '../datos/preparativos';

/**
 * Qué se le dice al paciente cuando el bloque que había elegido ya no se puede
 * tomar. Salvo 'ya-confirmada', todos terminan en "elegí otro horario".
 */
const MOTIVOS: Record<FalloConfirmacion, string> = {
  'ya-confirmada': 'Este turno ya estaba confirmado: no lo reservamos dos veces.',
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
            <div class="solapas" role="group" aria-label="Cómo querés reservar">
              <div class="solapa activa">
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
              </div>
              <button type="button" class="solapa" (click)="cuentas.abrir('login')">
                <span class="solapa-icono" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path
                      d="M10 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h3"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                    />
                    <path
                      d="M13.5 8 17 11.8m0 0L13.5 15.5M17 11.8H8.5"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span class="solapa-textos">
                  <strong>Iniciá sesión</strong>
                  <span>Tus datos se completan solos y el turno queda en tu cuenta</span>
                </span>
              </button>
            </div>
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
                <!-- El destello avisa, sin cartel, que le acomodamos el formato -->
                <span class="control" [class.ajustado]="telefonoAjustado()">
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
                    @if (formulario.controls.telefono.hasError('otroPais')) {
                      Por ahora atendemos solo con teléfonos de Argentina (+54).
                    } @else {
                      Ingresá un teléfono válido (solo números).
                    }
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

        <div class="lateral">
          <app-resumen-reserva
            [notaPago]="true"
            cta="Confirmar turno"
            [ctaDeshabilitada]="formulario.invalid || enviando()"
            (ctaClick)="confirmar()"
          />

          <!-- Solo en escritorio: acá sobra el alto que deja el formulario al
               costado, y es el mejor momento para leer cómo llegar preparado
               (todavía se puede cambiar el horario). En mobile no entra: el
               resumen ya se fue a la barra de abajo. -->
          <aside class="preparar tarjeta">
            <h2 class="preparar-titulo">Prepará tu visita</h2>
            <ul>
              @for (item of preparativos; track item.titulo) {
                <li>
                  <span class="check" aria-hidden="true">
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
                  <!-- Solo el titular: es lo que entra en el alto que deja el
                       formulario, y cada uno se entiende sin explicación. El
                       detalle completo va en la pantalla de confirmación. -->
                  <span class="preparar-texto">{{ item.titulo }}</span>
                </li>
              }
            </ul>
          </aside>
        </div>
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
    /*
     * Las dos columnas terminan en la misma línea: el resumen queda arriba y
     * los preparativos se estiran hasta cubrir el alto que deja el formulario.
     * De ahí el align-items: stretch acá y el flex: 1 en la tarjeta de abajo.
     */
    .disposicion {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
      align-items: stretch;
      margin-top: 1.25rem;
    }
    .columna {
      min-width: 0;
    }
    .lateral {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 0;
    }

    /* Prepará tu visita: la tarjeta que rellena el hueco del lateral */
    /*
      * Con flex:1 crece hasta el pie del lateral, así que su contenido tiene que
      * entrar en el hueco que deja el formulario (si lo pasa, es esta columna la
      * que estira la fila y quedan las dos desparejas). De ahí lo compacto.
      */
    .preparar {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0.9rem 1.1rem;
    }
    .preparar-titulo {
      font-size: var(--txt-2xs);
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--neutro);
      margin-bottom: 0.55rem;
    }
    .preparar ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      /* Se reparte el alto sobrante entre los ítems en vez de dejar un hueco
         muerto al final de la tarjeta. */
      justify-content: space-between;
      flex: 1;
      gap: 0.4rem;
    }
    .preparar li {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .check {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--primario-suave);
      color: var(--primario-fuerte);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .preparar-texto {
      font-size: var(--txt-xs);
      font-weight: 600;
      color: var(--secundario);
      line-height: 1.3;
      min-width: 0;
    }

    /* Reservar sin cuenta (activo) o entrar con la cuenta */
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
        box-shadow 0.15s ease;
    }
    /* Franja de marca que aparece solo en la activa */
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
      font-size: var(--txt-base);
      color: var(--secundario);
      line-height: 1.25;
    }
    .solapa-textos span {
      font-size: var(--txt-xs);
      color: var(--neutro);
      line-height: 1.35;
    }
    button.solapa:hover {
      border-color: var(--primario);
      box-shadow: var(--sombra-media);
    }
    button.solapa:hover .solapa-icono {
      background: var(--primario-fuerte);
      color: var(--blanco);
    }
    .solapa.activa {
      border-color: var(--primario);
      background: var(--primario-suave);
    }
    .solapa.activa strong {
      color: var(--primario-fuerte);
    }
    .solapa.activa .solapa-icono {
      background: var(--primario-fuerte);
      color: var(--blanco);
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
      background: var(--primario-fuerte);
      color: var(--blanco);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .sesion strong {
      display: block;
      font-size: var(--txt-sm);
    }
    /* Solo el texto de abajo: si alcanzara al avatar le pisaría el color del tick. */
    .sesion div span {
      font-size: var(--txt-xs);
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
      font-weight: 600;
      font-size: var(--txt-xs);
      letter-spacing: 0.02em;
      color: var(--neutro-oscuro);
    }
    /* Rojo, no verde: el asterisco avisa, no decora */
    .etiqueta i {
      color: #b3392f;
      font-style: normal;
      font-weight: 700;
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
    /*
     * Formato acomodado (se pegó o autocompletó "+54 9 351…"): el campo se
     * enciende y se apaga solo. Anima color nada más, no toca layout.
     */
    .control.ajustado {
      animation: destello 0.62s ease-out;
    }
    @keyframes destello {
      0%,
      70% {
        background: var(--primario-suave);
        border-color: var(--primario);
      }
      100% {
        background: var(--blanco);
        border-color: var(--borde);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .control.ajustado {
        animation: none;
      }
    }
    .icono {
      color: var(--neutro-claro);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: color 0.15s ease;
    }
    .control:focus-within .icono {
      color: var(--primario-fuerte);
    }
    input,
    textarea {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: none;
      padding: 0.7rem 0;
      font-size: var(--txt-base);
      color: var(--secundario);
      font-family: inherit;
      resize: vertical;
    }
    input::placeholder,
    textarea::placeholder {
      color: var(--neutro-claro);
    }
    .prefijo {
      font-weight: 700;
      font-size: var(--txt-sm);
      color: var(--neutro);
      flex-shrink: 0;
    }
    .ayuda {
      color: var(--neutro);
      font-size: var(--txt-xs);
    }

    .error {
      color: #b3392f;
      font-size: var(--txt-xs);
      font-weight: 600;
    }
    .error-caja {
      margin: 1.1rem 0 0;
      background: rgba(179, 57, 47, 0.08);
      color: #b3392f;
      border-radius: var(--radio-chico);
      padding: 0.6rem 0.85rem;
      font-size: var(--txt-sm);
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
      font-size: var(--txt-sm);
    }
    /* Nota al pie del formulario: separada por una línea, como el pie de una
       ficha en papel. */
    .legal {
      margin: 1.4rem 0 0;
      padding-top: 1rem;
      border-top: 1px solid var(--borde-suave);
      color: var(--neutro);
      font-size: var(--txt-xs);
      line-height: 1.55;
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
      /* Sin columna lateral no hay hueco que rellenar, y sumarlos al final del
         formulario solo alargaría el paso. Se leen igual en la confirmación. */
      .preparar {
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
  private readonly navegacion = inject(NavegacionReserva);
  protected readonly store = inject(ReservaStore);
  protected readonly cuentas = inject(Cuentas);
  private readonly notificaciones = inject(Notificaciones);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly preparativos = PREPARATIVOS;

  /** El bloque elegido ya no se puede tomar; el turno NO se guardó. */
  protected readonly errorTurno = signal<string | null>(null);
  /** Confirmación en curso: evita que un doble clic reserve dos veces. */
  protected readonly enviando = signal(false);
  /** Con el turno ya confirmado no tiene sentido ofrecer otro horario. */
  protected readonly puedeReelegir = signal(true);
  /** Le acabamos de acomodar el formato al teléfono: dura lo que el destello. */
  protected readonly telefonoAjustado = signal(false);
  private destello?: ReturnType<typeof setTimeout>;

  protected readonly formulario = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, telefonoArgentino]],
    // Obligatorio siempre: el consultorio lo necesita para la ficha.
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    observaciones: [''],
  });

  constructor() {
    // También cubre iniciar sesión desde el popup sin salir de esta pantalla.
    effect(() => {
      this.cuentas.sesion();
      this.aplicarSesion();
    });
    // Sirve para las dos formas de cargarlo: tipeado a mano (con el 0 y el 15)
    // y autocompletado por el navegador (que trae el "+54" entero).
    this.formulario.controls.telefono.valueChanges.subscribe((valor) =>
      this.acomodarTelefono(valor),
    );
    inject(DestroyRef).onDestroy(() => clearTimeout(this.destello));
  }

  /**
   * Deja en el campo el número local pelado. Si vino de otro país no se toca:
   * el validador lo marca y el paciente decide qué poner.
   */
  private acomodarTelefono(valor: string): void {
    const { valor: limpio, otroPais } = normalizarTelefono(valor);
    if (otroPais || limpio === valor) {
      return;
    }
    this.formulario.controls.telefono.setValue(limpio, { emitEvent: false });
    clearTimeout(this.destello);
    this.telefonoAjustado.set(true);
    this.destello = setTimeout(() => this.telefonoAjustado.set(false), 700);
  }

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && control.touched;
  }

  protected confirmar(): void {
    // Un turno, una confirmación: el doble clic no puede duplicarlo.
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

    const previo = this.store.revisar();
    if (previo) {
      this.rechazar(previo);
      return;
    }

    this.enviando.set(true);

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

  /** Con sesión iniciada los datos vienen cargados. */
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
  }
}
