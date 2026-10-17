import type { EventoCalendarioRaw, CategoriaEvento } from '../types';

/**
 * Paradigma: Programación Orientada a Objetos (POO)
 * Modela un hito o período del Calendario Académico Oficial de la UNRN (Res. 038/2024 y 1500/2025)
 */
export class EventoCalendario {
  public readonly id: string;
  public readonly fechaTexto: string;
  public readonly fechaInicio: Date;
  public readonly fechaFin?: Date;
  public readonly titulo: string;
  public readonly categoria: CategoriaEvento;
  public readonly descripcion?: string;
  public readonly resolucion?: string;

  constructor(data: EventoCalendarioRaw) {
    this.id = data.id;
    this.fechaTexto = data.fechaTexto;
    this.fechaInicio = new Date(`${data.fechaInicio}T00:00:00`);
    this.fechaFin = data.fechaFin ? new Date(`${data.fechaFin}T23:59:59`) : undefined;
    this.titulo = data.titulo;
    this.categoria = data.categoria;
    this.descripcion = data.descripcion;
    this.resolucion = data.resolucion;
  }

  /**
   * Determina si el evento está ocurriendo en este momento
   */
  public estaEnCurso(fechaReferencia: Date = new Date()): boolean {
    const fin = this.fechaFin ?? new Date(this.fechaInicio.getTime() + 24 * 3600 * 1000);
    return fechaReferencia >= this.fechaInicio && fechaReferencia <= fin;
  }

  /**
   * Determina si el evento es futuro respecto a la fecha dada
   */
  public esFuturo(fechaReferencia: Date = new Date()): boolean {
    return this.fechaInicio > fechaReferencia;
  }

  /**
   * Retorna los días restantes hasta el inicio del evento
   */
  public diasRestantes(fechaReferencia: Date = new Date()): number {
    const diff = this.fechaInicio.getTime() - fechaReferencia.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
