import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NavegacionReserva } from '../servicios/navegacion-reserva';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { Calendario } from '../componentes/calendario';
import { ReservaStore } from '../servicios/reserva-store';
import { Disponibilidad, MotivoSinCupo } from '../servicios/disponibilidad';
import { AgendaGuardada } from '../servicios/agenda-guardada';
import { diasDeAtencion, inicialesDe, profesionalesPara } from '../datos/profesionales';
import { combinablesDe, imagenDe } from '../datos/catalogo';
import { duracionTexto, precioARS } from '../datos/formato';
import { Profesional, Tramo } from '../modelos';

/** Un horario ofrecido y su relación con el turno elegido. */
interface Chip {
  hora: string;
  /**
   * El turno elegido ocupa esta franja horaria. Va pintado igual que el
   * inicio y con su propia cruz: así se ve exactamente cuánto abarca. Un
   * servicio de 60 minutos que arranca a las 9:30 también ocupa las 10:00.
   */
  enBloque: boolean;
}

/**
 * Paso 2: día y horario del turno. El servicio ya viene elegido; acá se
 * resuelve quién atiende y a qué hora, con la opción de pedir un profesional
 * puntual.
 */
@Component({
  selector: 'app-agendar',
  imports: [Stepper, ResumenReserva, Calendario, NgTemplateOutlet],
  template: `
    <app-stepper [paso]="2" />
    <div class="contenedor">
      @if (store.servicio(); as servicio) {
        <button type="button" class="volver" (click)="volver()">
          <span aria-hidden="true">←</span> Volver a los servicios
        </button>

        <h1>{{ servicio.nombre }}</h1>
        <p class="ayuda">Elegí el día y el horario de tu turno.</p>

        <div class="disposicion">
          <section class="tarjeta calendario">
            <!-- El servicio elegido, con su duración y su profesional -->
            <div class="tramo">
              <div class="tramo-cuerpo">
                <div class="tramo-titulo">
                  <strong>{{ servicio.nombre }}</strong>
                  <span class="tramo-dur">{{ duracion(servicio.duracionMin) }}</span>
                </div>

                <!-- Profesional del turno: automático o pedido a mano -->
                <div
                  class="profes"
                  role="radiogroup"
                  [attr.aria-label]="'Profesional para ' + servicio.nombre"
                >
                  <button
                    type="button"
                    class="globo"
                    role="radio"
                    [attr.aria-checked]="!fijado(servicio.id)"
                    [class.activo]="!fijado(servicio.id)"
                    (click)="fijar(servicio.id, null)"
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
                      @if (profesionalAsignado(); as p) {
                        {{ p.nombre }}
                        <i class="globo-auto">asignado</i>
                      } @else {
                        Cualquiera
                      }
                    </span>
                  </button>

                  @for (p of candidatos(servicio.id); track p.id) {
                    <button
                      type="button"
                      class="globo"
                      role="radio"
                      [attr.aria-checked]="fijado(servicio.id) === p.id"
                      [class.activo]="fijado(servicio.id) === p.id"
                      (click)="fijar(servicio.id, p.id)"
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
            </div>

            <app-calendario
              [seleccionada]="store.fecha()"
              [disponible]="hayCupo"
              (elegir)="elegirDia($event)"
            />

            <!-- Alto reservado: elegir día, hora o profesional cambia el
                 contenido de acá adentro sin correr el botón de abajo. -->
            <div class="zona-horarios">
              @if (store.fecha()) {
                @if (horarios().manana.length || horarios().tarde.length) {
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
                            <!-- Toda hora que ocupa el turno se suelta desde su propia cruz -->
                            @if (chip.enBloque) {
                              <button
                                type="button"
                                class="soltar"
                                (click)="store.soltarBloque()"
                                aria-label="Quitar el horario elegido"
                                title="Quitar el horario elegido"
                              >
                                <svg
                                  viewBox="0 0 12 12"
                                  width="9"
                                  height="9"
                                  fill="none"
                                  aria-hidden="true"
                                >
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
                } @else {
                  <div class="sin-horarios">
                    <p class="sin-titulo">{{ mensajeSinCupo().titulo }}</p>
                    <p class="sin-detalle">{{ mensajeSinCupo().detalle }}</p>
                  </div>
                }
              } @else {
                <p class="elegi-dia">Elegí un día para ver los horarios disponibles.</p>
              }

              <!-- En mobile los combinables van acá: dentro del alto que ya
                   estaba reservado para los horarios, sin agregar scroll. -->
              @if (combinables().length) {
                <div class="combinar combinar-mobile">
                  <ng-container [ngTemplateOutlet]="combinarTpl" />
                </div>
              }
            </div>

            <!-- Siempre a la vista, atenuado hasta que el turno esté resuelto. -->
            <button
              type="button"
              class="btn btn-primario continuar"
              [disabled]="!store.listaParaDatos()"
              (click)="continuar()"
            >
              Continuar
            </button>
          </section>

          <div class="lateral">
            <app-resumen-reserva
              cta="Continuar"
              [ctaDeshabilitada]="!store.listaParaDatos()"
              (ctaClick)="continuar()"
            />
            <!-- En desktop los combinables aprovechan el blanco que queda
                 debajo del resumen, sin tocar la columna principal. -->
            @if (combinables().length) {
              <aside class="tarjeta combinar combinar-panel">
                <ng-container [ngTemplateOutlet]="combinarTpl" />
              </aside>
            }
          </div>
        </div>

        <ng-template #combinarTpl>
          <div class="combinar-encabezado">
            <span class="combinar-icono" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="combinar-copy">
              <b>¿Querés agregar otro servicio?</b>
              <i>Se agenda aparte, con su propio día y horario.</i>
            </span>
          </div>

          @for (c of combinables(); track c.id) {
            <article class="combinable" [class.elegido]="elegido(c.id)">
              <div class="combinable-cabecera">
                <span class="combinable-foto">
                  @if (conImagen(c.id)) {
                    <img [src]="imagen(c)" alt="" aria-hidden="true" (error)="imagenRota(c.id)" />
                  } @else {
                    <span class="combinable-inicial" aria-hidden="true">{{ c.nombre[0] }}</span>
                  }
                  <!-- El tilde tapa la foto: se ve elegido de un vistazo. -->
                  @if (elegido(c.id)) {
                    <span class="combinable-tilde" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
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
                </span>
                <span class="combinable-textos">
                  <strong>{{ c.nombre }}</strong>
                  <span class="combinable-meta">
                    <span>{{ duracion(c.duracionMin) }}</span>
                    <b>{{ precio(c.precio) }}</b>
                  </span>
                </span>
              </div>
              <!-- El botón va en su propia fila: el texto largo del estado
                   elegido no le come el ancho al nombre del servicio. -->
              <button
                type="button"
                class="combinable-btn"
                [class.activo]="elegido(c.id)"
                [attr.aria-pressed]="elegido(c.id)"
                (click)="alternarCombinable(c.id)"
              >
                @if (elegido(c.id)) {
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" aria-hidden="true">
                    <path
                      d="M3 8.5 6.5 12 13 4.5"
                      stroke="currentColor"
                      stroke-width="2.4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Agendamos después
                } @else {
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" aria-hidden="true">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      stroke-width="2.6"
                      stroke-linecap="round"
                    />
                  </svg>
                  Me interesa
                }
              </button>
            </article>
          }

          <!-- "Agendamos después" no dice cuándo: esto sí. Va siempre y una
               sola vez para toda la lista, porque aparecer al tocar el botón
               estiraría el hueco reservado de horarios y el paso ganaría
               scroll. -->
          <p class="combinable-cuando">El día y el horario los elegís al confirmar este turno.</p>
        </ng-template>
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

    /* El servicio del turno */
    .tramo {
      display: flex;
      align-items: flex-start;
      gap: 0.7rem;
      background: var(--primario-suave);
      border: 1px solid var(--primario);
      border-radius: var(--radio-chico);
      padding: 0.75rem 0.85rem;
      margin-bottom: 0.9rem;
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
      font-weight: 700;
      color: var(--primario);
      white-space: nowrap;
    }

    /* Globos de profesional */
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
      transition:
        border-color 0.15s ease,
        background 0.15s ease;
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

    /* Alto reservado para todo lo que cambia al elegir día, hora o
       profesional. Sin esto el botón de continuar sube y baja en cada toque. */
    .zona-horarios {
      min-height: 292px;
      display: flex;
      flex-direction: column;
    }
    /* Los estados sin horarios se centran en el hueco reservado: así se ve
       intencional y no como una tarjeta a medio llenar. */
    .zona-horarios > .elegi-dia,
    .zona-horarios > .sin-horarios {
      margin-top: auto;
      margin-bottom: auto;
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
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
      gap: 0.6rem;
    }
    /* La caja deja lugar a la cruz sin recortarla */
    .hora-caja {
      position: relative;
      padding-top: 5px;
      padding-right: 5px;
    }
    .hora {
      width: 100%;
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
    /* Toda hora que ocupa el turno, no solo el inicio */
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
      transition:
        background 0.15s ease,
        color 0.15s ease;
    }
    .soltar:hover {
      background: var(--primario);
      color: var(--blanco);
    }

    /* Día sin horarios: decimos por qué */
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
    /* Combinables: en desktop, tarjeta bajo el resumen; en mobile, al pie del
       hueco reservado de horarios. En ninguno de los dos agregan scroll. */
    .lateral {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 0;
      /* El lateral entero acompaña el scroll (antes lo hacía solo el resumen). */
      position: sticky;
      top: 1rem;
    }
    .combinar-panel {
      padding: 1.1rem 1.15rem 1.15rem;
      border-left: 4px solid var(--terciario);
    }
    .combinar-mobile {
      display: none;
      margin-top: auto;
      padding-top: 1.1rem;
      border-top: 1px solid var(--borde);
    }
    .combinar-encabezado {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.7rem;
    }
    .combinar-icono {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .combinar-copy {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
    }
    .combinar-copy b {
      font-size: 0.84rem;
      font-weight: 800;
      color: var(--secundario);
      line-height: 1.3;
    }
    .combinar-copy i {
      font-style: normal;
      font-size: 0.76rem;
      color: var(--neutro);
      line-height: 1.35;
    }

    .combinable {
      background: var(--fondo);
      border: 1.5px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0.6rem;
      margin-bottom: 0.5rem;
      transition:
        border-color 0.15s ease,
        background 0.15s ease,
        box-shadow 0.15s ease;
    }
    .combinable:last-child {
      margin-bottom: 0;
    }
    .combinable:hover {
      border-color: var(--primario);
      box-shadow: var(--sombra);
    }
    .combinable.elegido {
      background: var(--primario-suave);
      border-color: var(--primario);
    }
    .combinable-cabecera {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    /* Foto del servicio: si el archivo no está, queda la inicial sobre el
       fondo de la marca en vez de un recuadro roto. */
    .combinable-foto {
      position: relative;
      width: 54px;
      height: 54px;
      flex-shrink: 0;
      border-radius: 10px;
      overflow: hidden;
      background: var(--primario-suave);
      color: var(--primario);
      display: grid;
      place-items: center;
    }
    .combinable-foto img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .combinable-inicial {
      font-size: 1.15rem;
      font-weight: 800;
    }
    .combinable-tilde {
      position: absolute;
      inset: 0;
      background: rgba(52, 129, 126, 0.72);
      color: var(--blanco);
      display: grid;
      place-items: center;
    }
    .combinable-textos {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }
    .combinable-textos strong {
      font-size: 0.82rem;
      line-height: 1.25;
      /* Dos líneas como máximo: los nombres largos no estiran la tarjeta. */
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .combinable-meta {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: var(--neutro);
      white-space: nowrap;
    }
    .combinable-meta b {
      color: var(--primario);
      font-weight: 800;
    }
    /* Ancho completo y en su propia fila: el botón cambia de texto al
       elegirlo y así nunca le roba lugar al nombre del servicio. */
    .combinable-btn {
      width: 100%;
      margin-top: 0.6rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      border: 1.5px solid var(--primario);
      background: var(--blanco);
      color: var(--primario);
      border-radius: 999px;
      padding: 0.42rem 0.85rem;
      font-size: 0.78rem;
      font-weight: 700;
      transition:
        background 0.15s ease,
        color 0.15s ease;
    }
    .combinable-btn:hover {
      background: var(--primario-suave);
    }
    .combinable-btn.activo {
      background: var(--primario);
      color: var(--blanco);
    }
    .combinable-btn.activo:hover {
      background: var(--primario-oscuro);
    }
    .combinable-cuando {
      margin: 0.55rem 0 0;
      font-size: 0.72rem;
      line-height: 1.35;
      color: var(--neutro);
      text-align: center;
    }

    /* Estado vacío dentro del hueco reservado: centrado y sin separador, así
       se lee como "acá van a aparecer los horarios" y no como algo cortado. */
    .elegi-dia {
      color: var(--neutro);
      text-align: center;
      font-size: 0.9rem;
      margin: 0;
      padding: 0 1rem;
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
      /* Los combinables pasan del lateral al hueco de horarios. */
      .combinar-panel {
        display: none;
      }
      .combinar-mobile {
        display: block;
      }
    }
    @media (max-width: 720px) {
      .calendario {
        padding: 1rem;
      }
      /* Con la tarjeta más angosta los horarios ocupan más filas, así que el
         hueco reservado tiene que ser más alto que en escritorio. Incluye el
         renglón de "cuándo se agenda" del combinable. */
      .zona-horarios {
        min-height: 444px;
      }
      /* El dedo necesita más blanco que el puntero */
      .volver {
        padding: 0.5rem 0;
        min-height: 40px;
      }
      .soltar {
        width: 24px;
        height: 24px;
      }
      .hora {
        padding: 0.62rem 0.6rem;
      }
      .hora-caja {
        padding-top: 7px;
        padding-right: 7px;
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
    }
  `,
})
export class Agendar {
  private readonly navegacion = inject(NavegacionReserva);
  protected readonly store = inject(ReservaStore);
  private readonly disponibilidad = inject(Disponibilidad);
  private readonly agenda = inject(AgendaGuardada);
  private readonly calendario = viewChild(Calendario);

