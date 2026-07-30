import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { Calendario } from '../componentes/calendario';
import { ReservaStore } from '../servicios/reserva-store';
import { Disponibilidad, MotivoSinCupo } from '../servicios/disponibilidad';
import { diasDeAtencion, inicialesDe, profesionalesPara } from '../datos/profesionales';
import { aHora, duracionTexto } from '../datos/formato';
import { Profesional, Tramo } from '../modelos';

/** Un horario ofrecido y su relación con el bloque elegido. */
interface Chip {
  hora: string;
  /**
   * El bloque elegido ocupa esta franja horaria. Va pintado igual que el
   * inicio y con su propia cruz: así se ve exactamente cuánto abarca la visita.
   */
  enBloque: boolean;
}

/**
 * Paso 1: día y horario de la visita. Los servicios ya vienen elegidos; acá se
 * resuelve el bloque consecutivo (quién atiende cada tramo y a qué hora) y se
 * puede ajustar el orden o pedir un profesional puntual.
 */
@Component({
  selector: 'app-agendar',
  imports: [
    Stepper,
    ResumenReserva,
    Calendario,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
  ],
  template: `
    <app-stepper [paso]="2" />
    <div class="contenedor">
      @if (store.hayServicios()) {
        <button type="button" class="volver" (click)="volver()">
          <span aria-hidden="true">←</span> Volver a los servicios
        </button>

        <h1>{{ titulo() }}</h1>
        <p class="ayuda">
          {{ duracion(store.duracionServicios()) }} en total ·
          @if (store.cantidad() > 1) {
            se hacen uno después del otro, en una sola visita.
          } @else {
            elegí el día y el horario.
          }
        </p>

        <div class="disposicion">
          <section class="tarjeta calendario">
            <!-- Los servicios de la visita, con su profesional y su orden -->
            <ol
              class="tramos"
              cdkDropList
              [cdkDropListDisabled]="store.cantidad() < 2"
              (cdkDropListDropped)="soltarTramo($event)"
            >
              @for (t of tramosVista(); track t.servicio.id; let i = $index; let ultimo = $last) {
                <li class="tramo" [class.resuelto]="!!t.hora" cdkDrag [cdkDragLockAxis]="'y'">
                  <!-- Fantasma que queda en el hueco mientras se arrastra -->
                  <div class="hueco" *cdkDragPlaceholder></div>
                  @if (store.cantidad() > 1) {
                    <span class="agarre" cdkDragHandle aria-hidden="true" title="Arrastrá para reordenar">
                      <svg viewBox="0 0 12 16" width="10" height="13" fill="currentColor">
                        <circle cx="3.5" cy="3" r="1.4" />
                        <circle cx="8.5" cy="3" r="1.4" />
                        <circle cx="3.5" cy="8" r="1.4" />
                        <circle cx="8.5" cy="8" r="1.4" />
                        <circle cx="3.5" cy="13" r="1.4" />
                        <circle cx="8.5" cy="13" r="1.4" />
                      </svg>
                    </span>
                  }
                  <span class="tramo-numero">{{ i + 1 }}</span>
                  <div class="tramo-cuerpo">
                    <div class="tramo-titulo">
                      <strong>{{ t.servicio.nombre }}</strong>
                      <span class="tramo-dur">{{ t.servicio.duracionMin }} min</span>
                    </div>
                    @if (t.hora) {
                      <span class="tramo-hora">{{ t.hora }} – {{ t.fin }} hs</span>
                    } @else {
                      <span class="tramo-hora pendiente">Falta el horario</span>
                    }

                    <!-- Profesional del tramo: automático o pedido a mano -->
                    <div class="profes" role="radiogroup" [attr.aria-label]="'Profesional para ' + t.servicio.nombre">
                      <button
                        type="button"
                        class="globo"
                        role="radio"
                        [attr.aria-checked]="!fijado(t.servicio.id)"
                        [class.activo]="!fijado(t.servicio.id)"
                        (click)="fijar(t.servicio.id, null)"
                      >
                        <span class="globo-avatar avatar-todos" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                            <circle cx="9" cy="9" r="3.4" stroke="currentColor" stroke-width="1.8" />
                            <path
                              d="M3.2 19c.7-3 3-4.6 5.8-4.6S14.1 16 14.8 19"
                              stroke="currentColor"
                              stroke-width="1.8"
                              stroke-linecap="round"
                            />
                            <path
                              d="M16 7.2a2.9 2.9 0 0 1 0 5.6M17.6 14.8c2 .5 3.4 2 4 4.2"
                              stroke="currentColor"
                              stroke-width="1.8"
                              stroke-linecap="round"
                            />
                          </svg>
                        </span>
                        <span class="globo-nombre">
                          @if (t.profesional && !fijado(t.servicio.id)) {
                            {{ t.profesional.nombre }}
                            <i class="globo-auto">asignado</i>
                          } @else {
                            Cualquiera
                          }
                        </span>
                      </button>

                      @for (p of candidatos(t.servicio.id); track p.id) {
                        <button
                          type="button"
                          class="globo"
                          role="radio"
                          [attr.aria-checked]="fijado(t.servicio.id) === p.id"
                          [class.activo]="fijado(t.servicio.id) === p.id"
                          (click)="fijar(t.servicio.id, p.id)"
                        >
                          <span class="globo-avatar">
                            @if (conFoto(p)) {
                              <img [src]="p.foto" [alt]="p.nombre" (error)="fotoRota(p.id)" />
                            } @else {
                              <span class="globo-iniciales">{{ iniciales(p.nombre) }}</span>
                            }
                          </span>
                          <span class="globo-nombre">{{ p.nombre }}</span>
                        </button>
                      }
                    </div>
                  </div>

                  @if (store.cantidad() > 1) {
                    <span class="flechas">
                      <button
                        type="button"
                        class="flecha"
                        [disabled]="i === 0"
                        (click)="store.mover(t.servicio.id, -1)"
                        [attr.aria-label]="'Adelantar ' + t.servicio.nombre"
                      >
                        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
                          <path
                            d="M4 10 8 6l4 4"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="flecha"
                        [disabled]="ultimo"
                        (click)="store.mover(t.servicio.id, 1)"
                        [attr.aria-label]="'Atrasar ' + t.servicio.nombre"
                      >
                        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
                          <path
                            d="M4 6l4 4 4-4"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </span>
                  }
                </li>
              }
            </ol>

            @if (store.cantidad() > 1) {
              <p class="nota-orden">
                @if (store.ordenManual()) {
                  Estás usando tu propio orden.
                  <button type="button" class="enlace" (click)="store.soltarOrden()">
                    Dejar que lo acomodemos
                  </button>
                } @else {
                  Acomodamos el orden para que la visita entre en el día que elijas.
                  Arrastrá un servicio para decidirlo vos.
                }
              </p>
            }

            <app-calendario
              [seleccionada]="store.fecha()"
              [disponible]="hayCupo"
              (elegir)="elegirDia($event)"
            />

            @if (store.fecha()) {
              @if (horarios().manana.length || horarios().tarde.length) {
                <!-- Bloque elegido: se pinta el rango completo, no una hora sola -->
                @if (store.hora(); as inicio) {
                  <div class="bloque-elegido">
                    <span class="bloque-icono" aria-hidden="true">
                      <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                        <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.6" />
                        <path
                          d="M10 6v4.2l2.8 1.7"
                          stroke="currentColor"
                          stroke-width="1.6"
                          stroke-linecap="round"
                        />
                      </svg>
                    </span>
                    <span class="bloque-texto">
                      Tu visita: <b>{{ inicio }} – {{ store.finBloque() }} hs</b>
                      <i>({{ duracion(store.duracionBloque()) }})</i>
                    </span>
                  </div>
                }

                @for (franja of franjas(); track franja.clave) {
                  @if (franja.chips.length) {
                    <h4 class="franja">{{ franja.nombre }}</h4>
                    <div class="horarios">
                      @for (chip of franja.chips; track chip.hora) {
                        <div class="hora-caja">
                          <button
                            type="button"
                            class="hora"
                            [class.elegida]="chip.enBloque"
                            [attr.aria-pressed]="chip.enBloque"
                            (click)="elegirHora(chip.hora)"
                          >
                            {{ chip.hora }}
                          </button>
                          <!-- Toda hora que ocupa la visita se suelta desde su propia cruz -->
                          @if (chip.enBloque) {
                            <button
                              type="button"
                              class="soltar"
                              (click)="store.soltarBloque()"
                              aria-label="Quitar el horario elegido"
                              title="Quitar el horario elegido"
                            >
                              <svg viewBox="0 0 12 12" width="9" height="9" fill="none" aria-hidden="true">
                                <path
                                  d="M3 3l6 6M9 3l-6 6"
                                  stroke="currentColor"
                                  stroke-width="1.8"
                                  stroke-linecap="round"
                                />
                              </svg>
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                }
                <div class="aviso">
                  ⚠ Los horarios podrían agotarse, ¡reservá lo antes posible!
                </div>
              } @else {
                <div class="sin-horarios">
                  <p class="sin-titulo">{{ mensajeSinCupo().titulo }}</p>
                  <p class="sin-detalle">{{ mensajeSinCupo().detalle }}</p>
                  @if (mensajeSinCupo().separar) {
                    <button type="button" class="btn btn-borde" (click)="volver()">
                      Agendarlos por separado
                    </button>
                  }
                </div>
              }
            } @else {
              <p class="elegi-dia">Elegí un día para ver los horarios disponibles.</p>
            }

            <!-- Siempre a la vista, atenuado hasta que el bloque esté resuelto. -->
            <button
              type="button"
              class="btn btn-primario continuar"
              [disabled]="!store.listaParaDatos()"
              (click)="continuar()"
            >
              Continuar
            </button>
          </section>

          <app-resumen-reserva
            cta="Continuar"
            [ctaDeshabilitada]="!store.listaParaDatos()"
            (ctaClick)="continuar()"
          />
        </div>
      }
    </div>
  `,
  styles: `
    .volver {
      background: none;
      border: none;
      padding: 0;
      color: var(--neutro);
      font-size: 0.9rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .volver:hover {
      color: var(--primario);
    }
    .ayuda {
      color: var(--neutro);
      margin: 0.4rem 0 0;
      font-size: 0.9rem;
    }
    .disposicion {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
      align-items: start;
      margin-top: 1.25rem;
    }
    .calendario {
      padding: 1.5rem;
    }

    /* Los tramos de la visita, en orden */
    .tramos {
      list-style: none;
      margin: 0 0 0.9rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .tramo {
      display: flex;
      align-items: flex-start;
      gap: 0.7rem;
      background: var(--fondo);
      border: 1px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0.75rem 0.85rem;
    }
    .tramo.resuelto {
      border-color: var(--primario);
      background: var(--primario-suave);
    }
    /* Arrastre: el agarre es lo único que inicia el drag, no toda la tarjeta */
    .agarre {
      color: var(--neutro-claro);
      display: grid;
      place-items: center;
      padding: 0.2rem 0.1rem;
      margin-top: 0.15rem;
      cursor: grab;
      flex-shrink: 0;
      touch-action: none;
      transition: color 0.15s ease;
    }
    .tramo:hover .agarre {
      color: var(--primario);
    }
    .cdk-drag-preview {
      box-shadow: 0 12px 28px rgba(22, 48, 47, 0.22);
      border-radius: var(--radio-chico);
      cursor: grabbing;
    }
    .cdk-drag-preview .agarre {
      cursor: grabbing;
    }
    /* Hueco que deja el tramo mientras viaja */
    .hueco {
      border: 1.5px dashed var(--primario);
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      min-height: 68px;
    }
    .cdk-drag-animating,
    .tramos.cdk-drop-list-dragging .tramo:not(.cdk-drag-placeholder) {
      transition: transform 0.22s cubic-bezier(0, 0, 0.2, 1);
    }
    .tramo-numero {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--primario);
      color: var(--blanco);
      font-size: 0.72rem;
      font-weight: 800;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .tramo-cuerpo {
      flex: 1;
      min-width: 0;
    }
    .tramo-titulo {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tramo-titulo strong {
      font-size: 0.88rem;
      line-height: 1.3;
    }
    .tramo-dur {
      font-size: 0.75rem;
      color: var(--neutro);
      white-space: nowrap;
    }
    .tramo-hora {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primario);
      margin-top: 0.1rem;
    }
    .tramo-hora.pendiente {
      color: var(--neutro-claro);
      font-weight: 500;
      font-style: italic;
    }

    /* Globos de profesional dentro de cada tramo */
    .profes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.5rem;
    }
    .globo {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--blanco);
      border: 1.5px solid var(--borde);
      border-radius: 999px;
      padding: 0.2rem 0.6rem 0.2rem 0.2rem;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .globo:hover {
      border-color: var(--primario);
    }
    .globo.activo {
      border-color: var(--primario);
      background: var(--primario-suave);
    }
    .globo-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--primario-suave);
      color: var(--primario);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .globo.activo .globo-avatar:not(.avatar-todos) {
      background: var(--blanco);
    }
    .globo-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .globo-iniciales {
      font-size: 0.6rem;
      font-weight: 800;
    }
    .avatar-todos {
      background: var(--primario);
      color: var(--blanco);
    }
    .globo-nombre {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--secundario);
      white-space: nowrap;
    }
    .globo-auto {
      color: var(--neutro);
      font-weight: 500;
      font-style: normal;
      font-size: 0.7rem;
    }

    .nota-orden {
      margin: 0 0 1.1rem;
      font-size: 0.78rem;
      color: var(--neutro);
      border-bottom: 1px solid var(--borde);
      padding-bottom: 0.9rem;
    }
    .enlace {
      background: none;
      border: none;
      padding: 0;
      color: var(--primario);
      font-weight: 700;
      font-size: 0.78rem;
    }
    .enlace:hover {
      text-decoration: underline;
    }

    /* Resumen del bloque elegido, arriba de los horarios */
    .bloque-elegido {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.4rem;
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      padding: 0.6rem 0.85rem;
    }
    .bloque-icono {
      color: var(--primario);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .bloque-texto {
      font-size: 0.85rem;
      color: var(--secundario);
    }
    .bloque-texto b {
      color: var(--primario);
    }
    .bloque-texto i {
      color: var(--neutro);
      font-style: normal;
      font-size: 0.8rem;
    }

    .franja {
      margin: 1.4rem 0 0.6rem;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--neutro);
      border-top: 1px solid var(--borde);
      padding-top: 1.1rem;
    }
    .horarios {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    /* La caja deja lugar a la cruz sin recortarla */
    .hora-caja {
      position: relative;
      padding-top: 5px;
      padding-right: 5px;
    }
    .hora {
      border: 1.5px solid var(--borde);
      background: var(--blanco);
      border-radius: 999px;
      padding: 0.5rem 1.15rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--secundario);
    }
    .hora:hover {
      border-color: var(--primario);
    }
    /* Toda hora que ocupa la visita, no solo el inicio */
    .hora.elegida {
      background: var(--primario);
      border-color: var(--primario);
      color: var(--blanco);
    }
    .soltar {
      position: absolute;
      top: 0;
      right: 0;
      width: 19px;
      height: 19px;
      border-radius: 50%;
      border: 1.5px solid var(--primario);
      background: var(--blanco);
      color: var(--primario);
      display: grid;
      place-items: center;
      padding: 0;
      line-height: 0;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .soltar:hover {
      background: var(--primario);
      color: var(--blanco);
    }

    .aviso {
      margin-top: 1.25rem;
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      border-radius: var(--radio-chico);
      padding: 0.7rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
    }
    /* Día sin horarios: decimos por qué y ofrecemos la salida */
    .sin-horarios {
      margin-top: 1.5rem;
      border-top: 1px solid var(--borde);
      padding-top: 1.25rem;
    }
    .sin-titulo {
      margin: 0;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--secundario);
    }
    .sin-detalle {
      margin: 0.3rem 0 0;
      color: var(--neutro);
      font-size: 0.85rem;
    }
    .sin-horarios .btn {
      margin-top: 1rem;
    }
    .elegi-dia {
      color: var(--neutro);
      margin: 1.5rem 0 0;
      border-top: 1px solid var(--borde);
      padding-top: 1.25rem;
    }
    .continuar {
      width: 100%;
      margin-top: 1.5rem;
    }
    .continuar:disabled {
      opacity: 0.45;
      cursor: default;
    }
    /* Desde acá el resumen pasa a la barra desplegable de abajo. */
    @media (max-width: 1024px) {
      .disposicion {
        display: block;
      }
      /* El botón vive en la barra fija "Tu reserva". */
      .continuar {
        display: none;
      }
    }
    @media (max-width: 720px) {
      .calendario {
        padding: 1rem;
      }
      .tramo {
        padding: 0.65rem 0.7rem;
      }
      .profes {
        margin: 0.5rem -0.7rem 0;
        padding: 0 0.7rem;
        flex-wrap: nowrap;
        overflow-x: auto;
      }
      .flechas {
        margin-left: 0;
      }
    }
    .flechas {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      flex-shrink: 0;
    }
    .flecha {
      width: 24px;
      height: 20px;
      border: none;
      background: none;
      color: var(--neutro);
      display: grid;
      place-items: center;
      border-radius: var(--radio-chico);
    }
    .flecha:hover:not(:disabled) {
      color: var(--primario);
      background: var(--blanco);
    }
    .flecha:disabled {
      opacity: 0.3;
      cursor: default;
    }
  `,
})
export class Agendar {
  private readonly router = inject(Router);
  protected readonly store = inject(ReservaStore);
  private readonly disponibilidad = inject(Disponibilidad);
  private readonly calendario = viewChild(Calendario);

