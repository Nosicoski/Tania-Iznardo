import { Injectable, inject } from '@angular/core';
import { Intervalo, Profesional, Servicio, Tramo } from '../modelos';
import { aHora, aMinutos, conHora, inicioDelDia, sumarDias } from '../datos/formato';
import { PROFESIONALES, profesionalesPara } from '../datos/profesionales';
import { AgendaGuardada } from './agenda-guardada';

/**
 * Bloques de atención del consultorio (Lun a Vie · 9-13 y 15-20 hs, ver
 * CONSULTORIO.horario). Los horarios que se ofrecen se derivan de acá en vez
 * de estar escritos a mano: así una visita nunca se pasa del cierre ni cruza
 * el corte del mediodía.
 */
const FRANJAS = [
  { clave: 'manana' as const, desde: '9:00', hasta: '13:00' },
  { clave: 'tarde' as const, desde: '15:00', hasta: '20:00' },
];

/** Cada cuántos minutos se ofrece un inicio de visita. */
const PASO_MIN = 30;

/**
 * Colchón entre dos servicios de la misma visita cuando cambia el profesional
 * (cambio de sala, ficha, higiene). Con el mismo profesional es 0: sigue de
 * largo. Es parte del bloque, no es tiempo muerto de espera.
 */
export const TRANSICION_MIN = 10;

/** Días de la semana que atiende el consultorio (1 = lunes). */
const DIAS_HABILES = [1, 2, 3, 4, 5];

export interface Horarios {
  manana: string[];
  tarde: string[];
}

/**
 * Qué hay que resolver: los servicios de la visita en el orden pretendido, los
 * profesionales que el usuario fijó a mano y la identidad del paciente.
 */
export interface Consulta {
  servicios: Servicio[];
  /** servicioId → profesionalId fijado a mano. Lo ausente lo elige el sistema. */
  preferidos: Record<string, string>;
  /** true = respetar el orden tal cual; false = el sistema busca el que entre. */
  ordenFijo: boolean;
  /** Cuenta con sesión: sus turnos previos también bloquean, es el mismo cuerpo. */
  email?: string;
}

/**
 * Por qué un bloque ya elegido dejó de servir. Entre que el paciente toca la
 * hora y confirma pueden pasar minutos: en ese rato la franja pudo ocuparse o
 * simplemente pudo pasar la hora.
 */
export type PlanInvalido = 'vencido' | 'ocupado' | 'paciente-ocupado';

/** Por qué un día no ofrece horarios. Define el mensaje que ve el usuario. */
export type MotivoSinCupo =
  | 'sin-servicios'
  /** El profesional que pidió a mano no trabaja ese día. */
  | 'profesional-no-atiende'
  | 'sin-dia-comun'
  | 'no-entra'
  | 'dia-sin-equipo'
  | 'sin-hueco';

/** Ocupación ya resuelta para una consulta puntual, para no recalcularla. */
interface Contexto {
  /** profesionalId → sus rangos ocupados ese día (reservados + simulados). */
  ocupados: Map<string, Intervalo[]>;
  /** Turnos que ya tiene el propio paciente: no puede duplicarse. */
  paciente: Intervalo[];
  preferidos: Record<string, string>;
}

/**
 * Disponibilidad simulada para la demo. Cada profesional tiene sus días de
 * atención (`Profesional.dias`) y una agenda propia generada de forma
 * determinística según la fecha, así dos profesionales nunca muestran los
 * mismos huecos. A eso se le restan los turnos ya reservados en este navegador.
 *
 * Una visita puede tener más de un servicio: en ese caso los tramos van
 * **consecutivos** dentro de una misma franja, en el orden que entre, y cada
 * uno con el profesional que lo ofrezca y esté libre en ese rato.
 */
@Injectable({ providedIn: 'root' })
export class Disponibilidad {
  private readonly agenda = inject(AgendaGuardada);
  /** La agenda simulada solo depende del profesional y del día: se cachea. */
  private readonly simulados = new Map<string, Intervalo[]>();

  esLaborable(fecha: Date): boolean {
    return DIAS_HABILES.includes(fecha.getDay());
  }

  /** Día hábil que todavía no pasó. */
  esReservable(fecha: Date): boolean {
    return this.esLaborable(fecha) && inicioDelDia(fecha) >= inicioDelDia(new Date());
  }

