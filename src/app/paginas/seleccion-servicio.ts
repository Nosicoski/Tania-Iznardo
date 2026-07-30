import { ApplicationRef, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PerfilNegocio } from '../componentes/perfil-negocio';
import { ReservaStore } from '../servicios/reserva-store';
import { GRUPOS, SERVICIOS } from '../datos/catalogo';
import { PROFESIONALES, inicialesDe, ofrece } from '../datos/profesionales';
import { precioARS } from '../datos/formato';
import { Profesional, Servicio } from '../modelos';

const MAX_IMAGENES = 3;

@Component({
  selector: 'app-seleccion-servicio',
  imports: [PerfilNegocio],
  template: `
    <div class="cabecera-panel">
      <app-perfil-negocio />
    </div>
    <div class="contenedor">
      <div class="disposicion">
        <aside class="lateral">
          <h1>Elegí tu servicio</h1>
          <nav class="categorias" aria-label="Categorías">
            @for (g of grupos(); track g.nombre) {
              <button
                type="button"
                class="categoria"
                [class.activa]="abierto() === g.nombre"
                (click)="irAlGrupo(g.nombre)"
              >
                <span class="categoria-nombre">{{ g.nombre }}</span>
                <span class="categoria-tagline">{{ g.tagline }}</span>
              </button>
            }
          </nav>
        </aside>

        <div class="principal">
          <!-- Filtro por profesional: acota el catálogo a lo que ofrece cada uno -->
          <div class="filtro-profes" role="group" aria-label="Filtrar por profesional">
            @for (p of profesionales; track p.id) {
              <div class="globo-caja">
                <button
                  type="button"
                  class="globo-profe"
                  [attr.aria-pressed]="filtro()?.id === p.id"
                  [class.activo]="filtro()?.id === p.id"
                  (click)="filtrarPor(p)"
                >
                  <span class="avatar">
                    @if (conFoto(p)) {
                      <img [src]="p.foto" [alt]="p.nombre" (error)="fotoRota(p.id)" />
                    } @else {
                      <span class="iniciales">{{ iniciales(p.nombre) }}</span>
                    }
                  </span>
                  <span class="globo-nombre">{{ p.nombre }}</span>
                  <span class="globo-profesion">{{ p.profesion }}</span>
                </button>
                @if (filtro()?.id === p.id) {
                  <button
                    type="button"
                    class="quitar-filtro"
                    (click)="filtrarPor(null)"
                    [attr.aria-label]="'Dejar de filtrar por ' + p.nombre"
                  >
                    ×
                  </button>
                }
              </div>
            }
          </div>

          <section class="grupos">
          @for (g of grupos(); track g.nombre) {
            <div class="grupo" [id]="ancla(g.nombre)">
              <button
                type="button"
                class="grupo-cabecera"
                (click)="alternarGrupo(g.nombre)"
                [attr.aria-expanded]="abierto() === g.nombre"
              >
                <span class="grupo-titulo">
                  <b>{{ g.nombre }}</b>
                  <i>· {{ g.tagline }}</i>
                </span>
                <span class="grupo-signo">{{ abierto() === g.nombre ? '−' : '+' }}</span>
              </button>

              @if (abierto() === g.nombre) {
                <div class="grupo-cuerpo">
                  @for (s of g.servicios; track s.id) {
                    <article class="servicio">
                      <header class="servicio-cabecera">
                        <h3>{{ s.nombre }}</h3>
                        @if (s.badge) {
                          <span class="badge">{{ s.badge }}</span>
                        }
                      </header>
                      <div class="meta">
                        <span>{{ s.duracionMin }} min</span>
                        <b class="precio">{{ precio(s.precio) }}</b>
                      </div>
                      @if (s.imagenes?.length) {
                        <div class="fotos">
                          @for (img of s.imagenes!.slice(0, maxImagenes); track img) {
                            <div class="foto-ph" aria-hidden="true"></div>
                          }
                        </div>
                      }
                      <p class="descripcion">{{ s.descripcion }}</p>
                      @if (expandido() === s.id) {
                        <p class="detalle">{{ s.detalle }}</p>
                      }
                      <footer class="servicio-pie">
                        <button type="button" class="mas-info" (click)="alternarDetalle(s.id)">
                          {{ expandido() === s.id ? 'Menos información' : 'Más información' }}
                        </button>
                        <button
                          type="button"
                          class="btn btn-primario"
                          (click)="agendar(s)"
                        >
                          Agendar servicio
                        </button>
                      </footer>
                    </article>
                  }
                </div>
              }
            </div>
          }
          </section>
        </div>
      </div>
    </div>

    <!-- Solo se puede agendar un turno por vez: avisamos antes de pisar el actual -->
    @if (aReemplazar(); as nuevo) {
      <div class="fondo-modal" (click)="cancelarCambio()">
        <div
          class="modal tarjeta"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          (click)="$event.stopPropagation()"
        >
          <h2 id="modal-titulo">¿Cambiar de servicio?</h2>
          <p class="modal-texto">
            Ya tenés en curso la reserva de <b>{{ store.servicio()?.nombre }}</b
            >. Si elegís <b>{{ nuevo.nombre }}</b> vas a perder el horario y el
            profesional que habías seleccionado.
          </p>
          <div class="modal-acciones">
            <button type="button" class="btn btn-borde" (click)="cancelarCambio()">
              Seguir con el actual
            </button>
            <button type="button" class="btn btn-primario" (click)="confirmarCambio()">
              Cambiar de servicio
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .cabecera-panel {
      background: var(--blanco);
      border-bottom: 1px solid var(--borde);
    }

    /* Columna central: el filtro arranca y termina donde las tarjetas */
    .principal {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Filtro por profesional (globos verticales) */
    .filtro-profes {
      display: flex;
      align-items: flex-start;
      gap: 1.1rem;
      overflow-x: auto;
      /* Aire arriba y abajo: si no, el scroll recorta el anillo del activo. */
      padding: 0.5rem 0;
    }
    .globo-caja {
      position: relative;
      flex-shrink: 0;
    }
    /* Cruz para soltar el filtro sin tener que volver a apuntarle al globo */
    .quitar-filtro {
      position: absolute;
      top: -2px;
      right: 8px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1.5px solid var(--primario);
      background: var(--blanco);
      color: var(--primario);
      font-size: 0.85rem;
      font-weight: 700;
      line-height: 1;
      display: grid;
      place-items: center;
      padding: 0;
    }
    .quitar-filtro:hover {
      background: var(--primario);
      color: var(--blanco);
    }
    .globo-profe {
      width: 88px;
      background: none;
      border: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--primario-suave);
      color: var(--primario);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: box-shadow 0.15s ease;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .iniciales {
      font-weight: 800;
      font-size: 0.9rem;
      letter-spacing: 0.02em;
    }
    .globo-profe:hover .avatar {
      box-shadow: 0 0 0 3px var(--blanco), 0 0 0 5px var(--borde);
    }
    /* Anillo doble = profesional por el que se está filtrando */
    .globo-profe.activo .avatar {
      box-shadow: 0 0 0 3px var(--blanco), 0 0 0 5px var(--primario);
    }
    .globo-nombre {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--secundario);
      text-align: center;
      line-height: 1.25;
      /* Dos líneas fijas: así las píldoras de abajo quedan a la misma altura. */
      min-height: 2.5em;
    }
    .globo-profesion {
      background: var(--primario-suave);
      color: var(--primario);
      border-radius: 999px;
      padding: 0.12rem 0.55rem;
      font-size: 0.62rem;
      font-weight: 700;
      line-height: 1.3;
      text-align: center;
      max-width: 100%;
    }

    .disposicion {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
      align-items: start;
      margin-top: 1.25rem;
    }

    /* Lateral: título + navegador de categorías (no filtra, solo lleva al grupo) */
    .lateral h1 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    .categorias {
      display: flex;
      flex-direction: column;
    }
    .categoria {
      text-align: left;
      background: none;
      border: none;
      border-bottom: 1px solid var(--borde);
      padding: 0.8rem 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .categoria-nombre {
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--secundario);
    }
    .categoria-tagline {
      font-size: 0.78rem;
      font-style: italic;
      color: var(--neutro);
    }
    .categoria:hover .categoria-nombre {
      color: var(--primario);
    }
    .categoria.activa .categoria-nombre {
      color: var(--primario);
    }

    /* Grupos colapsables: solo uno abierto a la vez, todos cerrados al entrar */
    .grupos {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .grupo {
      scroll-margin-top: 1rem;
    }
    .grupo-cabecera {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0.85rem 1.25rem;
      text-align: left;
    }
    .grupo-cabecera:hover {
      border-color: var(--primario);
    }
    .grupo-titulo b {
      font-size: 0.95rem;
    }
    .grupo-titulo i {
      color: var(--neutro);
      font-size: 0.85rem;
      margin-left: 0.25rem;
    }
    .grupo-signo {
      color: var(--primario);
      font-size: 1.35rem;
      font-weight: 700;
      line-height: 1;
      flex-shrink: 0;
    }
    .grupo-cuerpo {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      align-items: start;
      padding: 1.25rem 0.25rem;
    }

    /* Tarjeta de servicio */
    .servicio {
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio);
      box-shadow: var(--sombra);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .servicio-cabecera {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.6rem;
    }
    .servicio h3 {
      font-size: 1rem;
      line-height: 1.3;
    }
    .badge {
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 999px;
      padding: 0.2rem 0.6rem;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: var(--neutro);
    }
    .precio {
      color: var(--primario);
      font-size: 1rem;
    }
    .fotos {
      display: flex;
      gap: 0.5rem;
    }
    .foto-ph {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      border: 1.5px dashed var(--neutro-claro);
      background: var(--fondo);
      flex-shrink: 0;
    }
    .descripcion {
      margin: 0;
      color: var(--neutro);
      font-size: 0.85rem;
    }
    .detalle {
      margin: 0;
      background: var(--primario-suave);
      border-radius: var(--radio-chico);
      padding: 0.65rem 0.8rem;
      color: var(--secundario);
      font-size: 0.82rem;
    }
    .servicio-pie {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: auto;
    }
    .mas-info {
      background: none;
      border: none;
      padding: 0;
      color: var(--primario);
      font-weight: 700;
      font-size: 0.85rem;
    }

    /* Aviso de reemplazo de la reserva en curso */
    .fondo-modal {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(22, 48, 47, 0.45);
      display: grid;
      place-items: center;
      padding: 1.25rem;
      animation: aparecer 0.18s ease;
    }
    @keyframes aparecer {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .modal {
      width: min(440px, 100%);
      padding: 1.5rem;
    }
    .modal h2 {
      font-size: 1.1rem;
    }
    .modal-texto {
      margin: 0.75rem 0 1.5rem;
      color: var(--neutro);
      font-size: 0.9rem;
    }
    .modal-texto b {
      color: var(--secundario);
    }
    .modal-acciones {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    @media (max-width: 900px) {
      .grupo-cuerpo {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 720px) {
      .disposicion {
        display: block;
      }
      .lateral {
        margin-bottom: 1rem;
      }
      .categorias {
        flex-direction: row;
        overflow-x: auto;
        gap: 0.5rem;
        padding-bottom: 0.5rem;
      }
      .categoria {
        flex-shrink: 0;
        border: 1px solid var(--borde);
        background: var(--blanco);
        border-radius: 999px;
        padding: 0.45rem 1rem;
      }
      .categoria-tagline {
        display: none;
      }
      .categoria.activa {
        border-color: var(--primario);
      }
      .modal-acciones .btn {
        width: 100%;
      }
    }
  `,
})
export class SeleccionServicio {
  protected readonly store = inject(ReservaStore);
  private readonly router = inject(Router);
  private readonly app = inject(ApplicationRef);