  protected readonly iniciales = inicialesDe;
  protected readonly duracion = duracionTexto;
  /** Fotos que no cargaron: caen al avatar con iniciales. */
  private readonly sinFoto = signal<string[]>([]);

  protected readonly titulo = computed(() => {
    const lista = this.store.carrito();
    return lista.length === 1 ? lista[0].nombre : `Tu visita · ${lista.length} servicios`;
  });

  protected readonly horarios = computed(() => {
    const fecha = this.store.fecha();
    return fecha
      ? this.disponibilidad.horariosPara(this.store.consulta(), fecha)
      : { manana: [], tarde: [] };
  });

  /**
   * Lo que se muestra en la lista de tramos. Con el bloque resuelto usa el plan
   * (orden y profesionales reales); si no, los servicios del carrito sin hora.
   */
  protected readonly tramosVista = computed(() => {
    const plan = this.store.plan();
    if (plan) {
      return plan.map((t) => ({
        servicio: t.servicio,
        profesional: t.profesional,
        hora: aHora(t.inicioMin),
        fin: aHora(t.inicioMin + t.duracionMin),
      }));
    }
    return this.store.carrito().map((servicio) => ({
      servicio,
      profesional: null as Profesional | null,
      hora: null as string | null,
      fin: null as string | null,
    }));
  });