  /** ¿Este profesional trabaja ese día? */
  atiende(profesional: Profesional, fecha: Date): boolean {
    return this.esReservable(fecha) && profesional.dias.includes(fecha.getDay());
  }

  /** Duración mínima de la visita: los servicios, sin contar transiciones. */
  duracionMinima(servicios: Servicio[]): number {
    return servicios.reduce((total, s) => total + s.duracionMin, 0);
  }

  /**
   * Horarios de inicio en los que la visita completa entra ese día. Cada uno
   * garantiza que existe al menos un reparto de profesionales válido.
   */
  horariosPara(consulta: Consulta, fecha: Date): Horarios {
    const horarios: Horarios = { manana: [], tarde: [] };
    if (!consulta.servicios.length || !this.esReservable(fecha)) {
      return horarios;
    }
    const contexto = this.contexto(consulta, fecha);
    const ordenes = this.ordenes(consulta);
    for (const franja of FRANJAS) {
      const cierre = aMinutos(franja.hasta);
      for (let minuto = aMinutos(franja.desde); minuto < cierre; minuto += PASO_MIN) {
        if (this.primerPlan(ordenes, contexto, fecha, cierre, minuto)) {
          horarios[franja.clave].push(aHora(minuto));
        }
      }
    }
    return horarios;
  }

