import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Cuentas } from '../servicios/cuentas';
import { AgendaGuardada } from '../servicios/agenda-guardada';
import { CONSULTORIO } from '../datos/catalogo';
import { inicialesDe } from '../datos/profesionales';
import { agruparEnVisitas, cuandoEsVisita, horaDe } from '../datos/visitas';
import { duracionTexto, fechaLarga, precioARS } from '../datos/formato';

/** Turnos de la cuenta con sesión iniciada, separados en próximos e historial. */
@Component({
  selector: 'app-mis-turnos',
  template: `
    <div class="contenedor">
      @if (cuentas.sesion(); as usuario) {
        <header class="encabezado">
          <div class="saludo">
            <span class="avatar">{{ iniciales(usuario.nombre + ' ' + usuario.apellido) }}</span>
            <div>
              <h1>Hola, {{ usuario.nombre }}</h1>
              <p class="bajada">{{ usuario.email }} · {{ usuario.telefono }}</p>
            </div>
          </div>
          <button type="button" class="btn btn-primario" (click)="reservar()">
            Reservar otro turno
          </button>
        </header>

        <div class="metricas">
          <div class="metrica">
            <b>{{ proximos().length }}</b>
            <span>{{ proximos().length === 1 ? 'visita próxima' : 'visitas próximas' }}</span>
          </div>
          <div class="metrica">
            <b>{{ pasados().length }}</b>
            <span>{{ pasados().length === 1 ? 'visita anterior' : 'visitas anteriores' }}</span>
          </div>
          <div class="metrica">
            <b>{{ horasTotales() }}</b>
            <span>de tratamiento</span>
          </div>
        </div>

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

                  <!-- Visita con varios servicios: se ven los tramos en orden -->
                  @if (v.tramos.length > 1) {
                    <ol class="tramos">
                      @for (t of v.tramos; track t.clave) {
                        <li>
                          <img class="tramo-foto" [src]="t.imagen" alt="" aria-hidden="true" />
                          <span class="tramo-hora">{{ hora(t.inicio) }}</span>
                          <span class="tramo-nombre">
                            {{ t.servicio?.nombre ?? 'Servicio' }}
                          </span>
                          <span class="suave">
                            {{ t.duracionMin }} min · {{ t.profesional?.nombre ?? 'A confirmar' }}
                          </span>
                        </li>
                      }
                    </ol>
                  }

                  <dl class="datos">
                    <div>
                      <dt>Cuándo</dt>
                      <dd>{{ fecha(v.inicio) }} · {{ hora(v.inicio) }} a {{ hora(v.fin) }} hs</dd>
                    </div>
                    <div>
                      <dt>{{ v.tramos.length > 1 ? 'Profesionales' : 'Profesional' }}</dt>
                      <dd>{{ v.profesionales }}</dd>
                    </div>
                    <div>
                      <dt>Dónde</dt>
                      <dd>{{ consultorio.direccion }} · {{ consultorio.ciudad }}</dd>
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
          <h2 class="titulo-seccion">Historial</h2>
          <div class="lista historial">
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
    .encabezado {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .saludo {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      min-width: 0;
    }
    .avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      font-weight: 800;
      flex-shrink: 0;
    }
    .bajada {
      margin: 0.15rem 0 0;
      color: var(--neutro);
      font-size: 0.85rem;
    }

    /* Tira de métricas */
    .metricas {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .metrica {
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio);
      padding: 0.9rem 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .metrica b {
      font-size: 1.5rem;
      color: var(--primario);
      line-height: 1.1;
    }
    .metrica span {
      font-size: 0.78rem;
      color: var(--neutro);
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
    /* Imagen del servicio (o del primero, si la visita tiene varios) */
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
    .pasado .portada {
      filter: grayscale(0.55);
      opacity: 0.85;
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
    /* Tramos de una visita con varios servicios */
    .tramos {
      list-style: none;
      margin: 0 0 0.9rem;
      padding: 0.7rem 0.85rem;
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .tramos li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-size: 0.82rem;
    }
    .tramo-foto {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--blanco);
      object-fit: cover;
      display: block;
      flex-shrink: 0;
    }
    .tramo-hora {
      font-weight: 800;
      color: var(--primario);
      min-width: 3.2em;
    }
    .tramo-nombre {
      font-weight: 600;
      color: var(--secundario);
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
    .suave {
      color: var(--neutro);
      font-weight: 500;
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

    /* Historial: más compacto y en gris */
    .historial .turno {
      padding: 0.9rem 1.1rem;
    }
    .pasado::before {
      background: var(--neutro-claro);
    }
    .pasado .turno-fecha {
      background: var(--fondo);
    }
    .pasado .dia,
    .pasado .mes {
      color: var(--neutro);
    }
    .linea-simple {
      margin: 0;
      font-size: 0.85rem;
      color: var(--neutro);
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
      .metricas {
        grid-template-columns: 1fr;
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
    }
  `,
})
export class MisTurnos {
  protected readonly cuentas = inject(Cuentas);
  private readonly agenda = inject(AgendaGuardada);
  private readonly router = inject(Router);

  protected readonly consultorio = CONSULTORIO;
  protected readonly iniciales = inicialesDe;
  protected readonly fecha = fechaLarga;
  protected readonly precio = precioARS;

  /**
   * Los turnos agrupados por visita. Los que comparten `reservaId` se
   * reservaron juntos y se muestran como una sola tarjeta; los viejos, sin ese
   * campo, quedan cada uno en su propia visita.
   */
  private readonly visitas = computed(() => {
    const email = this.cuentas.sesion()?.email;
    return email ? agruparEnVisitas(this.agenda.turnosDe(email)) : [];
  });

  protected readonly proximos = computed(() => this.visitas().filter((v) => !v.pasado));
  /** El historial se lee del más reciente al más viejo. */
  protected readonly pasados = computed(() =>
    this.visitas()
      .filter((v) => v.pasado)
      .reverse()
  );

  /** "40 min" hasta la hora; después "2h" o "2h 30m". */
  protected readonly horasTotales = computed(() =>
    duracionTexto(this.visitas().reduce((total, v) => total + v.duracionMin, 0))
  );

  protected readonly cuandoEs = cuandoEsVisita;
  protected readonly hora = horaDe;

  protected mesCorto(fecha: Date): string {
    return new Intl.DateTimeFormat('es-AR', { month: 'short' })
      .format(fecha)
      .replace('.', '');
  }

  protected reservar(): void {
    this.router.navigate(['/servicio']);
  }
}
