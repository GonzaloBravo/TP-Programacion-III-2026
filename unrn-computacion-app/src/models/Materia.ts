import type { MateriaRaw, EstadoAcademicoUsuario } from '../types';

/**
 * Paradigma: Programación Orientada a Objetos (POO)
 * Modela una Asignatura del plan de estudios de Ingeniería en Computación (UNRN)
 * Encapsula las reglas de negocio sobre correlatividades académicas:
 * - Requisitos regularizados para cursar
 * - Requisitos aprobados para cursar
 * - Requisitos aprobados para rendir examen final
 */
export class Materia {
  public readonly codigoGuarani: string;
  public readonly nroOrden: string;
  public readonly nombre: string;
  public readonly anio: number;
  public readonly cuatrimestre: 1 | 2;
  public readonly horasSemanales: number;
  public readonly horasTotales: number;
  public readonly regularizadaParaCursar: string[];
  public readonly aprobadaParaCursar: string[];
  public readonly aprobadaParaAprobar: string[];
  public readonly objetivos: string[];
  public readonly contenidosMinimos: string;
  public readonly esOptativa: boolean;

  constructor(data: MateriaRaw) {
    this.codigoGuarani = data.codigoGuarani;
    this.nroOrden = data.nroOrden;
    this.nombre = data.nombre;
    this.anio = data.anio;
    this.cuatrimestre = data.cuatrimestre;
    this.horasSemanales = data.horasSemanales;
    this.horasTotales = data.horasTotales;
    this.regularizadaParaCursar = data.regularizadaParaCursar;
    this.aprobadaParaCursar = data.aprobadaParaCursar;
    this.aprobadaParaAprobar = data.aprobadaParaAprobar;
    this.objetivos = data.objetivos ?? [];
    this.contenidosMinimos = data.contenidosMinimos ?? '';
    this.esOptativa = !!data.esOptativa;
  }

  /**
   * Indica si la materia forma parte del Título Intermedio
   * (Técnico/a Universitario/a en Computación - Años 1 al 3, 2272 horas)
   */
  public get perteneceATituloIntermedio(): boolean {
    return this.anio <= 3;
  }

  /**
   * Evalúa si el estudiante cumple con los requisitos para INSCRIBIRSE A CURSAR:
   * Requiere tener REGULARIZADAS o APROBADAS las materias exigidas en regularizadaParaCursar,
   * y tener APROBADAS las exigidas en aprobadaParaCursar.
   */
  public verificarHabilitacionCursado(estadoUsuario: EstadoAcademicoUsuario): {
    habilitada: boolean;
    motivo?: string;
    correlativasFaltantes: string[];
  } {
    const estadoPropio = estadoUsuario[this.codigoGuarani] || 'pendiente';
    if (estadoPropio === 'aprobada') {
      return { habilitada: false, motivo: 'Materia ya aprobada', correlativasFaltantes: [] };
    }
    if (estadoPropio === 'cursando') {
      return { habilitada: false, motivo: 'Actualmente en cursada', correlativasFaltantes: [] };
    }

    const faltantes: string[] = [];

    // Validar regularizadas requeridas (se cumple con regular O aprobada)
    for (const req of this.regularizadaParaCursar) {
      if (!req || req === '-') continue;
      const estado = estadoUsuario[req];
      if (estado !== 'regular' && estado !== 'aprobada') {
        faltantes.push(`${req} (debe estar Regular o Aprobada)`);
      }
    }

    // Validar aprobadas para cursar
    for (const req of this.aprobadaParaCursar) {
      if (!req || req === '-') continue;
      const estado = estadoUsuario[req];
      if (estado !== 'aprobada') {
        faltantes.push(`${req} (debe estar Aprobada)`);
      }
    }

    const habilitada = faltantes.length === 0;
    return {
      habilitada,
      motivo: habilitada ? 'Cumple todas las correlativas para cursar' : 'Faltan correlativas previas',
      correlativasFaltantes: faltantes
    };
  }

  /**
   * Evalúa si el estudiante puede RENDIR EL EXAMEN FINAL
   * Requiere tener la materia REGULAR (o aprobada) y todas las aprobadaParaAprobar en estado APROBADA.
   */
  public verificarHabilitacionFinal(estadoUsuario: EstadoAcademicoUsuario): {
    habilitada: boolean;
    faltantes: string[];
  } {
    const estadoPropio = estadoUsuario[this.codigoGuarani] || 'pendiente';
    const faltantes: string[] = [];

    if (estadoPropio !== 'regular' && estadoPropio !== 'cursando') {
      faltantes.push('Tener la cursada regularizada');
    }

    for (const req of this.aprobadaParaAprobar) {
      if (!req || req === '-') continue;
      if (estadoUsuario[req] !== 'aprobada') {
        faltantes.push(`${req} (Aprobada)`);
      }
    }

    return {
      habilitada: faltantes.length === 0,
      faltantes
    };
  }
}
