import { Component, computed, inject, signal } from '@angular/core';
import { NavegacionReserva } from '../servicios/navegacion-reserva';
import { Negocio } from '../servicios/negocio';
import { Cuentas } from '../servicios/cuentas';
import { AgendaGuardada } from '../servicios/agenda-guardada';
import { ReservaStore } from '../servicios/reserva-store';
import { inicialesDe } from '../datos/profesionales';
import { Visita, agruparEnVisitas, cuandoEsVisita, horaDe } from '../datos/visitas';
import { fechaLarga, precioARS } from '../datos/formato';
import { TurnoGuardado } from '../modelos';

/**
 * Turnos pasados de muestra: enseñan cómo se ve el historial y para qué sirve
 * (reagendar en dos toques, revisar el detalle). Fechas relativas a hoy para
 * que siempre queden en el pasado.
 */
function turnosPasadosMock(): TurnoGuardado[] {
  const dia = 24 * 60 * 60 * 1000;
  const hace = (dias: number, hora: number, minutos: number): number => {
    const d = new Date(Date.now() - dias * dia);
    d.setHours(hora, minutos, 0, 0);
    return d.getTime();
  };
  return [
    {
      servicioId: 'masaje-descontracturante',
      profesionalId: 'nicolas-duarte',
      inicio: hace(15, 10, 0),
      duracionMin: 50,
      reservaId: 'mock-pasado-1',
    },
    {
      servicioId: 'postural-individual',
      profesionalId: 'camila-ferreyra',
      inicio: hace(28, 16, 30),
      duracionMin: 45,
      reservaId: 'mock-pasado-2',
    },
  ];
}