  protected readonly iniciales = inicialesDe;
  protected readonly duracion = duracionTexto;
  protected readonly precio = precioARS;
  protected readonly imagen = imagenDe;
  /** Fotos que no cargaron: caen al avatar con iniciales. */
  private readonly sinFoto = signal<string[]>([]);
  /** Ídem para las fotos de los combinables. */
  private readonly sinImagen = signal<string[]>([]);

  /**
   * Combinables que se pueden ofrecer: los del servicio en curso, menos los
   * que el paciente ya tiene reservados a futuro. No tiene sentido ofrecerle
   * combinar un servicio para el que ya tiene turno.
   */
  protected readonly combinables = computed(() => {
    const servicio = this.store.servicio();
    if (!servicio) {
      return [];
    }
    const email = this.store.emailPaciente();
    const yaReservados = new Set(
      (email ? this.agenda.turnosDe(email) : [])
        .filter((t) => t.inicio > Date.now())
        .map((t) => t.servicioId),
    );
    return combinablesDe(servicio).filter((c) => !yaReservados.has(c.id));
  });

  protected readonly horarios = computed(() => {
    const fecha = this.store.fecha();
    return fecha
      ? this.disponibilidad.horariosPara(this.store.consulta(), fecha)
      : { manana: [], tarde: [] };
  });

