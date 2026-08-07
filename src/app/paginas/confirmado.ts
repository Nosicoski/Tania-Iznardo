import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavegacionReserva } from '../servicios/navegacion-reserva';
import { Negocio } from '../servicios/negocio';
import { ReservaStore } from '../servicios/reserva-store';
import { Cuentas } from '../servicios/cuentas';
import { AgendaGuardada } from '../servicios/agenda-guardada';
import { Notificaciones } from '../servicios/notificaciones';
import { Profesional } from '../modelos';
import { aHora, duracionTexto, fechaLarga, precioARS } from '../datos/formato';
import { imagenDe } from '../datos/catalogo';
import { PREPARATIVOS } from '../datos/preparativos';


@Component({
  selector: 'app-confirmado',
  template: `
    <div class="contenedor">
      <div class="tarjeta panel">
        <div class="principal">
          <div class="tilde">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
              <path
                d="m5 12.5 5 5L19 7"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h1>{{ varios() ? '¡Visita confirmada!' : '¡Turno confirmado!' }}</h1>
          <p class="subtitulo">
            @switch (mail.estado()) {
              @case ('enviando') {
                Estamos enviando el detalle a <b>{{ correo() }}</b
                >…
              }
              @case ('enviado') {
                Te enviamos el detalle a <b>{{ correo() }}</b
                >.
              }
              @default {
                Te esperamos en el consultorio.
              }
            }
          </p>

          <!-- Resumen del turno. La invitación a crear la cuenta vive adentro
               de esta misma ficha, al pie: es un dato más del turno ("dónde
               queda guardado"), no una acción que compita con la de seguir
               agendando. -->
          <div class="resumen">
          <dl class="detalle">
            @if (store.fecha(); as f) {
              <div class="cuando">
                <dt>Cuándo</dt>
                <dd>
                  {{ fecha(f) }}
                  <span class="hora">{{ store.hora() }} – {{ store.finBloque() }} hs</span>
                </dd>
              </div>
            }
            @for (t of tramos(); track t.servicio.id; let i = $index) {
              <div class="turno">
                <dt>
                  @if (varios()) {
                    <span class="orden">{{ i + 1 }}</span>
                  }
                  {{ t.servicio.nombre }}
                  <span class="dur">{{ t.duracionMin }} min</span>
                  <span class="dur">
                    con {{ t.profesional.nombre }} · {{ credencial(t.profesional) }}
                  </span>
                </dt>
                <dd>
                  <span class="hora">{{ hora(t.inicioMin) }} hs</span>
                  <span class="dur">{{ precio(t.servicio.precio) }}</span>
                </dd>
              </div>
            }
            <div>
              <dt>Dirección</dt>
              <dd>{{ negocio().direccion }}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd class="valor">{{ precio(store.total()) }} · se abona en el consultorio</dd>
            </div>
          </dl>

          @if (!cuentas.haySesion()) {
            <div class="guardar">
              <span class="guardar-textos">
                <strong>Guardá este turno en tu cuenta</strong>
                <span>Solo te falta elegir una contraseña.</span>
              </span>
              <button type="button" class="guardar-btn" (click)="crearCuenta()">
                Crear cuenta
              </button>
            </div>
          }
          </div>
        </div>

        <!-- Recordatorios mockeados: falta la lista real del consultorio -->
        <section class="preparar">
          <div class="preparar-cabecera">
            <h2>Prepará tu visita</h2>
            <button
              type="button"
              class="enlace"
              [attr.aria-expanded]="verPreparativos()"
              aria-controls="preparativos"
              (click)="verPreparativos.set(!verPreparativos())"
            >
              {{ verPreparativos() ? 'Ocultar detalles' : 'Ver detalles' }}
            </button>
          </div>
          @if (verPreparativos()) {
            <ul id="preparativos">
              @for (item of preparativos; track item.titulo) {
                <li>
                  <span class="check" aria-hidden="true">
                    <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                      <path
                        d="M3 8.5 6.5 12 13 4.5"
                        stroke="currentColor"
                        stroke-width="2.4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                  <span class="texto">
                    <b>{{ item.titulo }}</b>
                    <span>{{ item.detalle }}</span>
                  </span>
                </li>
              }
            </ul>
          }
        </section>

        <!-- El combinable que aceptó en el paso anterior: se agenda aparte.
             Va en el verde de la marca, no en ámbar: es la invitación a seguir,
             y el ámbar en una interfaz se lee como advertencia. -->
        @if (store.combinablePendiente(); as combinable) {
          <section class="siguiente">
            <span class="siguiente-foto">
              @if (fotoOk()) {
                <img [src]="imagen(combinable)" alt="" aria-hidden="true" (error)="fotoOk.set(false)" />
              } @else {
                <span class="siguiente-inicial" aria-hidden="true">{{ combinable.nombre[0] }}</span>
              }
            </span>
            <div class="siguiente-textos">
              <span class="siguiente-rotulo">Lo sumaste a tu reserva</span>
              <strong class="siguiente-nombre">{{ combinable.nombre }}</strong>
              <span class="siguiente-meta">
                {{ duracion(combinable.duracionMin) }}
                <i>·</i>
                {{ precio(combinable.precio) }}
              </span>
            </div>
            <button type="button" class="siguiente-btn" (click)="agendarCombinable()">
              Continuá agendando
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
                <path
                  d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5"
                  stroke="currentColor"
                  stroke-width="1.9"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </section>
        }

        <div class="pie">
          @if (cuentas.haySesion()) {
            <!-- Apiladas: "Ver mis turnos" es la acción principal y va arriba. -->
            <div class="acciones apiladas">
              <button type="button" class="btn btn-primario" (click)="irAMisTurnos()">
                Ver mis turnos
              </button>
              <!-- Con un servicio a medio agendar, "Seguir agendando" compite
                   con la única acción que queda pendiente: no se muestra. -->
              @if (!store.combinablePendiente()) {
                <button type="button" class="btn btn-borde" (click)="seguirAgendando()">
                  Seguir agendando
                </button>
              }
            </div>
          } @else if (!store.combinablePendiente()) {
            <!-- Crear la cuenta ya se ofrece dentro del resumen: acá queda
                 solo la salida hacia el catálogo. -->
            <div class="acciones">
              <button type="button" class="btn btn-borde" (click)="seguirAgendando()">
                Seguir agendando
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    /* Una sola franja centrada: el turno, los recordatorios plegados y las
       acciones, uno debajo del otro. */
    .contenedor {
      padding-top: 2.25rem;
      padding-bottom: 1.5rem;
    }
    .panel {
      max-width: 640px;
      margin: 0 auto;
      padding: 2.25rem 2rem;
      text-align: center;
    }
    .principal {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    /*
     * Sello de confirmación. Se arma en tres tiempos encadenados: el círculo
     * entra con un rebote corto, una onda sale de su borde y recién después el
     * tilde se dibuja trazo a trazo. Es el único momento de la app con
     * animación de entrada, y para eso está: es el remate del flujo.
     */
    .tilde {
      position: relative;
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: var(--primario-fuerte);
      color: var(--blanco);
      display: grid;
      place-items: center;
      margin: 0 auto 1.25rem;
      box-shadow: 0 0 0 8px var(--primario-suave);
      animation: tilde-entra 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both;
    }
    /* Onda que se abre desde el borde y se apaga: una sola vez, sin latido. */
    .tilde::after {
      content: '';
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      border: 2px solid var(--primario);
      animation: tilde-onda 0.85s ease-out 0.3s both;
    }
    /*
     * El tilde se dibuja con el trazo: 22 es un poco más que el largo real del
     * path (~21), así que arranca escondido del todo y termina completo.
     */
    .tilde svg path {
      stroke-dasharray: 22;
      stroke-dashoffset: 22;
      animation: tilde-traza 0.42s ease-out 0.3s forwards;
    }
    @keyframes tilde-entra {
      from {
        transform: scale(0.4);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    @keyframes tilde-onda {
      from {
        transform: scale(0.92);
        opacity: 0.6;
      }
      to {
        transform: scale(1.45);
        opacity: 0;
      }
    }
    @keyframes tilde-traza {
      to {
        stroke-dashoffset: 0;
      }
    }
    /* Sin movimiento: el sello aparece ya hecho, no a medio dibujar. */
    @media (prefers-reduced-motion: reduce) {
      .tilde,
      .tilde::after,
      .tilde svg path {
        animation: none;
      }
      .tilde svg path {
        stroke-dashoffset: 0;
      }
      .tilde::after {
        display: none;
      }
    }
    h1 {
      font-size: calc(var(--txt-2xl) * var(--display-ajuste));
    }
    .subtitulo {
      color: var(--neutro);
      font-size: var(--txt-sm);
      line-height: 1.6;
      margin: 0.6rem 0 1.75rem;
    }
    .subtitulo b {
      color: var(--secundario);
      font-weight: 600;
    }
    /* Ficha del turno: los datos arriba y, al pie, dónde queda guardado. Una
       sola caja para las dos cosas, separadas por un filete. */
    .resumen {
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio-chico);
      overflow: hidden;
      margin: 0 0 1rem;
    }
    .detalle {
      padding: 1.1rem 1.25rem;
      margin: 0;
      text-align: left;
    }
    .guardar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      text-align: left;
      padding: 0.85rem 1.25rem;
      border-top: 1px solid var(--borde-suave);
      background: var(--primario-tenue);
    }
    .guardar-textos {
      display: flex;
      flex-direction: column;
      gap: 0.05rem;
      min-width: 0;
    }
    .guardar-textos strong {
      font-size: var(--txt-sm);
      font-weight: 600;
      color: var(--secundario);
      line-height: 1.3;
    }
    .guardar-textos span {
      font-size: var(--txt-xs);
      color: var(--neutro);
    }
    /* Acción discreta: contorno fino, no relleno. Crear la cuenta es opcional
       y no tiene que pesar más que seguir agendando. */
    .guardar-btn {
      flex-shrink: 0;
      background: var(--blanco);
      color: var(--primario-fuerte);
      border: 1px solid var(--primario);
      border-radius: 999px;
      padding: 0.45rem 1rem;
      font-size: var(--txt-xs);
      font-weight: 600;
      letter-spacing: 0.01em;
      transition:
        background var(--transicion),
        color var(--transicion);
    }
    .guardar-btn:hover {
      background: var(--primario-fuerte);
      color: var(--blanco);
    }
    .detalle div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.4rem 0;
      font-size: var(--txt-sm);
    }
    dt {
      color: var(--neutro);
    }
    dd {
      margin: 0;
      font-weight: 700;
      text-align: right;
    }
    .cuando dd {
      text-align: right;
    }
    .turno {
      border-bottom: 1px solid var(--borde);
      padding-bottom: 0.7rem;
      margin-bottom: 0.3rem;
      align-items: flex-start;
    }
    .turno dt {
      color: var(--secundario);
      font-weight: 700;
      text-align: left;
    }
    /* Número de orden dentro de la visita */
    .orden {
      display: inline-grid;
      place-items: center;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: var(--primario-fuerte);
      color: var(--blanco);
      font-size: var(--txt-2xs);
      font-weight: 700;
      vertical-align: middle;
      margin-right: 0.2rem;
    }
    .dur,
    .hora {
      display: block;
      font-weight: 500;
      font-size: var(--txt-xs);
      color: var(--neutro);
    }
    .hora {
      color: var(--primario-fuerte);
      font-weight: 700;
    }
    .valor {
      color: var(--primario-fuerte);
    }
    /* Prepará tu visita: plegado por defecto, se abre con "Ver detalles" */
    .preparar {
      text-align: left;
      background: var(--primario-tenue);
      border: 1px solid var(--borde-suave);
      border-radius: var(--radio-chico);
      padding: 0.95rem 1.15rem;
      margin: 0 0 1.25rem;
    }
    .preparar-cabecera {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
    }
    .preparar h2 {
      margin: 0;
      font-size: var(--txt-2xs);
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--neutro);
    }
    /* Enlace de toda la vida: subrayado y clickeable, sin salir de la página */
    .enlace {
      background: none;
      border: none;
      padding: 0;
      color: var(--primario-fuerte);
      font-size: var(--txt-sm);
      font-weight: 600;
      text-decoration: underline;
      cursor: pointer;
      flex-shrink: 0;
    }
    .enlace:hover {
      color: var(--secundario);
    }
    .preparar ul {
      list-style: none;
      margin: 0.85rem 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .preparar li {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
    }
    .check {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--primario-fuerte);
      color: var(--blanco);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .texto {
      display: flex;
      flex-direction: column;
      gap: 0.05rem;
      font-size: var(--txt-sm);
    }
    .texto b {
      color: var(--secundario);
    }
    .texto span {
      color: var(--neutro);
      line-height: 1.45;
    }

    /*
     * Lo que queda por agendar. Va en el verde de la marca (el ámbar de antes
     * se leía como advertencia justo cuando queremos invitar a seguir) y con
     * la foto del servicio, que es lo que hace que se vea como una propuesta y
     * no como un aviso del sistema.
     */
    .siguiente {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-align: left;
      background:
        linear-gradient(115deg, var(--primario-tenue), var(--primario-suave));
      border: 1px solid var(--primario);
      border-radius: var(--radio);
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
    }
    .siguiente-foto {
      position: relative;
      width: 66px;
      height: 66px;
      flex-shrink: 0;
      border-radius: var(--radio-chico);
      overflow: hidden;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      /* Filete blanco: separa la foto del fondo tintado sin sumar una caja más */
      box-shadow: 0 0 0 1px var(--blanco) inset;
    }
    .siguiente-foto img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .siguiente-inicial {
      font-family: var(--fuente-titulo);
      font-size: var(--txt-lg);
      font-weight: 600;
    }
    .siguiente-textos {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      flex: 1;
      min-width: 0;
    }
    .siguiente-rotulo {
      font-size: var(--txt-2xs);
      font-weight: 700;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: var(--primario-fuerte);
    }
    .siguiente-nombre {
      font-family: var(--fuente-titulo);
      font-size: calc(var(--txt-md) * var(--display-ajuste));
      font-weight: 600;
      line-height: 1.2;
      color: var(--secundario);
    }
    .siguiente-meta {
      font-size: var(--txt-xs);
      color: var(--neutro);
    }
    .siguiente-meta i {
      font-style: normal;
      color: var(--neutro-claro);
      margin: 0 0.15rem;
    }
    .siguiente-btn {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: var(--primario-fuerte);
      color: var(--blanco);
      border: none;
      border-radius: 999px;
      padding: 0.65rem 1.25rem;
      font-size: var(--txt-sm);
      font-weight: 600;
      letter-spacing: 0.01em;
      box-shadow: var(--sombra);
      transition:
        background var(--transicion),
        box-shadow var(--transicion);
    }
    .siguiente-btn:hover {
      background: var(--primario-oscuro);
      box-shadow: var(--sombra-media);
    }
    /* La flecha se corre al pasar por encima: el gesto de "seguir". */
    .siguiente-btn svg {
      transition: transform var(--transicion);
    }
    .siguiente-btn:hover svg {
      transform: translateX(2px);
    }
    @media (prefers-reduced-motion: reduce) {
      .siguiente-btn svg {
        transition: none;
      }
    }
    @media (max-width: 720px) {
      .siguiente {
        flex-wrap: wrap;
      }
      .siguiente-rotulo {
        letter-spacing: 0.1em;
      }
      .siguiente-btn {
        width: 100%;
        justify-content: center;
        min-height: 46px;
      }
    }

    .acciones {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    /* Con cuenta: una debajo de la otra, "Ver mis turnos" primero. */
    .apiladas {
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
    }
    .apiladas .btn {
      width: 100%;
      max-width: 320px;
    }
    @media (max-width: 720px) {
      .contenedor {
        padding-bottom: 3rem; /* sin barra "Tu reserva" en esta página */
      }
      .acciones {
        flex-direction: column;
      }
      .acciones .btn {
        width: 100%;
      }
      /* El pie del resumen se apila: en angosto, texto y botón en la misma
         fila dejan al texto un canal de pocos píxeles. */
      .guardar {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }
      .guardar-btn {
        width: 100%;
        min-height: 44px;
      }
    }
    /* En pantallas angostas la fila etiqueta/valor deja al valor un canal de
       cien y pico de píxeles: cada dato queda cortado en tres renglones. */
    @media (max-width: 480px) {
      .detalle div {
        flex-direction: column;
        gap: 0.1rem;
      }
      .detalle dd,
      .detalle .cuando dd {
        text-align: left;
      }
      .turno dd {
        display: flex;
        gap: 0.6rem;
        align-items: baseline;
      }
      .turno dd .hora,
      .turno dd .dur {
        display: inline;
      }
    }
  `,
})
export class Confirmado {
  private readonly navegacion = inject(NavegacionReserva);
  protected readonly preparativos = PREPARATIVOS;
  protected readonly imagen = imagenDe;
  /** La foto del servicio que queda por agendar cargó bien. */
  protected readonly fotoOk = signal(true);
  /** Los recordatorios arrancan plegados: el turno es lo que importa. */
  protected readonly verPreparativos = signal(false);
  protected readonly store = inject(ReservaStore);
  protected readonly cuentas = inject(Cuentas);
  private readonly agenda = inject(AgendaGuardada);
  protected readonly mail = inject(Notificaciones);
  /** Dueño de la agenda: el consultorio, o el negocio que embebe el flujo. */
  protected readonly negocio = inject(Negocio).datos;
  protected readonly precio = precioARS;
  protected readonly fecha = fechaLarga;
  protected readonly hora = aHora;
  protected readonly duracion = duracionTexto;