  /** Las dos franjas con sus chips, marcando las que caen dentro del bloque. */
  protected readonly franjas = computed(() => {
    const horarios = this.horarios();
    const plan = this.store.plan();
    const inicio = this.store.hora();
    const rango = this.rangoDe(plan);
    void inicio;
    const chips = (horas: string[]): Chip[] =>
      horas.map((hora) => ({ hora, enBloque: !!rango && dentro(hora, rango) }));
    return [
      { clave: 'manana', nombre: 'Mañana', chips: chips(horarios.manana) },
      { clave: 'tarde', nombre: 'Tarde', chips: chips(horarios.tarde) },
    ];
  });

  /** Se evalúa dentro del computed del calendario, por eso lee los signals ahí. */
  protected readonly hayCupo = (fecha: Date): boolean =>
    this.disponibilidad.tieneCupo(this.store.consulta(), fecha);

  protected readonly mensajeSinCupo = computed(() => {
    const fecha = this.store.fecha();
    const consulta = this.store.consulta();
    const motivo: MotivoSinCupo = fecha
      ? this.disponibilidad.motivoSinCupo(consulta, fecha)
      : 'sin-hueco';
    const varios = this.store.cantidad() > 1;
    switch (motivo) {
      case 'profesional-no-atiende': {
        // El pedido del usuario es lo que bloquea la fecha: se lo decimos.
        const quienes = fecha
          ? this.disponibilidad.fijadosQueNoAtienden(consulta, fecha)
          : [];
        const detalle = quienes
          .map((p) => `${p.nombre} atiende ${diasDeAtencion(p)}`)
          .join('. ');
        return {
          titulo:
            quienes.length === 1
              ? `${quienes[0].nombre} no atiende ese día`
              : 'Los profesionales que pediste no atienden ese día',
          detalle: `${detalle}. Elegí otra fecha o volvé a "Cualquiera" para que lo asignemos nosotros.`,
          separar: false,
        };
      }
      case 'sin-dia-comun':
        return {
          titulo: 'Estos servicios no se pueden hacer el mismo día',
          detalle:
            'Los profesionales que los dan no coinciden en ningún día de la semana. Podés agendarlos en visitas separadas.',
          separar: true,
        };
      case 'no-entra':
        return {
          titulo: 'No entran juntos en una sola visita',
          detalle:
            'La suma de los servicios supera el turno de atención de la mañana y de la tarde. Probá con menos servicios.',
          separar: true,
        };
      case 'dia-sin-equipo':
        return {
          titulo: 'Ese día no está todo el equipo',
          detalle: varios
            ? 'Alguno de los servicios de tu visita no se atiende ese día. Probá con otra fecha.'
            : 'Nadie atiende este servicio ese día. Probá con otra fecha.',
          separar: false,
        };
      default:
        return {
          titulo: 'No quedan horarios para este día',
          detalle: varios
            ? 'No hay un hueco seguido donde entren todos los servicios. Probá con otra fecha, cambiá el orden o pedí "Cualquiera" en los profesionales.'
            : 'Probá con otra fecha.',
          separar: false,
        };
    }
  });