  protected readonly profesionales = PROFESIONALES;
  protected readonly maxImagenes = MAX_IMAGENES;
  protected readonly precio = precioARS;
  protected readonly iniciales = inicialesDe;

  protected readonly expandido = signal<string | null>(null);
  /** Acordeón: un solo grupo abierto y ninguno al entrar. */
  protected readonly abierto = signal<string | null>(null);
  /** Servicio que espera confirmación porque pisaría la reserva en curso. */
  protected readonly aReemplazar = signal<Servicio | null>(null);
  /**
   * Profesional por el que se filtra el catálogo; null = todo el equipo. Al
   * volver desde el paso de agenda arranca en el que ya venía elegido.
   */
  protected readonly filtro = signal<Profesional | null>(this.store.profesional());
  /** Fotos que no cargaron: caen al avatar con iniciales. */
  private readonly sinFoto = signal<string[]>([]);

  /** Grupos con al menos un servicio visible; alimenta el listado y el lateral. */
  protected readonly grupos = computed(() => {
    const profesional = this.filtro();
    return GRUPOS.map((g) => ({
      ...g,
      servicios: SERVICIOS.filter(
        (s) =>
          s.categoria === g.nombre && (!profesional || ofrece(profesional, s.id))
      ),
    })).filter((g) => g.servicios.length > 0);
  });

