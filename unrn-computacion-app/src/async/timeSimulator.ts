export interface HoraSimulada {
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  horaTexto: string; // "14:30"
  minutosDesdeMedianoche: number;
  esModoSimulado: boolean;
}

type TimeListener = (hora: HoraSimulada) => void;

/**
 * Paradigma: Asincrónico y Basado en Eventos
 * Emisor de eventos temporales para la actualización reactiva en tiempo real
 * del estado de las aulas universitarias.
 */
class TimeSimulatorService {
  private listeners: Set<TimeListener> = new Set();
  private timerId: number | null = null;
  private estadoActual: HoraSimulada;

  constructor() {
    this.estadoActual = this.calcularHoraReal();
    this.iniciarReloj();
  }

  private diasSemana: ('domingo' | 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado')[] = [
    'domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'
  ];

  private calcularHoraReal(): HoraSimulada {
    const ahora = new Date();
    const diaIndex = ahora.getDay();
    const dia = this.diasSemana[diaIndex];
    const horas = String(ahora.getHours()).padStart(2, '0');
    const mins = String(ahora.getMinutes()).padStart(2, '0');
    return {
      dia: dia as any,
      horaTexto: `${horas}:${mins}`,
      minutosDesdeMedianoche: ahora.getHours() * 60 + ahora.getMinutes(),
      esModoSimulado: false
    };
  }

  private iniciarReloj() {
    if (typeof window !== 'undefined') {
      this.timerId = window.setInterval(() => {
        if (!this.estadoActual.esModoSimulado) {
          this.estadoActual = this.calcularHoraReal();
          this.notificar();
        }
      }, 10000); // Actualiza cada 10 seg en tiempo real
    }
  }

  public destruir() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public suscribir(listener: TimeListener): () => void {
    this.listeners.add(listener);
    listener(this.estadoActual);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notificar() {
    this.listeners.forEach(l => l(this.estadoActual));
  }

  public setModoSimulado(
    dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado',
    horaTexto: string
  ) {
    const [h, m] = horaTexto.split(':').map(Number);
    this.estadoActual = {
      dia,
      horaTexto,
      minutosDesdeMedianoche: (h || 0) * 60 + (m || 0),
      esModoSimulado: true
    };
    this.notificar();
  }

  public volverAHoraReal() {
    this.estadoActual = this.calcularHoraReal();
    this.notificar();
  }

  public getEstado(): HoraSimulada {
    return this.estadoActual;
  }
}

export const timeSimulator = new TimeSimulatorService();