/** Turnos de la cuenta con sesión iniciada, separados en próximos y pasados. */
@Component({
  selector: 'app-mis-turnos',
  template: `
    <div class="contenedor">
      @if (cuentas.sesion(); as usuario) {
        <!-- Encabezado protagonista: el saludo y el próximo turno, sin métricas -->
        <header class="encabezado tarjeta">
          <div class="saludo">
            <span class="avatar">{{ iniciales(usuario.nombre + ' ' + usuario.apellido) }}</span>
            <div class="saludo-textos">
              <h1>Hola, {{ usuario.nombre }}</h1>
              @if (proximos()[0]; as proxima) {
                <p class="proximo">
                  Tu próximo turno:
                  <b>{{ proxima.titulo }}</b>
                  · {{ cuandoEs(proxima).toLowerCase() }} a las {{ hora(proxima.inicio) }} hs
                </p>
              } @else {
                <p class="proximo">No tenés turnos próximos. ¿Agendamos uno?</p>
              }
              <p class="bajada">{{ usuario.email }} · {{ usuario.telefono }}</p>
            </div>
          </div>
          <button type="button" class="btn btn-primario" (click)="reservar()">
            Reservar otro turno
          </button>
        </header>

        @if (proximos().length) {
          <h2 class="titulo-seccion">Próximos turnos</h2>
          <div class="lista">
            @for (v of proximos(); track v.clave) {
              <article class="tarjeta turno">
                <div class="turno-fecha">
                  <span class="dia">{{ v.inicio.getDate() }}</span>
                  <span class="mes">{{ mesCorto(v.inicio) }}</span>
                </div>

                <div class="turno-cuerpo">
                  <div class="turno-cabecera">
                    <span class="portada">
                      <img [src]="v.imagen" alt="" aria-hidden="true" />
                    </span>
                    <h3>{{ v.titulo }}</h3>
                    <span class="estado" [class.hoy]="v.faltan === 0">
                      {{ cuandoEs(v) }}
                    </span>
                  </div>

                  <dl class="datos">
                    <div>
                      <dt>Cuándo</dt>
                      <dd>{{ fecha(v.inicio) }} · {{ hora(v.inicio) }} a {{ hora(v.fin) }} hs</dd>
                    </div>
                    <div>
                      <dt>Profesional</dt>
                      <dd>{{ v.profesionales }}</dd>
                    </div>
                    <div>
                      <dt>Dónde</dt>
                      <dd>{{ negocio().direccion }} · {{ negocio().ciudad }}</dd>
                    </div>
                    <div>
                      <dt>A nombre de</dt>
                      <dd>{{ v.paciente ?? usuario.nombre + ' ' + usuario.apellido }}</dd>
                    </div>
                  </dl>

                  <footer class="turno-pie">
                    <span class="duracion">{{ v.duracionMin }} min</span>
                    <span class="precio">{{ precio(v.precio) }}</span>
                    <span class="pago">se abona en el consultorio</span>
                  </footer>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="tarjeta vacio">
            <span class="vacio-icono" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                <rect
                  x="3.2"
                  y="4.8"
                  width="17.6"
                  height="15"
                  rx="3"
                  stroke="currentColor"
                  stroke-width="1.6"
                />
                <path d="M3.2 9.4h17.6" stroke="currentColor" stroke-width="1.6" />
                <path
                  d="M8 2.8v3.2M16 2.8v3.2"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <h3>No tenés turnos próximos</h3>
            <p>Cuando reserves uno, va a aparecer acá con todos los detalles.</p>
            <button type="button" class="btn btn-primario" (click)="reservar()">
              Reservar un turno
            </button>
          </div>
        }

        @if (pasados().length) {
          <h2 class="titulo-seccion">Turnos pasados</h2>
          <div class="lista">
            @for (v of pasados(); track v.clave) {
              <article class="tarjeta turno pasado">
                <div class="turno-fecha">
                  <span class="dia">{{ v.inicio.getDate() }}</span>
                  <span class="mes">{{ mesCorto(v.inicio) }}</span>
                </div>
                <div class="turno-cuerpo">
                  <div class="turno-cabecera">
                    <span class="portada">
                      <img [src]="v.imagen" alt="" aria-hidden="true" />
                    </span>
                    <h3>{{ v.titulo }}</h3>
                    <span class="estado">Realizado</span>
                  </div>
                  <p class="linea-simple">
                    {{ fecha(v.inicio) }} · {{ hora(v.inicio) }} hs · con
                    {{ v.profesionales }}
                  </p>

                  @if (detalleAbierto() === v.clave) {
                    <dl class="datos datos-pasado">
                      <div>
                        <dt>Cuándo fue</dt>
                        <dd>{{ fecha(v.inicio) }} · {{ hora(v.inicio) }} a {{ hora(v.fin) }} hs</dd>
                      </div>
                      <div>
                        <dt>Profesional</dt>
                        <dd>{{ v.profesionales }}</dd>
                      </div>
                      <div>
                        <dt>Dónde</dt>
                        <dd>{{ negocio().direccion }} · {{ negocio().ciudad }}</dd>
                      </div>
                      <div>
                        <dt>Abonado</dt>
                        <dd>{{ precio(v.precio) }} · en el consultorio</dd>
                      </div>
                    </dl>
                  }

                  <footer class="acciones-pasado">
                    <button type="button" class="btn btn-primario" (click)="reagendar(v)">
                      Volver a agendar
                    </button>
                    <button type="button" class="btn btn-borde" (click)="alternarDetalle(v.clave)">
                      {{ detalleAbierto() === v.clave ? 'Ocultar detalle' : 'Ver detalle' }}
                    </button>
                  </footer>
                </div>
              </article>
            }
          </div>
        }
      } @else {
        <div class="tarjeta invitacion">
          <span class="vacio-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <circle cx="12" cy="9" r="3.6" stroke="currentColor" stroke-width="1.7" />
              <path
                d="M4.8 19.5c.9-3.4 3.7-5.2 7.2-5.2s6.3 1.8 7.2 5.2"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          </span>
          <h1>Entrá para ver tus turnos</h1>
          <p>
            Con tu cuenta vas a encontrar acá tus próximos turnos, el historial de
            visitas y los datos de cada reserva.
          </p>
          <div class="invitacion-acciones">
            <button type="button" class="btn btn-primario" (click)="cuentas.abrir('login')">
              Iniciar sesión
            </button>
            <button type="button" class="btn btn-borde" (click)="cuentas.abrir('registro')">
              Crear cuenta
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .contenedor {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    /* Encabezado protagonista: reemplaza a las viejas cards de métricas */
    .encabezado {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
      padding: 1.5rem 1.75rem;
      border-left: 4px solid var(--primario);
    }
    .saludo {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      min-width: 0;
    }
    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .saludo-textos {
      min-width: 0;
    }
    .encabezado h1 {
      font-size: 1.6rem;
      line-height: 1.2;
    }
    .proximo {
      margin: 0.3rem 0 0;
      font-size: 0.92rem;
      color: var(--secundario);
    }
    .proximo b {
      color: var(--primario);
    }
    .bajada {
      margin: 0.2rem 0 0;
      color: var(--neutro);
      font-size: 0.82rem;
    }

    .titulo-seccion {
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--neutro);
      margin-bottom: 0.85rem;
    }
    .lista {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      margin-bottom: 2.25rem;
    }

    /* Tarjeta de turno */
    .turno {
      display: flex;
      gap: 1.25rem;
      padding: 1.25rem;
      overflow: hidden;
      position: relative;
    }
    .turno::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--primario);
    }
    .turno-fecha {
      width: 64px;
      flex-shrink: 0;
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.6rem 0;
      align-self: flex-start;
    }
    .dia {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primario);
      line-height: 1;
    }
    .mes {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--primario);
    }
    .turno-cuerpo {
      flex: 1;
      min-width: 0;
    }
    .turno-cabecera {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
    }
    .turno-cabecera h3 {
      font-size: 1rem;
      line-height: 1.3;
      flex: 1;
      min-width: 0;
    }
    /* Imagen del servicio */
    .portada {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--primario-suave);
      flex-shrink: 0;
    }
    .portada img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .estado {
      flex-shrink: 0;
      background: var(--fondo);
      border: 1px solid var(--borde);
      border-radius: 999px;
      padding: 0.2rem 0.7rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--neutro);
      white-space: nowrap;
    }
    .estado.hoy {
      background: var(--terciario-suave);
      border-color: transparent;
      color: var(--terciario-oscuro);
    }
    .datos {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.7rem 1.25rem;
      margin: 0;
    }
    dt {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--neutro-claro);
      margin-bottom: 0.1rem;
    }
    dd {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--secundario);
    }
    .turno-pie {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-top: 1rem;
      border-top: 1px solid var(--borde);
      padding-top: 0.75rem;
      font-size: 0.8rem;
      color: var(--neutro);
    }
    .duracion::after {
      content: '·';
      margin-left: 0.5rem;
    }
    .precio {
      color: var(--primario);
      font-weight: 800;
      font-size: 0.95rem;
    }

    /* Turnos pasados: griseados, con reagendar y detalle a mano */
    .pasado {
      background: var(--fondo);
    }
    .pasado::before {
      background: var(--neutro-claro);
    }
    .pasado .turno-fecha {
      background: var(--blanco);
    }
    .pasado .dia,
    .pasado .mes {
      color: var(--neutro);
    }
    .pasado .portada {
      filter: grayscale(0.7);
      opacity: 0.8;
    }
    .pasado h3 {
      color: var(--neutro);
    }
    .linea-simple {
      margin: 0;
      font-size: 0.85rem;
      color: var(--neutro);
    }
    .datos-pasado {
      margin-top: 0.9rem;
      background: var(--blanco);
      border-radius: var(--radio-chico);
      padding: 0.85rem 1rem;
    }
    .datos-pasado dd {
      color: var(--neutro);
    }
    .acciones-pasado {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      margin-top: 0.9rem;
    }
    .acciones-pasado .btn {
      padding: 0.5rem 1.1rem;
      font-size: 0.85rem;
    }

    /* Vacío e invitación a iniciar sesión */
    .vacio,
    .invitacion {
      text-align: center;
      padding: 2.5rem 1.5rem;
      max-width: 520px;
      margin: 0 auto 2.25rem;
    }
    .invitacion {
      margin-top: 2rem;
    }
    .vacio-icono {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primario-suave);
      color: var(--primario);
      display: grid;
      place-items: center;
      margin: 0 auto 1rem;
    }
    .vacio p,
    .invitacion p {
      color: var(--neutro);
      font-size: 0.9rem;
      margin: 0.5rem 0 1.5rem;
    }
    .invitacion-acciones {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    @media (max-width: 720px) {
      .encabezado {
        padding: 1.25rem 1.1rem;
      }
      .avatar {
        width: 52px;
        height: 52px;
        font-size: 1.05rem;
      }
      .encabezado h1 {
        font-size: 1.3rem;
      }
      .turno {
        flex-direction: column;
        gap: 0.9rem;
      }
      .turno-fecha {
        flex-direction: row;
        gap: 0.4rem;
        width: auto;
        align-self: flex-start;
        padding: 0.35rem 0.8rem;
      }
      .dia {
        font-size: 1.15rem;
      }
      .datos {
        grid-template-columns: 1fr;
      }
      .encabezado .btn {
        width: 100%;
      }
      .acciones-pasado .btn {
        flex: 1;
      }
    }
  `,
})
export class MisTurnos {
  protected readonly cuentas = inject(Cuentas);
  private readonly agenda = inject(AgendaGuardada);
  private readonly navegacion = inject(NavegacionReserva);
  private readonly store = inject(ReservaStore);