  protected conFoto(profesional: Profesional): boolean {
    return !!profesional.foto && !this.sinFoto().includes(profesional.id);
  }

  protected fotoRota(id: string): void {
    this.sinFoto.update((lista) => (lista.includes(id) ? lista : [...lista, id]));
  }

  /**
   * Cambiar de profesional puede hacer desaparecer el grupo abierto. Tocar al
   * que ya estaba elegido suelta el filtro (lo mismo que la cruz).
   */
  protected filtrarPor(profesional: Profesional | null): void {
    const elegido = this.filtro()?.id === profesional?.id ? null : profesional;
    this.filtro.set(elegido);
    this.abierto.set(null);
    this.expandido.set(null);
  }

  protected ancla(nombre: string): string {
    return 'grupo-' + nombre.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-');
  }

  protected alternarGrupo(nombre: string): void {
    this.abierto.update((actual) => (actual === nombre ? null : nombre));
  }

  /** El navegador lateral no filtra: abre ese grupo y lleva al usuario hasta él. */
  protected irAlGrupo(nombre: string): void {
    if (this.abierto() === nombre) {
      this.desplazarA(nombre);
      return;
    }
    this.abierto.set(nombre);
    // El grupo anterior se cierra y el de destino se mueve, así que primero
    // aplicamos el cambio al DOM y recién después medimos hacia dónde ir.
    this.app.tick();
    this.desplazarA(nombre);
  }

  private desplazarA(nombre: string): void {
    document
      .getElementById(this.ancla(nombre))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected alternarDetalle(id: string): void {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  protected agendar(servicio: Servicio): void {
    const actual = this.store.servicio();
    // Solo molestamos si hay algo real que perder: otro servicio ya agendado.
    if (actual && actual.id !== servicio.id && this.store.hayHorario()) {
      this.aReemplazar.set(servicio);
      return;
    }
    this.reservar(servicio);
  }

  protected confirmarCambio(): void {
    const servicio = this.aReemplazar();
    this.aReemplazar.set(null);
    if (servicio) {
      this.reservar(servicio);
    }
  }

  protected cancelarCambio(): void {
    this.aReemplazar.set(null);
  }

  private reservar(servicio: Servicio): void {
    if (this.store.servicio()?.id !== servicio.id) {
      this.store.elegirServicio(servicio);
    }
    // El profesional por el que filtró llega ya elegido al paso de agenda.
    const profesional = this.filtro();
    if (profesional && this.store.profesional()?.id !== profesional.id) {
      this.store.elegirProfesional(profesional);
    }
    this.router.navigate(['/agendar']);
  }
}
