import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BASE_WEBP, NavegacionReserva } from '../servicios/navegacion-reserva';
import { Cuentas } from '../servicios/cuentas';
import { FOTO, MARCA } from './marca';
import { ReservaEmbebida } from './reserva-embebida';
import { Hero } from './secciones/hero';
import { Sobre } from './secciones/sobre';
import { Servicios } from './secciones/servicios';
import { Revelar } from './revelar';

/**
 * Landing de muestra: cómo se ve el reservador embebido en el sitio de un
 * negocio cualquiera.
 *
 * El sitio es ficticio y el contenido también, pero el reservador no: es el
 * mismo flujo de `/servicio` montado bajo `/webp`, con la misma agenda y el
 * mismo catálogo. Vive dentro del `router-outlet` de abajo, así que el modal
 * abre y cierra por URL — el botón de atrás del navegador funciona, y un
 * `/webp/agendar` compartido abre la landing con el reservador arriba.
 *
 * La paleta del reservador se redefine sobre `.hoja`: los componentes del flujo
 * ya pintan con `var(--primario)` y compañía, así que heredan la marca del
 * sitio anfitrión sin tocar una sola línea de sus estilos.
 */
@Component({
  selector: 'app-webp',
  imports: [RouterOutlet, Hero, Sobre, Servicios, Revelar],
  host: {
    '(window:scroll)': 'alScrollear()',
    '(document:keydown.escape)': 'cerrarConEscape()',
  },
  template: `
    <div class="sitio" [class.velada]="abierta()" [attr.inert]="abierta() ? '' : null">
      <nav class="barra" [class.compacta]="compacta()">
        <button type="button" class="logo" (click)="alInicio()">
          <span class="logo-marca">{{ marca.nombre }}</span>
          <span class="logo-rubro">{{ marca.apellido }}</span>
        </button>

        <div class="enlaces">
          <button type="button" (click)="irA('nosotros')">Nosotros</button>
          <button type="button" (click)="irA('servicios')">Servicios</button>
          <button type="button" (click)="reserva.irAMisTurnos()">
            {{ cuentas.haySesion() ? 'Mis turnos' : 'Ya tengo turno' }}
          </button>
        </div>

        <button type="button" class="boton-turno" (click)="reserva.abrirCatalogo()">
          Reservar turno
        </button>
      </nav>

      <webp-hero />
      <webp-sobre />
      <webp-servicios />

      <!-- Cierre: el mismo argumento del boceto original, pero con el
           reservador a un clic en vez de una foto de un teléfono. -->
      <section class="cierre">
        <img class="cierre-fondo" [src]="foto.velas" alt="" aria-hidden="true" />
        <div class="cierre-contenido" [webpRevelar]="0">
          <h2>Tu turno, en menos de un minuto</h2>
          <p>
            Sin llamados, sin esperar respuesta y sin crear una cuenta si no querés. Elegís el
            servicio, el día y la hora, y listo.
          </p>
          <button type="button" class="cta" (click)="reserva.abrirCatalogo()">
            Sacar turno ahora
          </button>
        </div>
      </section>

      <footer class="pie">
        <div class="pie-grilla">
          <div>
            <p class="pie-marca">{{ marca.nombre }}</p>
            <p class="pie-rubro">{{ marca.apellido }}</p>
          </div>
          <dl>
            <dt>Dirección</dt>
            <dd>{{ marca.direccion }}</dd>
            <dd>{{ marca.ciudad }}</dd>
          </dl>
          <dl>
            <dt>Contacto</dt>
            <dd>{{ marca.telefono }}</dd>
            <dd>{{ marca.email }}</dd>
          </dl>
          <dl>
            <dt>Atención</dt>
            <dd>{{ marca.horario }}</dd>
          </dl>
        </div>
        <p class="pie-nota">
          Sitio de demostración · marca, equipo y fotografías ficticias. El sistema de reservas es
          real y funciona sobre la misma agenda que la aplicación.
        </p>
      </footer>
    </div>

    <!-- Reservador embebido. El outlet vive siempre en el DOM; lo que abre y
         cierra la capa es la ruta hija que esté activa. -->
    <div class="capa" [class.abierta]="abierta()" [attr.aria-hidden]="abierta() ? null : 'true'">
      <div class="telon" (click)="reserva.cerrar()"></div>
      <div class="hoja" role="dialog" aria-modal="true" [attr.aria-label]="tituloModal">
        <header class="hoja-barra">
          <div class="hoja-marca">
            <span class="hoja-nombre">{{ marca.nombre }}</span>
            <span class="hoja-paso">Reservá tu turno</span>
          </div>
          <button type="button" class="hoja-cerrar" (click)="reserva.cerrar()" aria-label="Cerrar">
            <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5 5 15"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </header>
        <div class="hoja-cuerpo">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      /* Paleta del sitio anfitrión: salvia, arena y crema. */
      --w-salvia: #7d9382;
      --w-salvia-oscuro: #5c7365;
      --w-salvia-suave: #eef1ec;
      --w-profundo: #2c3a33;
      --w-tinta-suave: #5f6d64;
      --w-arena: #d3bfa4;
      --w-arena-oscuro: #97836a;
      --w-crema: #f6f2ea;
      --w-blanco: #fffdf9;
      --w-borde: #e6ded1;
      --w-serif: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;

      display: block;
      background: var(--w-blanco);
      color: var(--w-profundo);
    }

    /* La landing se apaga apenas cuando el reservador está arriba. */
    .sitio {
      transition: filter 0.4s ease, transform 0.4s ease;
    }
    .sitio.velada {
      filter: saturate(0.7) brightness(0.96);
    }

    /* --- Barra de navegación ------------------------------------------- */
    .barra {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.35rem clamp(1.25rem, 4vw, 2.5rem);
      color: #fff;
      transition:
        background 0.35s ease,
        padding 0.35s ease,
        box-shadow 0.35s ease,
        color 0.35s ease;
    }
    .barra.compacta {
      padding: 0.75rem clamp(1.25rem, 4vw, 2.5rem);
      background: rgba(255, 253, 249, 0.92);
      backdrop-filter: blur(10px);
      box-shadow: 0 1px 0 var(--w-borde);
      color: var(--w-profundo);
    }
    .logo {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.1rem;
      margin-right: auto;
      padding: 0;
      border: none;
      background: none;
      color: inherit;
      text-align: left;
    }
    .logo-marca {
      font-family: var(--w-serif);
      font-size: 1.6rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.01em;
    }
    .logo-rubro {
      font-size: 0.63rem;
      font-weight: 600;
      letter-spacing: 0.26em;
      text-transform: uppercase;
      opacity: 0.72;
    }
    .enlaces {
      display: flex;
      gap: 1.75rem;
    }
    .enlaces button {
      padding: 0;
      border: none;
      background: none;
      color: inherit;
      font-size: 0.87rem;
      font-weight: 500;
      opacity: 0.85;
      transition: opacity 0.2s ease;
    }
    .enlaces button:hover {
      opacity: 1;
      text-decoration: underline;
      text-underline-offset: 5px;
    }
    .boton-turno {
      border: 1px solid currentColor;
      border-radius: 999px;
      padding: 0.6rem 1.35rem;
      background: none;
      color: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
    }
    .boton-turno:hover {
      background: var(--w-salvia);
      border-color: var(--w-salvia);
      color: #fff;
    }

    /* --- Cierre --------------------------------------------------------- */
    .cierre {
      position: relative;
      isolation: isolate;
      padding: clamp(5rem, 10vw, 8.5rem) 2rem;
      text-align: center;
      overflow: hidden;
    }
    .cierre-fondo {
      position: absolute;
      inset: 0;
      z-index: -2;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .cierre::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: linear-gradient(rgba(30, 42, 35, 0.72), rgba(30, 42, 35, 0.82));
    }
    .cierre-contenido {
      max-width: 620px;
      margin: 0 auto;
      color: #fff;
    }
    .cierre h2 {
      font-family: var(--w-serif);
      font-weight: 500;
      font-size: clamp(2rem, 4.4vw, 3.2rem);
      line-height: 1.1;
      margin: 0 0 1rem;
      color: #fff;
    }
    .cierre p {
      color: rgba(255, 255, 255, 0.78);
      line-height: 1.75;
      margin: 0 0 2rem;
    }
    .cta {
      border: none;
      border-radius: 999px;
      padding: 1rem 2.2rem;
      background: var(--w-blanco);
      color: var(--w-profundo);
      font-size: 0.94rem;
      font-weight: 600;
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .cta:hover {
      transform: translateY(-2px);
      background: var(--w-arena);
    }

    /* --- Pie ------------------------------------------------------------ */
    .pie {
      background: var(--w-profundo);
      color: rgba(255, 255, 255, 0.72);
      padding: clamp(3rem, 6vw, 4.5rem) 2rem 2rem;
    }
    .pie-grilla {
      max-width: 1120px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 2rem;
    }
    .pie-marca {
      font-family: var(--w-serif);
      font-size: 2rem;
      color: #fff;
      margin: 0;
      line-height: 1;
    }
    .pie-rubro {
      margin: 0.35rem 0 0;
      font-size: 0.63rem;
      letter-spacing: 0.26em;
      text-transform: uppercase;
      opacity: 0.6;
    }
    .pie dl {
      margin: 0;
    }
    .pie dt {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--w-arena);
      margin-bottom: 0.6rem;
    }
    .pie dd {
      margin: 0 0 0.25rem;
      font-size: 0.87rem;
    }
    .pie-nota {
      max-width: 1120px;
      margin: 3rem auto 0;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      font-size: 0.76rem;
      opacity: 0.55;
      line-height: 1.7;
    }

    /* --- Capa del reservador -------------------------------------------- */
    .capa {
      position: fixed;
      inset: 0;
      z-index: 90;
      visibility: hidden;
      pointer-events: none;
    }
    .capa.abierta {
      visibility: visible;
      pointer-events: auto;
    }
    .telon {
      position: absolute;
      inset: 0;
      background: rgba(26, 36, 30, 0.5);
      backdrop-filter: blur(3px);
      opacity: 0;
      transition: opacity 0.35s ease;
    }
    .capa.abierta .telon {
      opacity: 1;
    }

    /* Hoja anclada abajo: sube al abrirse y deja ver el sitio por arriba, que
       es lo que cuenta la idea de "esto está embebido en esa página". */
    .hoja {
      position: absolute;
      left: 50%;
      bottom: 0;
      width: min(1240px, 96vw);
      height: min(940px, 96dvh);
      transform: translate(-50%, 100%);
      transition: transform 0.42s cubic-bezier(0.22, 0.8, 0.28, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: 18px 18px 0 0;
      box-shadow: 0 -20px 60px -20px rgba(20, 30, 24, 0.5);
      background: var(--fondo);
      color: var(--secundario);
    }
    .capa.abierta .hoja {
      transform: translate(-50%, 0);
    }

    .hoja-barra {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 1.35rem;
      background: var(--w-blanco);
      border-bottom: 1px solid var(--w-borde);
    }
    .hoja-marca {
      display: flex;
      align-items: baseline;
      gap: 0.65rem;
      min-width: 0;
    }
    .hoja-nombre {
      font-family: var(--w-serif);
      font-size: 1.35rem;
      font-weight: 600;
      color: var(--w-profundo);
      line-height: 1;
    }
    .hoja-paso {
      font-size: 0.72rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--w-arena-oscuro);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .hoja-cerrar {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border: 1px solid var(--w-borde);
      border-radius: 50%;
      background: none;
      color: var(--w-tinta-suave);
      transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }
    .hoja-cerrar:hover {
      background: var(--w-profundo);
      border-color: var(--w-profundo);
      color: #fff;
    }
    .hoja-cuerpo {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    @media (max-width: 860px) {
      .enlaces {
        display: none;
      }
      .hoja {
        width: 100vw;
        height: 100dvh;
        border-radius: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hoja,
      .telon,
      .sitio {
        transition: none;
      }
    }
  `,
})
export class Webp implements OnDestroy {
  private readonly navegacion = inject(NavegacionReserva);
  protected readonly reserva = inject(ReservaEmbebida);
  protected readonly cuentas = inject(Cuentas);