  /** Dueño de la agenda: el consultorio, o el negocio que embebe el flujo. */
  protected readonly negocio = inject(Negocio).datos;
  protected readonly iniciales = inicialesDe;
  protected readonly fecha = fechaLarga;
  protected readonly precio = precioARS;

  /** Turno pasado con el detalle desplegado (uno por vez). */
  protected readonly detalleAbierto = signal<string | null>(null);

  private readonly visitas = computed(() => {
    const email = this.cuentas.sesion()?.email;
    return email ? agruparEnVisitas(this.agenda.turnosDe(email)) : [];
  });

  protected readonly proximos = computed(() => this.visitas().filter((v) => !v.pasado));
  /**
   * Los pasados se leen del más reciente al más viejo. Se suman dos turnos de
   * muestra para que se vea qué ofrece la sección (reagendar, ver detalle).
   */
  protected readonly pasados = computed(() => {
    const reales = this.visitas().filter((v) => v.pasado);
    const muestra = agruparEnVisitas(turnosPasadosMock());
    return [...reales, ...muestra].sort((a, b) => b.inicio.getTime() - a.inicio.getTime());
  });

  protected readonly cuandoEs = cuandoEsVisita;
  protected readonly hora = horaDe;

  protected mesCorto(fecha: Date): string {
    return new Intl.DateTimeFormat('es-AR', { month: 'short' })
      .format(fecha)
      .replace('.', '');
  }

  protected alternarDetalle(clave: string): void {
    this.detalleAbierto.update((actual) => (actual === clave ? null : clave));
  }

  /** Vuelve a reservar lo mismo: el servicio queda precargado, falta el día. */
  protected reagendar(visita: Visita): void {
    const tramo = visita.tramos[0];
    if (!tramo?.servicio) {
      this.reservar();
      return;
    }
    this.store.reiniciar();
    this.store.elegirServicio(tramo.servicio);
    if (tramo.profesional) {
      this.store.fijarProfesional(tramo.servicio.id, tramo.profesional.id);
    }
    this.navegacion.ir('agendar');
  }

  protected reservar(): void {
    this.navegacion.ir('servicio');
  }
}
