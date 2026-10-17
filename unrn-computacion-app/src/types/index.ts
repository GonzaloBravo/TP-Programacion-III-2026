export type EstadoMateria = 'aprobada' | 'regular' | 'cursando' | 'pendiente';

export type CategoriaEvento = 'examen' | 'cursada' | 'inscripcion' | 'feriado' | 'institucional' | 'receso' | 'tramite';

export type SedeEdificio = 
  | 'Malvinas Argentinas (Anasagasti 2)'
  | 'Heroes de Malvinas (Anasagasti I)'
  | 'Tacuari 150'
  | 'Virtual'
  | 'Todas';

export interface MateriaRaw {
  codigoGuarani: string;
  nroOrden: string;
  nombre: string;
  anio: number;
  cuatrimestre: 1 | 2;
  horasSemanales: number;
  horasTotales: number;
  regularizadaParaCursar: string[]; // Nombres o códigos de materias
  aprobadaParaCursar: string[];
  aprobadaParaAprobar: string[];
  objetivos?: string[];
  contenidosMinimos?: string;
  esOptativa?: boolean;
}

export interface HorarioCursadaRaw {
  id: string;
  codigoMateria: string;
  nombreMateria: string;
  comision: string;
  tipoClase: string;
  lugar: string;
  aula: string;
  diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  horaDesde: string; // "14:00"
  horaHasta: string; // "17:00"
  duracion: string;
  docente: string;
  emailDocente?: string;
  auxiliar?: string;
  emailAuxiliar?: string;
  observaciones?: string;
  anio: number;
}

export interface AulaInfo {
  id: string;
  nombre: string;
  sede: string;
  capacidadAprox?: number;
  tipo: 'aula_teoria' | 'laboratorio' | 'pecera' | 'virtual';
}

export interface EventoCalendarioRaw {
  id: string;
  fechaTexto: string;
  fechaInicio: string; // ISO YYYY-MM-DD
  fechaFin?: string;   // ISO YYYY-MM-DD
  titulo: string;
  categoria: CategoriaEvento;
  descripcion?: string;
  resolucion?: string;
}

export interface NovedadPost {
  id: string;
  titulo: string;
  contenido: string;
  autor: string;
  rolAutor: 'Docente' | 'Dirección de Carrera' | 'Centro de Estudiantes' | 'Estudiante';
  codigoMateria?: string;
  nombreMateria?: string;
  fecha: string;
  hora: string;
  importante?: boolean;
  likes: number;
}

export interface EstadoAcademicoUsuario {
  [codigoGuarani: string]: EstadoMateria;
}

export interface ComisionSeleccionada {
  codigoMateria: string;
  comision: string;
}
