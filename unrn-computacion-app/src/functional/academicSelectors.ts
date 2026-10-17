import type { EstadoAcademicoUsuario } from '../types';
import { Materia } from '../models/Materia';
import { HorarioCursada } from '../models/HorarioCursada';
import { Aula, type EstadoOcupacionAula } from '../models/Aula';

/**
 * Paradigma: Programación Funcional (FP)
 * Colección de funciones puras, inmutables y transformadoras que procesan listas,
 * grafos de correlatividades y matrices horarias mediante map, filter y reduce.
 */

/**
 * Filtra materias por año cursado de forma pura
 */
export const filtrarMateriasPorAnio = (materias: Materia[], anio: number): Materia[] =>
  materias.filter(m => m.anio === anio);

/**
 * Filtra materias por cuatrimestre
 */
export const filtrarMateriasPorCuatrimestre = (materias: Materia[], cuatrimestre: 1 | 2): Materia[] =>
  materias.filter(m => m.cuatrimestre === cuatrimestre);

/**
 * Calcula el progreso de la carrera y el título intermedio usando reduce
 */
export const calcularProgresoCarrera = (
  materias: Materia[],
  estado: EstadoAcademicoUsuario
): {
  aprobadasTotal: number;
  totalMaterias: number;
  porcentajeGrado: number;
  horasAprobadas: number;
  horasTotalesGrado: number;
  aprobadasIntermedio: number;
  totalIntermedio: number;
  porcentajeIntermedio: number;
} => {
  const materiasIntermedio = materias.filter(m => m.perteneceATituloIntermedio);

  const statsGrado = materias.reduce(
    (acc, m) => {
      const aprobada = estado[m.codigoGuarani] === 'aprobada';
      return {
        aprobadas: acc.aprobadas + (aprobada ? 1 : 0),
        horasAprobadas: acc.horasAprobadas + (aprobada ? m.horasTotales : 0),
        horasTotales: acc.horasTotales + m.horasTotales
      };
    },
    { aprobadas: 0, horasAprobadas: 0, horasTotales: 0 }
  );

  const aprobadasIntermedio = materiasIntermedio.reduce(
    (count, m) => count + (estado[m.codigoGuarani] === 'aprobada' ? 1 : 0),
    0
  );

  const totalMaterias = materias.length;
  const porcentajeGrado = totalMaterias > 0 ? Math.round((statsGrado.aprobadas / totalMaterias) * 100) : 0;
  const totalIntermedio = materiasIntermedio.length;
  const porcentajeIntermedio = totalIntermedio > 0 ? Math.round((aprobadasIntermedio / totalIntermedio) * 100) : 0;

  return {
    aprobadasTotal: statsGrado.aprobadas,
    totalMaterias,
    porcentajeGrado,
    horasAprobadas: statsGrado.horasAprobadas,
    horasTotalesGrado: statsGrado.horasTotales,
    aprobadasIntermedio,
    totalIntermedio,
    porcentajeIntermedio
  };
};

/**
 * Obtiene todas las materias que el estudiante ESTÁ EN CONDICIONES DE CURSAR
 * basándose puramente en su estado académico actual.
 */
export const obtenerMateriasHabilitadasParaCursar = (
  materias: Materia[],
  estado: EstadoAcademicoUsuario
): { materia: Materia; motivo: string }[] => {
  return materias
    .map(m => ({
      materia: m,
      evaluacion: m.verificarHabilitacionCursado(estado)
    }))
    .filter(item => item.evaluacion.habilitada)
    .map(item => ({
      materia: item.materia,
      motivo: item.evaluacion.motivo || 'Habilitada'
    }));
};

/**
 * Agrupa los horarios de cursada por día de la semana
 */
export const agruparHorariosPorDia = (
  horarios: HorarioCursada[]
): Record<string, HorarioCursada[]> => {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return dias.reduce((acc, dia) => {
    acc[dia] = horarios
      .filter(h => h.diaSemana.toLowerCase() === dia)
      .sort((a, b) => a.minutosInicio - b.minutosInicio);
    return acc;
  }, {} as Record<string, HorarioCursada[]>);
};

/**
 * Detecta si existe algún solapamiento de horarios entre las materias elegidas
 */
export const detectarConflictosHorarios = (
  horarios: HorarioCursada[]
): { clase1: HorarioCursada; clase2: HorarioCursada }[] => {
  const conflictos: { clase1: HorarioCursada; clase2: HorarioCursada }[] = [];

  for (let i = 0; i < horarios.length; i++) {
    for (let j = i + 1; j < horarios.length; j++) {
      if (horarios[i].seSolapaCon(horarios[j])) {
        conflictos.push({ clase1: horarios[i], clase2: horarios[j] });
      }
    }
  }

  return conflictos;
};

/**
 * Calcula el estado de ocupación de todas las aulas para un día y hora dados
 */
export const calcularOcupacionDeAulas = (
  aulas: Aula[],
  todosLosHorarios: HorarioCursada[],
  dia: string,
  minutosActuales: number
): EstadoOcupacionAula[] => {
  return aulas.map(aula => {
    const clasesDelAula = todosLosHorarios.filter(h => {
      // Si el aula es física, coincide por nombre/id de aula
      if (aula.tipo === 'virtual') return h.aula.toLowerCase() === 'virtual';
      return h.aula.toLowerCase().includes(aula.id.toLowerCase()) || 
             aula.nombre.toLowerCase().includes(h.aula.toLowerCase());
    });
    return aula.evaluarEstado(dia, minutosActuales, clasesDelAula);
  });
};
