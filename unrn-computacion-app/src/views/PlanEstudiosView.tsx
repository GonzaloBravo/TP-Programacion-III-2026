import React, { useState } from 'react';
import { GraduationCap, BookOpen, CheckCircle, Clock, AlertTriangle, ChevronRight, Award, Info, X } from 'lucide-react';
import { Materia } from '../models/Materia';
import type { EstadoAcademicoUsuario, EstadoMateria } from '../types';
import { calcularProgresoCarrera } from '../functional/academicSelectors';

interface PlanEstudiosViewProps {
  materias: Materia[];
  estadoAcademico: EstadoAcademicoUsuario;
  onUpdateEstadoMateria: (codigo: string, nuevoEstado: EstadoMateria) => void;
}

export const PlanEstudiosView: React.FC<PlanEstudiosViewProps> = ({
  materias,
  estadoAcademico,
  onUpdateEstadoMateria
}) => {
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(1);
  const [materiaDetalle, setMateriaDetalle] = useState<Materia | null>(null);

  const progreso = calcularProgresoCarrera(materias, estadoAcademico);
  const materiasDelAnio = materias.filter(m => m.anio === anioSeleccionado);

  const estadoBadgeClass: Record<EstadoMateria, string> = {
    aprobada: 'badge-aprobada',
    regular: 'badge-regular',
    cursando: 'badge-cursando',
    pendiente: 'badge-pendiente'
  };

  const estadoTexto: Record<EstadoMateria, string> = {
    aprobada: 'Aprobada',
    regular: 'Regular',
    cursando: 'Cursando',
    pendiente: 'Pendiente'
  };

  return (
    <div className="view-container animate-fade-in">
      {/* Header del Plan de Estudios */}
      <div className="view-header-block">
        <div className="view-title-wrap">
          <GraduationCap className="text-unrn-red" size={24} />
          <div>
            <h2>Plan de Estudios</h2>
            <span className="view-subtitle">Ingeniería en Computación • Res. CSDEyVE 044/2019</span>
          </div>
        </div>

        {/* Tarjeta de Progreso Académico y Título Intermedio */}
        <div className="progress-summary-card">
          <div className="progress-card-col">
            <div className="progress-header-row">
              <span className="progress-title">Título de Grado: Ing. en Computación</span>
              <span className="progress-percent-chip">{progreso.porcentajeGrado}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill grado"
                style={{ width: `${progreso.porcentajeGrado}%` }}
              />
            </div>
            <span className="progress-stats-footnote">
              {progreso.aprobadasTotal} de {progreso.totalMaterias} materias ({progreso.horasAprobadas} de 3816 hs)
            </span>
          </div>

          <div className="progress-divider" />

          <div className="progress-card-col intermedio">
            <div className="progress-header-row">
              <span className="progress-title">
                <Award size={14} className="text-unrn-gold" />
                Título Intermedio: Téc. Universitario
              </span>
              <span className="progress-percent-chip gold">{progreso.porcentajeIntermedio}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill intermedio"
                style={{ width: `${progreso.porcentajeIntermedio}%` }}
              />
            </div>
            <span className="progress-stats-footnote">
              {progreso.aprobadasIntermedio} de {progreso.totalIntermedio} materias (3 años • 2272 hs)
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Años */}
      <div className="years-tabs-container">
        {[1, 2, 3, 4, 5].map(anio => (
          <button
            key={anio}
            className={`year-tab-btn ${anioSeleccionado === anio ? 'active' : ''}`}
            onClick={() => setAnioSeleccionado(anio)}
          >
            <span>{anio}° Año</span>
            {anio <= 3 && <span className="mini-badge-intermedio">Técnico</span>}
          </button>
        ))}
      </div>

      {/* Lista de Materias del Año Seleccionado */}
      <div className="materias-list">
        {materiasDelAnio.map(materia => {
          const estado = estadoAcademico[materia.codigoGuarani] || 'pendiente';
          const evaluacionCursar = materia.verificarHabilitacionCursado(estadoAcademico);
          const evaluacionFinal = materia.verificarHabilitacionFinal(estadoAcademico);

          return (
            <div
              key={materia.codigoGuarani}
              className={`materia-card ${estado}`}
            >
              <div className="materia-card-top">
                <div className="materia-header-left">
                  <span className="guarani-code">{materia.codigoGuarani}</span>
                  <span className="materia-order">N° {materia.nroOrden}</span>
                  <span className="cuatrimestre-tag">{materia.cuatrimestre}° Cuatrimestre</span>
                  <span className="hours-tag">{materia.horasTotales} hs</span>
                </div>

                {/* Selector rápido de estado académico */}
                <select
                  className={`status-select ${estadoBadgeClass[estado]}`}
                  value={estado}
                  onChange={e => onUpdateEstadoMateria(materia.codigoGuarani, e.target.value as EstadoMateria)}
                >
                  <option value="pendiente">{estadoTexto.pendiente}</option>
                  <option value="cursando">{estadoTexto.cursando}</option>
                  <option value="regular">{estadoTexto.regular}</option>
                  <option value="aprobada">{estadoTexto.aprobada}</option>
                </select>
              </div>

              <div className="materia-body">
                <h4 className="materia-title">{materia.nombre}</h4>

                {/* Diagnóstico reactivo de Correlativas */}
                <div className="correlativas-diagnosis">
                  {estado === 'aprobada' ? (
                    <div className="diagnosis-pill success">
                      <CheckCircle size={13} />
                      <span>Materia completada y aprobada</span>
                    </div>
                  ) : estado === 'cursando' ? (
                    <div className="diagnosis-pill info">
                      <Clock size={13} />
                      <span>Cursando actualmente</span>
                    </div>
                  ) : evaluacionCursar.habilitada ? (
                    <div className="diagnosis-pill success">
                      <CheckCircle size={13} />
                      <span>Habilitada para cursar en SIU Guaraní</span>
                    </div>
                  ) : (
                    <div className="diagnosis-pill warning">
                      <AlertTriangle size={13} />
                      <span>Bloqueada para cursar: {evaluacionCursar.correlativasFaltantes.join(', ')}</span>
                    </div>
                  )}

                  {estado === 'regular' && (
                    <div className={`diagnosis-pill ${evaluacionFinal.habilitada ? 'final-ready' : 'final-blocked'}`}>
                      <Info size={13} />
                      <span>
                        {evaluacionFinal.habilitada
                          ? 'Habilitada para rendir Examen Final'
                          : `Final bloqueado: requiere ${evaluacionFinal.faltantes.join(', ')}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="materia-footer">
                <button
                  className="btn-contents-detail"
                  onClick={() => setMateriaDetalle(materia)}
                >
                  <BookOpen size={14} />
                  <span>Ver contenidos mínimos y objetivos</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Contenidos Mínimos y Objetivos Oficiales */}
      {materiaDetalle && (
        <div className="modal-backdrop" onClick={() => setMateriaDetalle(null)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="guarani-code">{materiaDetalle.codigoGuarani} • {materiaDetalle.anio}° Año</span>
                <h3>{materiaDetalle.nombre}</h3>
              </div>
              <button className="close-btn" onClick={() => setMateriaDetalle(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="materia-modal-body">
              <div className="modal-meta-row">
                <div className="modal-meta-pill">
                  <span className="meta-lbl">Carga Semanal:</span>
                  <strong>{materiaDetalle.horasSemanales} hs</strong>
                </div>
                <div className="modal-meta-pill">
                  <span className="meta-lbl">Carga Total:</span>
                  <strong>{materiaDetalle.horasTotales} hs</strong>
                </div>
                <div className="modal-meta-pill">
                  <span className="meta-lbl">Cuatrimestre:</span>
                  <strong>{materiaDetalle.cuatrimestre}°</strong>
                </div>
              </div>

              {materiaDetalle.objetivos.length > 0 && (
                <div className="modal-detail-block">
                  <h4>Objetivos Pedagógicos</h4>
                  <ul>
                    {materiaDetalle.objetivos.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-detail-block">
                <h4>Contenidos Mínimos Oficiales</h4>
                <p className="contenidos-text">{materiaDetalle.contenidosMinimos}</p>
              </div>

              <div className="modal-detail-block">
                <h4>Régimen de Correlatividades</h4>
                <div className="correlativas-table">
                  <div className="correlativas-row">
                    <span className="corr-header">Regularizada para cursar:</span>
                    <span>{materiaDetalle.regularizadaParaCursar.join(', ') || 'Ninguna'}</span>
                  </div>
                  <div className="correlativas-row">
                    <span className="corr-header">Aprobada para cursar:</span>
                    <span>{materiaDetalle.aprobadaParaCursar.join(', ') || 'Ninguna'}</span>
                  </div>
                  <div className="correlativas-row">
                    <span className="corr-header">Aprobada para rendir final:</span>
                    <span>{materiaDetalle.aprobadaParaAprobar.join(', ') || 'Ninguna'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
