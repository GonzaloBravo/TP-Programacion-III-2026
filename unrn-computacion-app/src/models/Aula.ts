import type { AulaInfo } from '../types';
import { HorarioCursada } from './HorarioCursada';

export interface EstadoOcupacionAula {
  aulaId: string;
  nombreAula: string;
  sede: string;
  tipo: string;
  estado: 'ocupada' | 'disponible' | 'virtual';
  claseActual?: HorarioCursada;
  proximaClase?: HorarioCursada;
  minutosRestantesClaseActual?: number;
  minutosParaProximaClase?: number;
}

/**
 * Paradigma: Programación Orientada a Objetos (POO)
 * Modela un espacio físico o virtual de la universidad (Sede Andina - UNRN)
 * y calcula dinámicamente su ocupación.
 */
export class Aula {
  public readonly id: string;
  public readonly nombre: string;
  public readonly sede: string;
  public readonly capacidadAprox: number;
  public readonly tipo: 'aula_teoria' | 'laboratorio' | 'pecera' | 'virtual';

  constructor(info: AulaInfo) {
    this.id = info.id;
    this.nombre = info.nombre;
    this.sede = info.sede;
    this.capacidadAprox = info.capacidadAprox ?? 35;
    this.tipo = info.tipo;
  }

  /**
   * Determina el estado de ocupación del aula en un momento exacto
   */
  public evaluarEstado(
    dia: string,
    minutosActuales: number,
    clasesEnAula: HorarioCursada[]
  ): EstadoOcupacionAula {
    const clasesDelDia = clasesEnAula
      .filter(c => c.diaSemana.toLowerCase() === dia.toLowerCase())
      .sort((a, b) => a.minutosInicio - b.minutosInicio);

    const claseActual = clasesDelDia.find(c => c.estaEnCurso(dia, minutosActuales));
    const proximaClase = clasesDelDia.find(c => c.esProxima(dia, minutosActuales));

    if (this.tipo === 'virtual') {
      return {
        aulaId: this.id,
        nombreAula: this.nombre,
        sede: this.sede,
        tipo: this.tipo,
        estado: 'virtual',
        claseActual,
        proximaClase
      };
    }

    if (claseActual) {
      return {
        aulaId: this.id,
        nombreAula: this.nombre,
        sede: this.sede,
        tipo: this.tipo,
        estado: 'ocupada',
        claseActual,
        proximaClase,
        minutosRestantesClaseActual: claseActual.minutosParaFinalizar(minutosActuales)
      };
    }

    return {
      aulaId: this.id,
      nombreAula: this.nombre,
      sede: this.sede,
      tipo: this.tipo,
      estado: 'disponible',
      proximaClase,
      minutosParaProximaClase: proximaClase ? proximaClase.minutosInicio - minutosActuales : undefined
    };
  }
}