  /** ¿El día tiene al menos un inicio? (punto debajo del número del calendario). */
  tieneCupo(consulta: Consulta, fecha: Date): boolean {
    if (!consulta.servicios.length || !this.esReservable(fecha)) {
      return false;
    }
    const contexto = this.contexto(consulta, fecha);
    const ordenes = this.ordenes(consulta);
    for (const franja of FRANJAS) {
      const cierre = aMinutos(franja.hasta);
      for (let minuto = aMinutos(franja.desde); minuto < cierre; minuto += PASO_MIN) {
        if (this.primerPlan(ordenes, contexto, fecha, cierre, minuto)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Primer día con al menos un horario libre, contando desde hoy. Con esto el
   * paso 2 abre con un día ya elegido en vez de un calendario vacío. `dias`
   * cubre el mismo alcance que el calendario (3 meses).
   */
  primerDiaConCupo(consulta: Consulta, dias = 92): Date | null {
    const hoy = inicioDelDia(new Date());
    for (let i = 0; i < dias; i++) {
      const fecha = sumarDias(hoy, i);
      if (this.tieneCupo(consulta, fecha)) {
        return fecha;
      }
    }
    return null;
  }

  /**
   * Resuelve la visita que arranca a esa hora: quién atiende cada servicio, en
   * qué orden y a qué hora. null si a esa hora ya no entra.
   */
  planDe(consulta: Consulta, fecha: Date, hora: string): Tramo[] | null {
    const minuto = aMinutos(hora);
    const franja = FRANJAS.find((f) => minuto >= aMinutos(f.desde) && minuto < aMinutos(f.hasta));
    if (!franja || !consulta.servicios.length || !this.esReservable(fecha)) {
      return null;
    }
    return this.primerPlan(
      this.ordenes(consulta),
      this.contexto(consulta, fecha),
      fecha,
      aMinutos(franja.hasta),
      minuto,
    );
  }

  /**
   * Último control antes de guardar: revalida un bloque ya elegido contra la
   * agenda de este momento. Solo mira los turnos confirmados (la agenda
   * simulada es determinística: si el plan entraba, sigue entrando) y la
   * ocupación del propio paciente. null = el plan se puede confirmar.
   */
  validarPlan(plan: Tramo[], fecha: Date, email?: string): PlanInvalido | null {
    if (!plan.length) {
      return 'vencido';
    }
    // Contra lo último guardado, no contra lo que teníamos en memoria.
    this.agenda.sincronizar();
    const propios = this.agenda.ocupadosDePaciente(email);
    for (const tramo of plan) {
      const inicio = conHora(fecha, aHora(tramo.inicioMin)).getTime();
      const fin = inicio + tramo.duracionMin * 60000;
      if (inicio < Date.now()) {
        return 'vencido';
      }
      if (!libre(inicio, fin, this.agenda.ocupadosDe(tramo.profesional.id))) {
        return 'ocupado';
      }
      // El paciente no puede estar en dos lugares a la vez, tenga cuenta o no.
      if (!libre(inicio, fin, propios)) {
        return 'paciente-ocupado';
      }
    }
    return null;
  }

  /**
   * Días de la semana en los que cada servicio tiene al menos un profesional
   * trabajando, respetando los que el usuario fijó a mano. Si está vacío, esos
   * servicios no pueden compartir visita.
   */
  diasPosibles(consulta: Consulta): number[] {
    return DIAS_HABILES.filter((dia) =>
      consulta.servicios.every((s) => {
        const fijado = consulta.preferidos[s.id];
        return profesionalesPara(s.id).some(
          (p) => (!fijado || p.id === fijado) && p.dias.includes(dia),
        );
      }),
    );
  }

  /**
   * Quiénes de los profesionales fijados a mano no atienden ese día. Sirve para
   * decirle al usuario que su pedido es lo que está bloqueando la fecha.
   */
  fijadosQueNoAtienden(consulta: Consulta, fecha: Date): Profesional[] {
    const dia = fecha.getDay();
    const ids = new Set(
      consulta.servicios.map((s) => consulta.preferidos[s.id]).filter((id): id is string => !!id),
    );
    return [...ids]
      .map((id) => PROFESIONALES.find((p) => p.id === id))
      .filter((p): p is Profesional => !!p && !p.dias.includes(dia));
  }

  /** Por qué ese día no tiene horarios, para poder explicarlo en pantalla. */
  motivoSinCupo(consulta: Consulta, fecha: Date): MotivoSinCupo {
    const { servicios } = consulta;
    if (!servicios.length) {
      return 'sin-servicios';
    }
    if (this.fijadosQueNoAtienden(consulta, fecha).length) {
      return 'profesional-no-atiende';
    }
    const dias = this.diasPosibles(consulta);
    if (!dias.length) {
      return 'sin-dia-comun';
    }
    const franjaMasLarga = Math.max(...FRANJAS.map((f) => aMinutos(f.hasta) - aMinutos(f.desde)));
    if (this.duracionMinima(servicios) > franjaMasLarga) {
      return 'no-entra';
    }
    if (!dias.includes(fecha.getDay())) {
      return 'dia-sin-equipo';
    }
    return 'sin-hueco';
  }

  // --- Interno ------------------------------------------------------------

  /**
   * Órdenes a probar. Con orden fijo (el usuario reordenó a mano) solo se
   * prueba el suyo; si no, se prueban todas las permutaciones empezando por la
   * del carrito, y gana la primera que entre.
   */
  private ordenes(consulta: Consulta): Servicio[][] {
    if (consulta.ordenFijo || consulta.servicios.length < 2) {
      return [consulta.servicios];
    }
    return permutaciones(consulta.servicios);
  }

  private primerPlan(
    ordenes: Servicio[][],
    contexto: Contexto,
    fecha: Date,
    cierre: number,
    inicio: number,
  ): Tramo[] | null {
    for (const orden of ordenes) {
      const plan = this.resolver(orden, contexto, fecha, cierre, 0, inicio, null, []);
      if (plan) {
        return plan;
      }
    }
    return null;
  }

  /**
   * Backtracking sobre los tramos: para cada servicio prueba los profesionales
   * que lo ofrecen y quedan libres, y avanza el reloj. Prioriza seguir con el
   * mismo profesional del tramo anterior (0 de transición y menos caras
   * distintas en la misma visita).
   */
  private resolver(
    orden: Servicio[],
    contexto: Contexto,
    fecha: Date,
    cierre: number,
    indice: number,
    reloj: number,
    anterior: Profesional | null,
    acumulado: Tramo[],
  ): Tramo[] | null {
    if (indice === orden.length) {
      return acumulado;
    }
    const servicio = orden[indice];
    for (const profesional of this.candidatos(servicio, contexto, fecha, anterior)) {
      const distinto = !!anterior && anterior.id !== profesional.id;
      const inicioMin = reloj + (distinto ? TRANSICION_MIN : 0);
      const finMin = inicioMin + servicio.duracionMin;
      if (finMin > cierre) {
        continue;
      }
      const inicioMs = conHora(fecha, aHora(inicioMin)).getTime();
      const finMs = inicioMs + servicio.duracionMin * 60000;
      if (inicioMs < Date.now()) {
        continue;
      }
      if (
        !libre(inicioMs, finMs, contexto.ocupados.get(profesional.id) ?? []) ||
        !libre(inicioMs, finMs, contexto.paciente)
      ) {
        continue;
      }
      const tramo: Tramo = {
        servicio,
        profesional,
        inicioMin,
        duracionMin: servicio.duracionMin,
        automatico: !this.fijado(contexto, servicio),
      };
      const resto = this.resolver(orden, contexto, fecha, cierre, indice + 1, finMin, profesional, [
        ...acumulado,
        tramo,
      ]);
      if (resto) {
        return resto;
      }
    }
    return null;
  }

  /** Quiénes pueden tomar ese servicio ese día, con el anterior al frente. */
  private candidatos(
    servicio: Servicio,
    contexto: Contexto,
    fecha: Date,
    anterior: Profesional | null,
  ): Profesional[] {
    const fijado = contexto.preferidos[servicio.id];
    const lista = profesionalesPara(servicio.id).filter(
      (p) => this.atiende(p, fecha) && (!fijado || p.id === fijado),
    );
    if (!anterior) {
      return lista;
    }
    return [...lista].sort((a, b) => Number(b.id === anterior.id) - Number(a.id === anterior.id));
  }

  private fijado(contexto: Contexto, servicio: Servicio): boolean {
    return !!contexto.preferidos[servicio.id];
  }

  /** Junta de una sola vez la ocupación de todos los involucrados. */
  private contexto(consulta: Consulta, fecha: Date): Contexto {
    const ocupados = new Map<string, Intervalo[]>();
    for (const servicio of consulta.servicios) {
      for (const profesional of profesionalesPara(servicio.id)) {
        if (!ocupados.has(profesional.id)) {
          ocupados.set(profesional.id, [
            ...this.agenda.ocupadosDe(profesional.id),
            ...this.agendaSimulada(profesional, fecha),
          ]);
        }
      }
    }
    return {
      ocupados,
      paciente: this.agenda.ocupadosDePaciente(consulta.email),
      preferidos: consulta.preferidos,
    };
  }

  /**
   * Huecos ya tomados en la agenda simulada del profesional (sin backend). Son
   * intervalos reales de PASO_MIN, no índices de una grilla: así un servicio
   * largo que cruza varios huecos se valida igual que uno corto.
   */
  private agendaSimulada(profesional: Profesional, fecha: Date): Intervalo[] {
    const clave = `${profesional.id}|${inicioDelDia(fecha).getTime()}`;
    const cacheado = this.simulados.get(clave);
    if (cacheado) {
      return cacheado;
    }
    const semilla = fecha.getFullYear() * 10000 + (fecha.getMonth() + 1) * 100 + fecha.getDate();
    const propio = [...profesional.id].reduce((total, c) => total + c.charCodeAt(0), 0);
    const intervalos: Intervalo[] = [];
    let indice = 0;
    for (const franja of FRANJAS) {
      const cierre = aMinutos(franja.hasta);
      for (let minuto = aMinutos(franja.desde); minuto < cierre; minuto += PASO_MIN) {
        if ((semilla * 31 + indice * 17 + propio * 13) % 9 < 2) {
          const inicio = conHora(fecha, aHora(minuto)).getTime();
          intervalos.push({ inicio, fin: inicio + PASO_MIN * 60000 });
        }
        indice++;
      }
    }
    this.simulados.set(clave, intervalos);
    return intervalos;
  }
}

function libre(inicio: number, fin: number, ocupados: Intervalo[]): boolean {
  return !ocupados.some((o) => inicio < o.fin && fin > o.inicio);
}

/** Todas las permutaciones de la lista (a lo sumo 3 servicios ⇒ 6 órdenes). */
function permutaciones<T>(lista: T[]): T[][] {
  if (lista.length <= 1) {
    return [lista];
  }
  const salida: T[][] = [];
  for (let i = 0; i < lista.length; i++) {
    const resto = [...lista.slice(0, i), ...lista.slice(i + 1)];
    for (const cola of permutaciones(resto)) {
      salida.push([lista[i], ...cola]);
    }
  }
  return salida;
}
