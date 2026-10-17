import type { HorarioCursadaRaw } from '../types';

/**
 * Paradigma: Programación Orientada a Objetos (POO)
 * Encapsula la entidad HorarioCursada con su lógica de verificación temporal,
 * solapamiento de horarios y cálculo de duración.
 */
export class HorarioCursada {
  public readonly id: string;
  public readonly codigoMateria: string;
  public readonly nombreMateria: string;
  public readonly comision: string;
  public readonly tipoClase: string;
  public readonly lugar: string;
  public readonly aula: string;
  public readonly diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  public readonly horaDesde: string;
  public readonly horaHasta: string;
  public readonly duracion: string;
  public readonly docente: string;
  public readonly emailDocente?: string;
  public readonly auxiliar?: string;
  public readonly emailAuxiliar?: string;
  public readonly observaciones?: string;
  public readonly anio: number;

  constructor(data: HorarioCursadaRaw) {
    this.id = data.id;
    this.codigoMateria = data.codigoMateria;
    this.nombreMateria = data.nombreMateria;
    this.comision = data.comision;
    this.tipoClase = data.tipoClase;
    this.lugar = data.lugar;
    this.aula = data.aula;
    this.diaSemana = data.diaSemana;
    this.horaDesde = data.horaDesde;
    this.horaHasta = data.horaHasta;
    this.duracion = data.duracion;
    this.docente = data.docente;
    this.emailDocente = data.emailDocente;
    this.auxiliar = data.auxiliar;
    this.emailAuxiliar = data.emailAuxiliar;
    this.observaciones = data.observaciones;
    this.anio = data.anio;
  }

  /**
   * Convierte "HH:MM" a minutos desde las 00:00 para comparaciones aritméticas
   */
  public static horaAMinutos(horaStr: string): number {
    const [h, m] = horaStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  public get minutosInicio(): number {
    return HorarioCursada.horaAMinutos(this.horaDesde);
  }

  public get minutosFin(): number {
    return HorarioCursada.horaAMinutos(this.horaHasta);
  }

  /**
   * Determina si la clase está transcurriendo en un día y minuto específico
   */
  public estaEnCurso(dia: string, minutosActuales: number): boolean {
    if (this.diaSemana.toLowerCase() !== dia.toLowerCase()) return false;
    return minutosActuales >= this.minutosInicio && minutosActuales < this.minutosFin;
  }

  /**
   * Determina si la clase comenzará en el futuro durante el mismo día
   */
  public esProxima(dia: string, minutosActuales: number): boolean {
    if (this.diaSemana.toLowerCase() !== dia.toLowerCase()) return false;
    return this.minutosInicio > minutosActuales;
  }

  /**
   * Calcula los minutos que faltan para terminar la clase (si está en curso)
   */
  public minutosParaFinalizar(minutosActuales: number): number {
    return Math.max(0, this.minutosFin - minutosActuales);
  }

  /**
   * Verifica solapamiento de horarios entre dos cursadas
   */
  public seSolapaCon(otro: HorarioCursada): boolean {
    if (this.diaSemana !== otro.diaSemana) return false;
    return this.minutosInicio < otro.minutosFin && otro.minutosInicio < this.minutosFin;
  }
}