  /** Quién quedó asignado por el sistema cuando no se pidió a nadie. */
  protected readonly profesionalAsignado = computed<Profesional | null>(() => {
    const servicio = this.store.servicio();
    if (!servicio || this.store.profesionalFijado(servicio.id)) {
      return null;
    }
    return this.store.plan()?.[0]?.profesional ?? null;
  });

  /** Las dos franjas con sus chips, marcando las que ocupa el turno elegido. */
  protected readonly franjas = computed(() => {
    const horarios = this.horarios();
    const rango = this.rangoDe(this.store.plan());
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
    switch (motivo) {
      case 'profesional-no-atiende': {
        // El pedido del usuario es lo que bloquea la fecha: se lo decimos.
        const quienes = fecha ? this.disponibilidad.fijadosQueNoAtienden(consulta, fecha) : [];
        const detalle = quienes.map((p) => `${p.nombre} atiende ${diasDeAtencion(p)}`).join('. ');
        return {
          titulo:
            quienes.length === 1
              ? `${quienes[0].nombre} no atiende ese día`
              : 'Los profesionales que pediste no atienden ese día',
          detalle: `${detalle}. Elegí otra fecha o volvé a "Cualquiera" para que lo asignemos nosotros.`,
        };
      }
      case 'dia-sin-equipo':
        return {
          titulo: 'Ese día no está todo el equipo',
          detalle: 'Nadie atiende este servicio ese día. Probá con otra fecha.',
        };
      default:
        return {
          titulo: 'No quedan horarios para este día',
          detalle: 'Probá con otra fecha.',
        };
    }
  });