  /** Los tramos de la visita, ya resueltos por el store. */
  protected readonly tramos = computed(() => this.store.plan() ?? []);
  protected readonly varios = computed(() => this.tramos().length > 1);
  /** A dónde salió el mail de confirmación. */
  protected readonly correo = computed(() => this.store.datos()?.email ?? '');

  constructor() {
    // Si crea la cuenta acá mismo, el turno que acaba de reservar como invitado
    // pasa a esa cuenta: si no, "Guardá este turno" sería mentira.
    effect(() => {
      const usuario = this.cuentas.sesion();
      const reserva = this.store.ultimaReserva();
      if (usuario && reserva) {
        this.agenda.asignarCuenta(reserva, usuario.email);
      }
    });
  }

  protected credencial(profesional: Profesional): string {
    return profesional.matricula ?? profesional.profesion;
  }

  /** Abre el alta con lo que el paciente acaba de cargar ya completado. */
  protected crearCuenta(): void {
    const datos = this.store.datos();
    if (!datos) {
      this.cuentas.abrir('registro');
      return;
    }
    this.cuentas.abrir('registro', {
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      telefono: datos.telefono,
      dni: datos.dni,
    });
  }

  /**
   * Arranca la reserva del combinable aceptado: el servicio queda precargado
   * y solo falta elegirle día y horario.
   */
  protected agendarCombinable(): void {
    const servicio = this.store.combinablePendiente();
    if (!servicio) {
      return;
    }
    this.cerrarVisita();
    this.store.elegirServicio(servicio);
    this.navegacion.ir('agendar');
  }

  protected irAMisTurnos(): void {
    this.cerrarVisita();
    this.navegacion.ir('mis-turnos');
  }

  protected seguirAgendando(): void {
    this.cerrarVisita();
    this.navegacion.ir('servicio');
  }

  /** Cierra la visita actual: la próxima arranca limpia, mail incluido. */
  private cerrarVisita(): void {
    this.store.reiniciar();
    this.mail.reiniciar();
  }
}
