import { Component, computed, signal } from '@angular/core';
import { CONSULTORIO } from '../datos/catalogo';
import { PROFESIONALES } from '../datos/profesionales';
import { FichaProfesional } from './ficha-profesional';

/** Cuántos profesionales se ven antes de "Ver N más". */
const TOPE = 4;

/**
 * Cabecera de perfil del negocio (estilo AgendaPro), visible en el paso 1.
 * Izquierda: imagen del consultorio + nombre + descripción (sin redes).
 * Derecha: mapa de Google embebido + datos de contacto + profesional.
 * Incluye el botón flotante de WhatsApp (solo diseño por ahora).
 */
@Component({
  selector: 'app-perfil-negocio',
  imports: [FichaProfesional],
  template: `
    <section class="perfil">
      <div class="perfil-grid">
        <!-- Izquierda: imagen + identidad -->
        <div class="perfil-principal">
          <div class="perfil-hero">
            @if (heroVisible()) {
              <img
                [src]="heroImg"
                alt="Consultorio Tania Iznardo"
                (error)="heroVisible.set(false)"
              />
            } @else {
              <span class="perfil-hero-ph">Imagen del consultorio</span>
            }
          </div>

          <div class="perfil-identidad">
            <div class="perfil-logo">TI</div>
            <div class="perfil-nombre">Tania Iznardo Osteopatía</div>
          </div>
          <p class="perfil-desc">
            Osteopatía, terapia postural activa y nutrición en el corazón de
            Córdoba. Un espacio pensado para acompañarte en tu recuperación y
            tu bienestar, con atención profesional y personalizada.
          </p>
        </div>

        <!-- Derecha: mapa + datos + profesional -->
        <aside class="perfil-panel">
          <div class="perfil-mapa">
            <iframe
              title="Ubicación del consultorio en Google Maps"
              src="https://maps.google.com/maps?q=Av.%20V%C3%A9lez%20Sarsfield%20761,%20C%C3%B3rdoba,%20Argentina&z=16&output=embed"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <ul class="perfil-datos">
            <li>
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
                <path
                  d="M10 18s6-5.686 6-10A6 6 0 1 0 4 8c0 4.314 6 10 6 10Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <circle cx="10" cy="8" r="2.1" stroke="currentColor" stroke-width="1.5" />
              </svg>
              <span>{{ consultorio.direccion }}, {{ consultorio.ciudad }}</span>
            </li>
            <li>
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
                <path
                  d="M4.5 4.2c-.3.3-.5.7-.5 1.1 0 5.6 4.6 10.2 10.2 10.2.4 0 .8-.2 1.1-.5l1.4-1.4c.4-.4.3-1-.1-1.3l-2.3-1.5c-.3-.2-.7-.2-1 .1l-.9.9a8.9 8.9 0 0 1-3.7-3.7l.9-.9c.3-.3.3-.7.1-1L8.7 3.9c-.3-.4-.9-.5-1.3-.1L6 5.2"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Teléfono a completar</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path
                  d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14 0-.31-.02-.47-.02s-.43.06-.66.31c-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"
                />
              </svg>
              <button type="button" class="perfil-link">Contactanos por WhatsApp</button>
            </li>
            <li>
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5" />
                <path
                  d="M10 6v4l2.5 1.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <button type="button" class="perfil-link" (click)="verHorario.set(!verHorario())">
                {{ verHorario() ? consultorio.horario : 'Ver horario' }}
              </button>
            </li>
          </ul>

          <div class="perfil-sep"></div>

          <div class="perfil-prof-titulo">Profesionales</div>
          <div class="perfil-equipo">
            @for (p of visibles(); track p.id) {
              <app-ficha-profesional [prof]="p" />
            }
          </div>
          @if (profesionales.length > tope) {
            <button type="button" class="perfil-link ver-mas" (click)="verTodos.set(!verTodos())">
              {{ verTodos() ? 'Ver menos' : 'Ver ' + (profesionales.length - tope) + ' más' }}
            </button>
          }
        </aside>
      </div>
    </section>

    <!-- Botón flotante de WhatsApp (solo diseño, sin link) -->
    <button type="button" class="wa-flotante" aria-label="Contactar por WhatsApp">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
        <path
          d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.52 11.97c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14 0-.31-.02-.47-.02s-.43.06-.66.31c-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"
        />
      </svg>
    </button>
  `,
  styles: `
    .perfil {
      background: var(--blanco);
    }
    .perfil-grid {
      max-width: 1160px;
      margin: 0 auto;
      padding: 1.75rem 1.5rem;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 2rem;
      align-items: start;
    }

    /* Izquierda: imagen + identidad */
    .perfil-hero {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 10;
      border-radius: var(--radio);
      overflow: hidden;
      background: linear-gradient(135deg, var(--primario-suave), var(--terciario-suave));
      display: grid;
      place-items: center;
    }
    .perfil-hero img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .perfil-hero-ph {
      color: var(--neutro);
      font-size: 0.9rem;
      font-weight: 600;
    }
    .perfil-identidad {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .perfil-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--secundario);
      color: var(--blanco);
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .perfil-nombre {
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--secundario);
    }
    .perfil-desc {
      margin: 0.85rem 0 0;
      color: var(--neutro);
      font-size: 0.9rem;
      max-width: 48ch;
    }

    /* Derecha: mapa + datos + profesional */
    .perfil-panel {
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio);
      box-shadow: var(--sombra);
      padding: 1.1rem;
    }
    .perfil-mapa {
      position: relative;
      border-radius: var(--radio-chico);
      overflow: hidden;
      border: 1px solid var(--borde);
      /* Fondo de respaldo por si el iframe de Google no carga. */
      background: var(--primario-suave);
    }
    .perfil-mapa iframe {
      width: 100%;
      height: 180px;
      border: 0;
      display: block;
    }
    .perfil-datos {
      list-style: none;
      margin: 1.1rem 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .perfil-datos li {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.85rem;
      color: var(--secundario);
    }
    .perfil-datos svg {
      color: var(--primario);
      flex-shrink: 0;
    }
    .perfil-link {
      background: none;
      border: none;
      padding: 0;
      color: var(--secundario);
      font-weight: 600;
      text-align: left;
    }
    .perfil-link:hover {
      color: var(--primario);
    }
    .perfil-sep {
      height: 1px;
      background: var(--borde);
      margin: 1.1rem 0;
    }
    .perfil-prof-titulo {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--neutro);
      margin-bottom: 0.75rem;
    }
    /* Grilla del equipo: avatar + nombre + globo con la profesión */
    .perfil-equipo {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem 0.5rem;
    }
    .ver-mas {
      margin-top: 0.9rem;
      font-size: 0.85rem;
      color: var(--primario);
      font-weight: 700;
    }

    /* Botón flotante de WhatsApp */
    .wa-flotante {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      z-index: 30;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: #25d366;
      color: #fff;
      display: grid;
      place-items: center;
      box-shadow: 0 6px 18px rgba(37, 211, 100, 0.4);
      transition: transform 0.15s ease;
    }
    .wa-flotante:hover {
      transform: scale(1.06);
    }

    @media (max-width: 900px) {
      .perfil-grid {
        grid-template-columns: 1fr;
        gap: 1.25rem;
        padding: 1.25rem 1rem;
      }
    }
    @media (max-width: 720px) {
      .wa-flotante {
        right: 1rem;
        bottom: 1rem;
        width: 52px;
        height: 52px;
      }
    }
  `,
})
export class PerfilNegocio {
  protected readonly consultorio = CONSULTORIO;
  protected readonly profesionales = PROFESIONALES;
  protected readonly tope = TOPE;
  protected readonly heroImg = 'img/local/consultorio.png';
  protected readonly heroVisible = signal(true);
  protected readonly verHorario = signal(false);
  protected readonly verTodos = signal(false);

  protected readonly visibles = computed(() =>
    this.verTodos() ? this.profesionales : this.profesionales.slice(0, TOPE)
  );
}