  constructor() {
    // Entrar con el calendario vacío obliga a un clic que casi siempre es el
    // mismo: dejamos elegido el primer día con lugar. Si ya hay fecha (se
    // vuelve desde el paso 3, o se soltó el horario) no se toca nada.
    effect(() => {
      if (this.store.fecha()) {
        return;
      }
      const primero = this.disponibilidad.primerDiaConCupo(this.store.consulta());
      if (primero) {
        this.store.elegirFecha(primero);
      }
    });

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

  protected conImagen(servicioId: string): boolean {
    return !this.sinImagen().includes(servicioId);
  }

  protected imagenRota(servicioId: string): void {
    this.sinImagen.update((lista) => (lista.includes(servicioId) ? lista : [...lista, servicioId]));
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

  protected elegido(servicioId: string): boolean {
    return this.store.combinablePendiente()?.id === servicioId;
  }

  /** Un solo combinable pendiente por vez: elegir otro reemplaza al anterior. */
  protected alternarCombinable(servicioId: string): void {
    const actual = this.store.combinablePendiente();
    const servicio = this.combinables().find((c) => c.id === servicioId) ?? null;
    this.store.elegirCombinable(actual?.id === servicioId ? null : servicio);
  }

  protected elegirDia(fecha: Date): void {
    this.store.elegirFecha(fecha);
  }

  /** Al elegir la hora se resuelve el turno completo de una vez. */
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
    this.navegacion.ir('servicio');
  }

  protected continuar(): void {
    this.navegacion.ir('datos');
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
