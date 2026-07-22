import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Stepper } from '../componentes/stepper';
import { ResumenReserva } from '../componentes/resumen-reserva';
import { ReservaStore } from '../servicios/reserva-store';

@Component({
  selector: 'app-datos-contacto',
  imports: [ReactiveFormsModule, Stepper, ResumenReserva],
  template: `
    <app-stepper [paso]="3" />
    <div class="contenedor">
      <h1>Completá tus datos</h1>

      <div class="disposicion">
        <form class="tarjeta formulario" [formGroup]="formulario" (ngSubmit)="confirmar()">
          <div class="campos">
            <label class="campo">
              <span class="etiqueta">Nombre <i>*</i></span>
              <input type="text" formControlName="nombre" placeholder="Ej: María" />
              @if (invalido('nombre')) {
                <span class="error">Ingresá tu nombre.</span>
              }
            </label>

            <label class="campo">
              <span class="etiqueta">Apellido <i>*</i></span>
              <input type="text" formControlName="apellido" placeholder="Ej: García" />
              @if (invalido('apellido')) {
                <span class="error">Ingresá tu apellido.</span>
              }
            </label>

            <label class="campo">
              <span class="etiqueta">Email <i>*</i></span>
              <input type="email" formControlName="email" placeholder="juan@mail.com" />
              @if (invalido('email')) {
                <span class="error">Ingresá un email válido.</span>
              }
            </label>

            <label class="campo">
              <span class="etiqueta">Teléfono <i>*</i></span>
              <span class="telefono">
                <span class="prefijo">+54</span>
                <input
                  type="tel"
                  formControlName="telefono"
                  placeholder="3511234567"
                  inputmode="numeric"
                />
              </span>
              <span class="ayuda">
                Ingresá tu número con código de área, sin el 0 y sin el 15.
              </span>
              @if (invalido('telefono')) {
                <span class="error">Ingresá un teléfono válido (solo números).</span>
              }
            </label>

            <label class="campo">
              <span class="etiqueta">DNI <span class="opcional">(opcional)</span></span>
              <input type="text" formControlName="dni" placeholder="DNI" inputmode="numeric" />
            </label>

            <label class="campo campo-ancho">
              <span class="etiqueta">Observaciones</span>
              <textarea
                formControlName="observaciones"
                rows="4"
                placeholder="Escribí información relevante para tu turno"
              ></textarea>
            </label>
          </div>

          <p class="legal">
            Te notificaremos sobre tu turno al correo y/o teléfono que indiques.
          </p>
        </form>

        <app-resumen-reserva
          [notaPago]="true"
          cta="Confirmar turno"
          [ctaDeshabilitada]="formulario.invalid"
          (ctaClick)="confirmar()"
        />
      </div>

      <div class="acciones">
        <button type="button" class="btn btn-borde" (click)="volver()">Anterior</button>
        <button
          type="button"
          class="btn btn-primario confirmar-desktop"
          [disabled]="formulario.invalid"
          (click)="confirmar()"
        >
          Confirmar turno
        </button>
      </div>
    </div>
  `,
  styles: `
    .disposicion {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
      align-items: start;
      margin-top: 1.25rem;
    }
    .formulario {
      padding: 1.5rem;
    }
    .campos {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.1rem 1.5rem;
    }
    .campo {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .campo-ancho {
      grid-column: 1 / -1;
    }
    .etiqueta {
      font-weight: 700;
      font-size: 0.85rem;
    }
    .etiqueta i {
      color: var(--primario);
      font-style: normal;
    }
    .opcional {
      color: var(--neutro);
      font-weight: 500;
    }
    input,
    textarea {
      border: 1.5px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0.6rem 0.85rem;
      font-size: 0.9rem;
      color: var(--secundario);
      background: var(--blanco);
      width: 100%;
      resize: vertical;
    }
    input::placeholder,
    textarea::placeholder {
      color: var(--neutro-claro);
    }
    input:focus,
    textarea:focus {
      outline: none;
      border-color: var(--primario);
    }
    .telefono {
      display: flex;
      gap: 0.5rem;
    }
    .prefijo {
      border: 1.5px solid var(--borde);
      border-radius: var(--radio-chico);
      padding: 0.6rem 0.75rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--neutro);
      background: var(--fondo);
      flex-shrink: 0;
    }
    .ayuda {
      color: var(--neutro);
      font-size: 0.75rem;
    }
    .error {
      color: #b3392f;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .legal {
      margin: 1.25rem 0 0;
      color: var(--neutro);
      font-size: 0.8rem;
    }
    .acciones {
      display: flex;
      justify-content: space-between;
      margin-top: 1.5rem;
    }
    @media (max-width: 720px) {
      .disposicion {
        display: block;
      }
      .campos {
        grid-template-columns: 1fr;
      }
      /* En mobile el botón de confirmar vive en la barra "Tu reserva" */
      .confirmar-desktop {
        display: none;
      }
    }
  `,
})
export class DatosContacto {
  private readonly router = inject(Router);
  private readonly store = inject(ReservaStore);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly formulario = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{8,12}$/)]],
    dni: [''],
    observaciones: [''],
  });

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && control.touched;
  }

  protected confirmar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.store.confirmar(this.formulario.getRawValue());
    this.router.navigate(['/confirmado']);
  }

  protected volver(): void {
    this.router.navigate(['/fecha-hora']);
  }
}
