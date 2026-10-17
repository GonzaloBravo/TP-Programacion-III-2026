import React, { useState } from 'react';
import { CalendarDays, Clock, MapPin, User, AlertTriangle, Check, BookPlus } from 'lucide-react';
import { HorarioCursada } from '../models/HorarioCursada';
import { agruparHorariosPorDia, detectarConflictosHorarios } from '../functional/academicSelectors';

interface AgendaViewProps {
  todosLosHorarios: HorarioCursada[];
  horariosSeleccionados: HorarioCursada[];
  onToggleComision: (horario: HorarioCursada) => void;
  diaActual: string;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  todosLosHorarios,
  horariosSeleccionados,
  onToggleComision,
  diaActual
}) => {
  const [vistaModo, setVistaModo] = useState<'semanal' | 'hoy' | 'comisiones'>('semanal');

  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const horariosPorDia = agruparHorariosPorDia(horariosSeleccionados);
  const conflictos = detectarConflictosHorarios(horariosSeleccionados);

  // Agrupar todas las comisiones disponibles por materia
  const materiasAgrupadas = todosLosHorarios.reduce((acc, h) => {
    if (!acc[h.codigoMateria]) {
      acc[h.codigoMateria] = {
        codigo: h.codigoMateria,
        nombre: h.nombreMateria,
        anio: h.anio,
        comisiones: []
      };
    }
    acc[h.codigoMateria].comisiones.push(h);
    return acc;
  }, {} as Record<string, { codigo: string; nombre: string; anio: number; comisiones: HorarioCursada[] }>);

  const horasSemanalesTotales = horariosSeleccionados.reduce((total, h) => {
    const [hD, mD] = h.horaDesde.split(':').map(Number);
    const [hH, mH] = h.horaHasta.split(':').map(Number);
    const dur = (hH * 60 + mH - (hD * 60 + mD)) / 60;
    return total + dur;
  }, 0);

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-block">
        <div className="view-title-wrap">
          <CalendarDays className="text-unrn-red" size={24} />
          <div>
            <h2>Agenda Personalizada</h2>
            <span className="view-subtitle">Mis Cursadas • 2° Cuatrimestre 2026</span>
          </div>
        </div>

        {/* Resumen de Cursada Personal */}
        <div className="agenda-summary-card">
          <div className="agenda-stat-col">
            <span className="stat-label">Clases semanales</span>
            <strong className="stat-value">{horariosSeleccionados.length}</strong>
          </div>
          <div className="agenda-stat-col">
            <span className="stat-label">Carga horaria</span>
            <strong className="stat-value">{horasSemanalesTotales} hs/sem</strong>
          </div>
          <div className="agenda-stat-col">
            <span className="stat-label">Conflictos</span>
            <strong className={`stat-value ${conflictos.length > 0 ? 'text-busy' : 'text-emerald'}`}>
              {conflictos.length === 0 ? '0 choques' : `${conflictos.length} choques`}
            </strong>
          </div>
        </div>
      </div>

      {/* Alerta de Conflicto de Horarios si existe */}
      {conflictos.length > 0 && (
        <div className="conflict-alert-card">
          <AlertTriangle size={18} className="text-busy" />
          <div className="conflict-text">
            <strong>¡Atención! Conflicto de superposición horaria detectado:</strong>
            {conflictos.map((c, i) => (
              <p key={i}>
                • {c.clase1.nombreMateria} ({c.clase1.comision}) coincide con {c.clase2.nombreMateria} ({c.clase2.comision}) los {c.clase1.diaSemana}.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Selector de Pestañas de Vista */}
      <div className="segmented-control">
        <button
          className={`segment-btn ${vistaModo === 'semanal' ? 'active' : ''}`}
          onClick={() => setVistaModo('semanal')}
        >
          Semana Completa
        </button>
        <button
          className={`segment-btn ${vistaModo === 'hoy' ? 'active' : ''}`}
          onClick={() => setVistaModo('hoy')}
        >
          Mi Día ({diaActual.toUpperCase()})
        </button>
        <button
          className={`segment-btn ${vistaModo === 'comisiones' ? 'active' : ''}`}
          onClick={() => setVistaModo('comisiones')}
        >
          Elegir Comisiones
        </button>
      </div>

      {/* Vista 1: Cronograma Semanal */}
      {vistaModo === 'semanal' && (
        <div className="weekly-schedule-container">
          {dias.map(dia => {
            const clasesDelDia = horariosPorDia[dia] || [];
            const esHoy = dia.toLowerCase() === diaActual.toLowerCase();

            return (
              <div key={dia} className={`day-column-card ${esHoy ? 'is-today' : ''}`}>
                <div className="day-header-row">
                  <span className="day-name">{dia.toUpperCase()}</span>
                  {esHoy && <span className="today-badge">Hoy</span>}
                  <span className="classes-count">{clasesDelDia.length} clases</span>
                </div>

                <div className="day-classes-list">
                  {clasesDelDia.length > 0 ? (
                    clasesDelDia.map(clase => (
                      <div key={clase.id} className="schedule-class-pill">
                        <div className="class-time-block">
                          <span className="time-start">{clase.horaDesde}</span>
                          <span className="time-end">{clase.horaHasta}</span>
                        </div>
                        <div className="class-pill-body">
                          <div className="pill-title-row">
                            <strong>{clase.nombreMateria}</strong>
                            <span className="pill-comision">{clase.comision}</span>
                          </div>
                          <div className="pill-location">
                            <MapPin size={11} />
                            <span>{clase.aula} ({clase.lugar.replace('Malvinas Argentinas ', '')})</span>
                          </div>
                          <span className="pill-docente">{clase.docente}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-classes-day">
                      <span>Sin actividades agendadas</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista 2: Mi Día Hoy */}
      {vistaModo === 'hoy' && (
        <div className="today-schedule-container">
          <div className="today-hero-box">
            <h3>Tus clases de hoy ({diaActual.toUpperCase()})</h3>
            <p>Tenés {(horariosPorDia[diaActual.toLowerCase()] || []).length} clases en tu cronograma.</p>
          </div>

          <div className="today-timeline">
            {(horariosPorDia[diaActual.toLowerCase()] || []).length > 0 ? (
              horariosPorDia[diaActual.toLowerCase()].map(clase => (
                <div key={clase.id} className="today-timeline-card">
                  <div className="time-column">
                    <Clock size={16} className="text-unrn-red" />
                    <span className="time-range">{clase.horaDesde} - {clase.horaHasta}</span>
                    <span className="duration-tag">{clase.duracion} hs</span>
                  </div>

                  <div className="timeline-body">
                    <div className="timeline-header">
                      <h4>{clase.nombreMateria}</h4>
                      <span className="comision-tag">{clase.comision}</span>
                    </div>
                    <div className="timeline-meta-row">
                      <span><MapPin size={13} /> {clase.aula} • {clase.lugar}</span>
                    </div>
                    <div className="timeline-meta-row">
                      <span><User size={13} /> Docente: {clase.docente}</span>
                    </div>
                    {clase.observaciones && (
                      <div className="timeline-note">
                        <em>Nota: {clase.observaciones}</em>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-results-box">
                <Check size={32} className="text-emerald" />
                <p>¡No tenés clases agendadas para hoy!</p>
                <button className="btn-secondary" onClick={() => setVistaModo('comisiones')}>
                  Inscribirse a comisiones
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista 3: Elegir Comisiones */}
      {vistaModo === 'comisiones' && (
        <div className="comisiones-selection-container">
          <p className="section-instructions">
            Marcá o desmarcá las comisiones en las que cursás para armar tu cronograma personalizado:
          </p>

          <div className="comisiones-by-materia">
            {Object.values(materiasAgrupadas).map(mat => (
              <div key={mat.codigo} className="materia-comisiones-card">
                <div className="card-materia-header">
                  <div>
                    <span className="guarani-code">{mat.codigo} • {mat.anio}° Año</span>
                    <h4>{mat.nombre}</h4>
                  </div>
                </div>

                <div className="comisiones-buttons-grid">
                  {mat.comisiones.map(com => {
                    const estaSeleccionada = horariosSeleccionados.some(h => h.id === com.id);

                    return (
                      <button
                        key={com.id}
                        className={`comision-select-pill ${estaSeleccionada ? 'selected' : ''}`}
                        onClick={() => onToggleComision(com)}
                      >
                        <div className="pill-check-indicator">
                          {estaSeleccionada ? <Check size={14} /> : <BookPlus size={14} />}
                        </div>
                        <div className="pill-info-block">
                          <span className="comision-id">
                            Comisión {com.comision} ({com.diaSemana.toUpperCase()} {com.horaDesde}-{com.horaHasta})
                          </span>
                          <span className="comision-venue">
                            {com.aula} • Docente: {com.docente}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