  constructor() {
    // Al volver desde el paso de datos, mostrar el período del día ya elegido.
    effect(() => {
      const fecha = this.store.fecha();
      if (fecha) {
        this.calendario()?.mostrarFecha(fecha);
      }
    });
  }

  protected conFoto(profesional: Profesional): boolean {
    return !!profesional.foto && !this.sinFoto().includes(profesional.id);
  }

  protected fotoRota(id: string): void {
    this.sinFoto.update((lista) => (lista.includes(id) ? lista : [...lista, id]));
  }

  /** Solo quienes ofrecen ese servicio puntual (no toda la categoría). */
  protected candidatos(servicioId: string): Profesional[] {
    return profesionalesPara(servicioId);
  }

  protected fijado(servicioId: string): string | null {
    return this.store.profesionalFijado(servicioId);
  }

  protected fijar(servicioId: string, profesionalId: string | null): void {
    this.store.fijarProfesional(servicioId, profesionalId);
  }

  /** Reordena la visita al soltar el tramo arrastrado. */
  protected soltarTramo(evento: CdkDragDrop<unknown>): void {
    const { previousIndex, currentIndex } = evento;
    if (previousIndex === currentIndex) {
      return;
    }
    const servicio = this.tramosVista()[previousIndex]?.servicio;
    if (servicio) {
      this.store.reubicar(servicio.id, currentIndex);
    }
  }

  protected elegirDia(fecha: Date): void {
    this.store.elegirFecha(fecha);
  }

  /** Al elegir la hora se resuelve el bloque entero de una vez. */
  protected elegirHora(hora: string): void {
    const fecha = this.store.fecha();
    if (!fecha) {
      return;
    }
    if (this.store.hora() === hora) {
      this.store.soltarBloque();
      return;
    }
    const plan = this.disponibilidad.planDe(this.store.consulta(), fecha, hora);
    if (plan) {
      this.store.elegirBloque(hora, plan);
    }
  }

  protected volver(): void {
    this.router.navigate(['/servicio']);
  }

  protected continuar(): void {
    this.router.navigate(['/datos']);
  }

  private rangoDe(plan: Tramo[] | null): { desde: number; hasta: number } | null {
    if (!plan?.length) {
      return null;
    }
    const ultimo = plan[plan.length - 1];
    return { desde: plan[0].inicioMin, hasta: ultimo.inicioMin + ultimo.duracionMin };
  }
}

function dentro(hora: string, rango: { desde: number; hasta: number }): boolean {
  const [h, m] = hora.split(':').map(Number);
  const minutos = h * 60 + m;
  return minutos >= rango.desde && minutos < rango.hasta;
}
