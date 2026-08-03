import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BASE_WEBP, NavegacionReserva } from '../servicios/navegacion-reserva';
import { CONSULTORIO } from '../datos/catalogo';
import { Cuentas } from '../servicios/cuentas';
import { inicialesDe } from '../datos/profesionales';
import { CarruselTurnos } from './carrusel-turnos';

@Component({
  selector: 'app-encabezado',
  imports: [CarruselTurnos],
  host: {
    // Un clic en cualquier otro lado cierra el menú de la cuenta.
    '(document:click)': 'menu.set(false)',
    '(document:keydown.escape)': 'menu.set(false)',
  },
  template: `
    <header class="cabecera">
      <div class="marca">
        <button type="button" class="nombre" (click)="irAlInicio()">
          Tania Iznardo <span class="rubro"></span>
        </button>
        <span class="direccion">
          <svg viewBox="0 0 20 20" width="13" height="13" fill="none" aria-hidden="true">
            <path
              d="M10 18s6-5.686 6-10A6 6 0 1 0 4 8c0 4.314 6 10 6 10Z"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <circle cx="10" cy="8" r="2.1" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <span class="direccion-texto">
            {{ consultorio.direccion }} · {{ consultorio.ciudad }}
          </span>
        </span>
      </div>

      <!-- Globo de usuario -->
      <div class="cuenta" (click)="$event.stopPropagation()">
        <button
          type="button"
          class="globo"
          [class.con-sesion]="cuentas.haySesion()"
          (click)="menu.set(!menu())"
          [attr.aria-expanded]="menu()"
          aria-haspopup="menu"
          aria-label="Tu cuenta"
        >
          @if (cuentas.sesion(); as usuario) {
            <span class="iniciales">{{ iniciales(usuario.nombre + ' ' + usuario.apellido) }}</span>
          } @else {
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
              <circle cx="12" cy="9" r="3.6" stroke="currentColor" stroke-width="1.7" />
              <path
                d="M4.8 19.5c.9-3.4 3.7-5.2 7.2-5.2s6.3 1.8 7.2 5.2"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          }
        </button>

        @if (menu()) {
          <div class="menu" role="menu">
            @if (cuentas.sesion(); as usuario) {
              <div class="menu-cabecera">
                <strong>{{ usuario.nombre }} {{ usuario.apellido }}</strong>
                <span>{{ usuario.email }}</span>
              </div>
              <!-- Vistazo a lo que viene, sin tener que entrar a Mis turnos -->
              <app-carrusel-turnos />
              <button type="button" class="menu-item" role="menuitem" (click)="irAMisTurnos()">
                Mis turnos
              </button>
              <!-- Vista previa de cómo se ve el reservador embebido en el sitio
                   de un negocio. No se enlaza en ningún otro lado. -->
              <button type="button" class="menu-item demo" role="menuitem" (click)="irALanding()">
                Ver web de muestra
                <span class="insignia">demo</span>
              </button>
              <button type="button" class="menu-item salir" role="menuitem" (click)="salir()">
                Cerrar sesión
              </button>
            } @else {
              <div class="menu-cabecera">
                <strong>Tu cuenta</strong>
                <span>Entrá para ver y gestionar tus turnos</span>
              </div>
              <button type="button" class="menu-item" role="menuitem" (click)="abrir('login')">
                Iniciar sesión
              </button>
              <button type="button" class="menu-item" role="menuitem" (click)="abrir('registro')">
                Crear cuenta
              </button>
              <button type="button" class="menu-item" role="menuitem" (click)="irAMisTurnos()">
                Mis turnos
              </button>
            }
          </div>
        }
      </div>
    </header>
  `,
  styles: `
    .cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: var(--blanco);
      border-bottom: 1px solid var(--borde);
      padding: 0.85rem 1.5rem;
    }
    .marca {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }
    .nombre {
      background: none;
      border: none;
      padding: 0;
      text-align: left;
      font-weight: 800;
      font-size: 1.05rem;
      color: var(--secundario);
      white-space: nowrap;
    }
    .nombre:hover .rubro {
      color: var(--secundario);
    }
    .rubro {
      color: var(--primario);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-left: 0.15rem;
      transition: color 0.15s ease;
    }
    .direccion {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--neutro);
      font-size: 0.8rem;
      min-width: 0;
    }
    .direccion svg {
      flex-shrink: 0;
    }
    .direccion-texto {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Globo de usuario + menú de la cuenta */
    .cuenta {
      position: relative;
      flex-shrink: 0;
    }
    .globo {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 1.5px solid var(--borde);
      background: var(--blanco);
      color: var(--secundario);
      display: grid;
      place-items: center;
      transition:
        border-color 0.15s ease,
        color 0.15s ease,
        background 0.15s ease;
    }
    .globo:hover,
    .globo[aria-expanded='true'] {
      border-color: var(--primario);
      background: var(--primario-suave);
      color: var(--primario);
    }
    /* Con sesión iniciada el globo muestra las iniciales, en color de marca. */
    .globo.con-sesion {
      background: var(--primario);
      border-color: var(--primario);
      color: var(--blanco);
    }
    .globo.con-sesion:hover {
      background: var(--secundario);
      border-color: var(--secundario);
      color: var(--blanco);
    }
    .iniciales {
      font-size: 0.85rem;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .menu {
      position: absolute;
      right: 0;
      top: calc(100% + 0.6rem);
      z-index: 60;
      /* Ancho suficiente para el carrusel, sin desbordar en pantallas chicas */
      width: min(310px, calc(100vw - 2rem));
      background: var(--blanco);
      border: 1px solid var(--borde);
      border-radius: var(--radio);
      box-shadow: 0 14px 34px rgba(22, 48, 47, 0.18);
      padding: 0.4rem;
      animation: bajar 0.16s ease;
    }
    @keyframes bajar {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    .menu-cabecera {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0.6rem 0.75rem 0.7rem;
      border-bottom: 1px solid var(--borde);
      margin-bottom: 0.35rem;
      min-width: 0;
    }
    .menu-cabecera strong {
      font-size: 0.9rem;
    }
    .menu-cabecera span {
      font-size: 0.75rem;
      color: var(--neutro);
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .menu-item {
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      border-radius: var(--radio-chico);
      padding: 0.6rem 0.75rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--secundario);
    }
    .menu-item:hover {
      background: var(--primario-suave);
      color: var(--primario);
    }
    .salir:hover {
      background: rgba(179, 57, 47, 0.1);
      color: #b3392f;
    }
    .demo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .insignia {
      flex-shrink: 0;
      padding: 0.1rem 0.42rem;
      border-radius: 999px;
      background: var(--terciario-suave);
      color: var(--terciario-oscuro);
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    @media (max-width: 720px) {
      .cabecera {
        padding: 0.75rem 1rem;
      }
      .nombre {
        font-size: 0.98rem;
        overflow: hidden;
        text-overflow: ellipsis;
        min-height: 32px;
        display: flex;
        align-items: center;
      }
      .direccion {
        font-size: 0.72rem;
      }
      .globo {
        width: 38px;
        height: 38px;
      }
    }
  `,
})
export class Encabezado {
  protected readonly cuentas = inject(Cuentas);
  private readonly navegacion = inject(NavegacionReserva);
  private readonly router = inject(Router);

  protected readonly consultorio = CONSULTORIO;
  protected readonly iniciales = inicialesDe;
  protected readonly menu = signal(false);

  protected abrir(modo: 'login' | 'registro'): void {
    this.menu.set(false);
    this.cuentas.abrir(modo);
  }

  protected irAMisTurnos(): void {
    this.menu.set(false);
    this.navegacion.ir('mis-turnos');
  }

  protected irAlInicio(): void {
    this.navegacion.ir('servicio');
  }

  protected irALanding(): void {
    this.menu.set(false);
    this.router.navigateByUrl(BASE_WEBP);
  }

  protected salir(): void {
    this.menu.set(false);
    this.cuentas.cerrarSesion();
    this.navegacion.ir('servicio');
  }
}
