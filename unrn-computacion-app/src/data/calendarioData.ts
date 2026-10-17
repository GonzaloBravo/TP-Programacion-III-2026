import type { EventoCalendarioRaw } from '../types';

export const CALENDARIO_DATA: EventoCalendarioRaw[] = [
  // INGRESO Y VERANO 2026
  {
    id: "cal-ingreso-2026",
    fechaTexto: "15/09/2025 al 30/01/2026",
    fechaInicio: "2025-09-15",
    fechaFin: "2026-01-30",
    titulo: "Inscripción a Carreras - Año Lectivo 2026",
    categoria: "inscripcion",
    resolucion: "Res. CSDEyVE N° 038/2024"
  },
  {
    id: "cal-receso-estival",
    fechaTexto: "22/12/2025 al 16/01/2026",
    fechaInicio: "2025-12-22",
    fechaFin: "2026-01-16",
    titulo: "Receso Estival",
    categoria: "receso",
    resolucion: "Res. Rectoral N° 1500/2025"
  },
  {
    id: "cal-reinscripcion-censo",
    fechaTexto: "19/01/2026",
    fechaInicio: "2026-01-19",
    titulo: "Inicio del Período de Reinscripción Obligatoria y Censo de Estudiantes",
    categoria: "tramite",
    resolucion: "Res. CSDEyVE N° 038/2024"
  },

  // FEBRERO 2026
  {
    id: "cal-curso-ingreso",
    fechaTexto: "02/02/2026",
    fechaInicio: "2026-02-02",
    titulo: "Inicio dictado Módulo Específico Curso de Ingreso 2026",
    categoria: "cursada"
  },
  {
    id: "cal-insc-feb-1",
    fechaTexto: "02 al 05/02/2026",
    fechaInicio: "2026-02-02",
    fechaFin: "2026-02-05",
    titulo: "Inscripción a Exámenes Turno Febrero - Primer Llamado",
    categoria: "inscripcion"
  },
  {
    id: "cal-mesa-feb-1",
    fechaTexto: "09 al 14/02/2026",
    fechaInicio: "2026-02-09",
    fechaFin: "2026-02-14",
    titulo: "Primer Llamado a Exámenes - Turno Febrero",
    categoria: "examen"
  },
  {
    id: "cal-insc-feb-2",
    fechaTexto: "16 al 19/02/2026",
    fechaInicio: "2026-02-16",
    fechaFin: "2026-02-19",
    titulo: "Inscripción a Exámenes Turno Febrero - Segundo Llamado",
    categoria: "inscripcion"
  },
  {
    id: "cal-mesa-feb-2",
    fechaTexto: "23 al 28/02/2026",
    fechaInicio: "2026-02-23",
    fechaFin: "2026-02-28",
    titulo: "Segundo Llamado a Exámenes - Turno Febrero",
    categoria: "examen"
  },
  {
    id: "cal-insc-materias-1c",
    fechaTexto: "25/02 al 13/03/2026",
    fechaInicio: "2026-02-25",
    fechaFin: "2026-03-13",
    titulo: "Inscripciones a Asignaturas Primer Cuatrimestre y Anuales",
    categoria: "inscripcion",
    descripcion: "Por sistema SIU Guaraní para todas las asignaturas del 1° cuatrimestre."
  },

  // MARZO 2026
  {
    id: "cal-inicio-1c",
    fechaTexto: "02/03/2026",
    fechaInicio: "2026-03-02",
    titulo: "Inicio de clases Primer Cuatrimestre (2° a 5° año)",
    categoria: "cursada"
  },
  {
    id: "cal-inicio-1c-1ro",
    fechaTexto: "09/03/2026",
    fechaInicio: "2026-03-09",
    titulo: "Inicio de clases Primer Cuatrimestre - Primer Año",
    categoria: "cursada"
  },

  // MAYO 2026
  {
    id: "cal-insc-mayo-extra",
    fechaTexto: "20 al 23/04/2026",
    fechaInicio: "2026-04-20",
    fechaFin: "2026-04-23",
    titulo: "Inscripción a Exámenes Extraordinarios - Turno Mayo",
    categoria: "inscripcion"
  },
  {
    id: "cal-mesa-mayo-extra",
    fechaTexto: "04 al 09/05/2026",
    fechaInicio: "2026-05-04",
    fechaFin: "2026-05-09",
    titulo: "Llamado a Exámenes Extraordinarios - Turno Mayo",
    categoria: "examen"
  },
  {
    id: "cal-feriado-docente",
    fechaTexto: "15/05/2026",
    fechaInicio: "2026-05-15",
    titulo: "Día del Docente Universitario (Feriado Institucional UNRN)",
    categoria: "institucional"
  },

  // JUNIO 2026
  {
    id: "cal-fin-1c",
    fechaTexto: "19/06/2026",
    fechaInicio: "2026-06-19",
    titulo: "Fin de cursada del Primer Cuatrimestre",
    categoria: "cursada"
  },
  {
    id: "cal-insc-julio-1",
    fechaTexto: "22 al 26/06/2026",
    fechaInicio: "2026-06-22",
    fechaFin: "2026-06-26",
    titulo: "Inscripciones al Primer Llamado a Exámenes - Turno Julio",
    categoria: "inscripcion"
  },
  {
    id: "cal-mesa-julio-1",
    fechaTexto: "29/06 al 04/07/2026",
    fechaInicio: "2026-06-29",
    fechaFin: "2026-07-04",
    titulo: "Primer Llamado a Exámenes - Turno Julio",
    categoria: "examen"
  },

  // JULIO 2026
  {
    id: "cal-receso-invierno",
    fechaTexto: "13 al 24/07/2026",
    fechaInicio: "2026-07-13",
    fechaFin: "2026-07-24",
    titulo: "Receso Invernal",
    categoria: "receso"
  },
  {
    id: "cal-insc-julio-2",
    fechaTexto: "20 al 23/07/2026",
    fechaInicio: "2026-07-20",
    fechaFin: "2026-07-23",
    titulo: "Inscripciones al Segundo Llamado a Exámenes - Turno Julio",
    categoria: "inscripcion"
  },
  {
    id: "cal-mesa-julio-2",
    fechaTexto: "27/07 al 01/08/2026",
    fechaInicio: "2026-07-27",
    fechaFin: "2026-08-01",
    titulo: "Segundo Llamado a Exámenes - Turno Julio",
    categoria: "examen"
  },
  {
    id: "cal-insc-materias-2c",
    fechaTexto: "27/07 al 14/08/2026",
    fechaInicio: "2026-07-27",
    fechaFin: "2026-08-14",
    titulo: "Inscripción a Asignaturas del Segundo Cuatrimestre",
    categoria: "inscripcion"
  },

  // AGOSTO 2026
  {
    id: "cal-inicio-2c",
    fechaTexto: "03/08/2026",
    fechaInicio: "2026-08-03",
    titulo: "Inicio de clases del Segundo Cuatrimestre",
    categoria: "cursada",
    descripcion: "Comienzo del ciclo lectivo 2° cuatrimestre para todas las carreras presenciales."
  },

  // SEPTIEMBRE 2026
  {
    id: "cal-insc-sept-extra",
    fechaTexto: "14 al 19/09/2026",
    fechaInicio: "2026-09-14",
    fechaFin: "2026-09-19",
    titulo: "Inscripciones a Exámenes Extraordinarios - Turno Septiembre",
    categoria: "inscripcion"
  },
  {
    id: "cal-mesa-sept-extra",
    fechaTexto: "21 al 26/09/2026",
    fechaInicio: "2026-09-21",
    fechaFin: "2026-09-26",
    titulo: "Llamado a Exámenes Extraordinarios - Turno Septiembre",
    categoria: "examen"
  },
  {
    id: "cal-feriado-estudiante",
    fechaTexto: "21/09/2026",
    fechaInicio: "2026-09-21",
    titulo: "Día del y la Estudiante (Feriado Institucional UNRN)",
    categoria: "institucional"
  },

  // NOVIEMBRE 2026
  {
    id: "cal-fin-2c",
    fechaTexto: "21/11/2026",
    fechaInicio: "2026-11-21",
    titulo: "Fin de clases del Segundo Cuatrimestre y Anuales",
    categoria: "cursada"
  },
  {
    id: "cal-actas-2c",
    fechaTexto: "17 al 20/11/2026",
    fechaInicio: "2026-11-17",
    fechaFin: "2026-11-20",
    titulo: "Cierre de Actas de Cursado de Asignaturas 2° Cuatrimestre",
    categoria: "tramite"
  },
  {
    id: "cal-insc-dic-1",
    fechaTexto: "23 al 26/11/2026",
    fechaInicio: "2026-11-23",
    fechaFin: "2026-11-26",
    titulo: "Inscripciones a Primer Llamado Exámenes - Turno Diciembre",
    categoria: "inscripcion"
  },
  {
    id: "cal-feriado-nodocente",
    fechaTexto: "26/11/2026",
    fechaInicio: "2026-11-26",
    titulo: "Día del y la Nodocente (Feriado Institucional UNRN)",
    categoria: "institucional"
  },

  // DICIEMBRE 2026
  {
    id: "cal-mesa-dic-1",
    fechaTexto: "30/11 al 05/12/2026",
    fechaInicio: "2026-11-30",
    fechaFin: "2026-12-05",
    titulo: "Primer Llamado de Exámenes - Turno Diciembre",
    categoria: "examen"
  },
  {
    id: "cal-insc-dic-2",
    fechaTexto: "07 al 12/12/2026",
    fechaInicio: "2026-12-07",
    fechaFin: "2026-12-12",
    titulo: "Inscripción a Segundo Llamado de Exámenes - Turno Diciembre",
    categoria: "inscripcion"
  },
  {
    id: "cal-mesa-dic-2",
    fechaTexto: "14 al 19/12/2026",
    fechaInicio: "2026-12-14",
    fechaFin: "2026-12-19",
    titulo: "Segundo Llamado de Exámenes - Turno Diciembre",
    categoria: "examen"
  }
];
