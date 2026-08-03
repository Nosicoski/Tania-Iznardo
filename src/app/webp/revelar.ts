import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';

/**
 * Aparición suave al entrar en pantalla. El elemento arranca desplazado y
 * transparente, y se acomoda cuando se lo alcanza con el scroll; una sola vez,
 * sin volver a esconderse al subir.
 *
 * Con `prefers-reduced-motion` no hace nada: el contenido se muestra de una.
 */
@Directive({
  selector: '[webpRevelar]',
  host: {
    class: 'webp-revelar',
  },
})
export class Revelar implements OnDestroy {
  /** Retraso en milisegundos, para escalonar los hijos de una grilla. */
  readonly demora = input(0, { alias: 'webpRevelar' });

  private readonly elemento = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private observador?: IntersectionObserver;

  constructor() {
    const quieto =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto || typeof IntersectionObserver === 'undefined') {
      this.mostrar();
      return;
    }
    // Después del primer render, no en el constructor: recién ahí el elemento
    // tiene posición y tamaño. Observarlo antes hace que la primera entrega
    // del observador lo mida en 0×0, lo declare fuera de pantalla y —si la
    // página abre justo sobre él y nadie scrollea— nunca se vuelva a revisar.
    afterNextRender(() => this.vigilar());
  }

  private vigilar(): void {
    this.observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            this.mostrar();
            this.observador?.disconnect();
          }
        }
      },
      // Se dispara un poco antes de llegar al borde: para cuando el bloque se
      // ve entero, la animación ya está terminando.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    );
    this.observador.observe(this.elemento);
  }

  private mostrar(): void {
    this.elemento.style.transitionDelay = `${this.demora()}ms`;
    this.elemento.classList.add('visible');
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