  protected readonly marca = MARCA;
  protected readonly foto = FOTO;
  protected readonly compacta = signal(false);

  /** El modal está abierto cuando la URL apunta a un paso del flujo. */
  protected readonly abierta = computed(() =>
    this.navegacion.url().split(/[?#]/)[0].startsWith(`${BASE_WEBP}/`),
  );

  protected readonly tituloModal = `Reservá tu turno en ${MARCA.nombre}`;

  constructor() {
    // Mientras la landing esté montada, el flujo de reserva se pinta con la
    // marca del sitio anfitrión (ver `body.marca-anfitriona` en styles.css).
    document.body.classList.add('marca-anfitriona');
    // Con el reservador arriba, el scroll de la landing no se mueve.
    effect(() => {
      document.body.style.overflow = this.abierta() ? 'hidden' : '';
    });
  }

  ngOnDestroy(): void {
    // Salir de la landing con el modal abierto no puede dejar el body trabado.
    document.body.style.overflow = '';
    document.body.classList.remove('marca-anfitriona');
  }

  protected alScrollear(): void {
    this.compacta.set(window.scrollY > 40);
  }

  protected irA(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected alInicio(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected cerrarConEscape(): void {
    if (this.abierta()) {
      this.reserva.cerrar();
    }
  }
}
