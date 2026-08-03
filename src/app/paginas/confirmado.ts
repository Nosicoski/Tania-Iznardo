import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavegacionReserva } from '../servicios/navegacion-reserva';
import { Negocio } from '../servicios/negocio';
import { ReservaStore } from '../servicios/reserva-store';
import { Cuentas } from '../servicios/cuentas';
import { AgendaGuardada } from '../servicios/agenda-guardada';
import { Notificaciones } from '../servicios/notificaciones';
import { Profesional } from '../modelos';
import { aHora, fechaLarga, precioARS } from '../datos/formato';

/** Recordatorios de la demo: falta confirmarlos con el consultorio. */
const PREPARATIVOS = [
  {
    titulo: 'Llegá 10 minutos antes',
    detalle: 'Así podemos completar tu ficha con tranquilidad antes de empezar.',
  },
  {
    titulo: 'Traé ropa cómoda',
    detalle: 'Calzas o short y remera; en la sesión vas a necesitar moverte.',
  },
  {
    titulo: 'Estudios y documentación',
    detalle: 'Si tenés radiografías, resonancias o estudios recientes, traelos.',
  },
  {
    titulo: 'DNI y credencial',
    detalle: 'Documento y, si corresponde, la credencial de tu obra social.',
  },
  {
    titulo: 'Evitá comidas pesadas',
    detalle: 'Mejor no comer abundante en la hora previa al turno.',
  },
];

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

        <div class="pie">
          @if (cuentas.haySesion()) {
            <!-- Apiladas: "Ver mis turnos" es la acción principal y va arriba. -->
            <div class="acciones apiladas">
              <button type="button" class="btn btn-primario" (click)="irAMisTurnos()">
                Ver mis turnos
              </button>
              <button type="button" class="btn btn-borde" (click)="seguirAgendando()">
                Seguir agendando
              </button>
            </div>
          } @else {
            <!-- Sin cuenta: el alta sale gratis porque los datos ya están cargados -->
            <div class="invitacion">
              <span class="invitacion-icono" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <circle cx="12" cy="9" r="3.4" stroke="currentColor" stroke-width="1.8" />
                  <path
                    d="M4.8 19.5c.9-3.4 3.7-5.2 7.2-5.2s6.3 1.8 7.2 5.2"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <div class="invitacion-textos">
                <strong>Guardá este turno en tu cuenta</strong>
                <span>
                  Ya tenemos tus datos: solo elegí una contraseña y los próximos turnos los reservás
                  en dos clics.
                </span>
              </div>
              <button type="button" class="btn btn-primario" (click)="crearCuenta()">
                Crear cuenta para futuros turnos
              </button>
            </div>
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
    .tilde {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      margin: 0 auto 1.1rem;
    }
    h1 {
      font-size: 1.5rem;
    }
    .subtitulo {
      color: var(--neutro);
      font-size: 0.9rem;
      margin: 0.5rem 0 1.5rem;
    }
    .subtitulo b {
      color: var(--secundario);
    }
    .detalle {
      background: var(--fondo);
      border-radius: var(--radio-chico);
      padding: 1rem 1.25rem;
      margin: 0 0 1rem;
      text-align: left;
    }
    .detalle div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.4rem 0;
      font-size: 0.87rem;
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
      background: var(--primario);
      color: var(--blanco);
      font-size: 0.63rem;
      font-weight: 800;
      vertical-align: middle;
      margin-right: 0.2rem;
    }
    .dur,
    .hora {
      display: block;
      font-weight: 500;
      font-size: 0.8rem;
      color: var(--neutro);
    }
    .hora {
      color: var(--primario);
      font-weight: 700;
    }
    .valor {
      color: var(--primario);
    }
    /* Prepará tu visita: plegado por defecto, se abre con "Ver detalles" */
    .preparar {
      text-align: left;
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      padding: 0.85rem 1.15rem;
      margin: 0 0 1.25rem;
    }
    .preparar-cabecera {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
    }
    .preparar h2 {
      font-size: 0.95rem;
      margin: 0;
    }
    /* Enlace de toda la vida: subrayado y clickeable, sin salir de la página */
    .enlace {
      background: none;
      border: none;
      padding: 0;
      color: var(--primario);
      font-size: 0.85rem;
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
      background: var(--primario);
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
      font-size: 0.82rem;
    }
    .texto b {
      color: var(--secundario);
    }
    .texto span {
      color: var(--neutro);
      line-height: 1.45;
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
    /* Invitación a crear la cuenta, para quien reservó sin registrarse */
    .invitacion {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      text-align: left;
      background: var(--primario-suave);
      border-radius: var(--radio);
      padding: 0.9rem 1.1rem;
      margin-bottom: 0.85rem;
    }
    .invitacion-icono {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .invitacion-textos {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      flex: 1;
      min-width: 0;
    }
    .invitacion-textos strong {
      font-size: 0.92rem;
    }
    .invitacion-textos span {
      font-size: 0.82rem;
      color: var(--neutro);
      line-height: 1.4;
    }
    .invitacion .btn {
      flex-shrink: 0;
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
