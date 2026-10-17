import React from 'react';
import { School, GraduationCap, Calendar, Bell, BotMessageSquare, ArrowRight, Clock, MapPin, Sparkles } from 'lucide-react';
import type { TabId } from '../components/BottomNav';
import type { HoraSimulada } from '../async/timeSimulator';
import type { HorarioCursada } from '../models/HorarioCursada';
import type { Materia } from '../models/Materia';
import type { EstadoAcademicoUsuario } from '../types';
import { CALENDARIO_DATA } from '../data/calendarioData';
import { NOVEDADES_INICIALES } from '../data/carteleraData';
import { calcularProgresoCarrera } from '../functional/academicSelectors';

interface InicioViewProps {
  onNavigate: (tab: TabId) => void;
  horaInfo: HoraSimulada;
  clasesEnCurso: HorarioCursada[];
  materias: Materia[];
  estadoAcademico: EstadoAcademicoUsuario;
  onOpenSimulador: () => void;
}

export const InicioView: React.FC<InicioViewProps> = ({
  onNavigate,
  horaInfo,
  clasesEnCurso,
  materias,
  estadoAcademico,
  onOpenSimulador
}) => {
  const progreso = calcularProgresoCarrera(materias, estadoAcademico);
  const proximoEvento = CALENDARIO_DATA[4] || CALENDARIO_DATA[0]; // Hito de examen próximo
  const ultimaNovedad = NOVEDADES_INICIALES[0];

  return (
    <div className="view-container animate-fade-in">
      {/* Banner de Bienvenida Institucional */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-tag">
            <Sparkles size={13} />
            <span>Sede Andina • Bariloche</span>
          </div>
          <h2>Ingeniería en Computación</h2>
          <p>Universidad Nacional de Río Negro</p>
        </div>

        <div className="hero-stats-row">
          <div className="stat-pill">
            <span className="stat-number">{progreso.porcentajeGrado}%</span>
            <span className="stat-label">Grado</span>
          </div>
          <div className="stat-pill highlight">
            <span className="stat-number">{progreso.porcentajeIntermedio}%</span>
            <span className="stat-label">Téc. Intermedio</span>
          </div>
          <div className="stat-pill">
            <span className="stat-number">{progreso.aprobadasTotal}</span>
            <span className="stat-label">Aprobadas</span>
          </div>
        </div>
      </div>

      {/* Widget En Vivo: ¿Qué está sucediendo en las aulas ahora? */}
      <section className="dashboard-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <School size={18} className="text-unrn-red" />
            <h3>Aulas en Tiempo Real</h3>
          </div>
          <button className="section-link-btn" onClick={() => onNavigate('aulas')}>
            Ver todas <ArrowRight size={14} />
          </button>
        </div>

        <div className="live-status-card" onClick={() => onNavigate('aulas')}>
          <div className="live-card-top">
            <div className="live-badge-wrapper">
              <span className={`pulse-dot-indicator ${clasesEnCurso.length > 0 ? 'active' : 'idle'}`} />
              <span className="live-badge-text">
                {clasesEnCurso.length > 0 ? `${clasesEnCurso.length} CLASE(S) EN CURSO` : 'SIN CLASES EN ESTE MOMENTO'}
              </span>
            </div>
            <span className="live-time-chip">{horaInfo.horaTexto} hs</span>
          </div>

          {clasesEnCurso.length > 0 ? (
            <div className="live-classes-preview">
              {clasesEnCurso.slice(0, 2).map((c, i) => (
                <div key={i} className="live-class-item">
                  <div className="class-indicator-bar" />
                  <div className="class-details">
                    <span className="class-subject-title">{c.nombreMateria} ({c.comision})</span>
                    <div className="class-meta">
                      <span className="class-room">
                        <MapPin size={12} /> {c.aula}
                      </span>
                      <span className="class-teacher">
                        Docente: {c.docente}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {clasesEnCurso.length > 2 && (
                <span className="more-classes-hint">+ {clasesEnCurso.length - 2} clases más activas</span>
              )}
            </div>
          ) : (
            <div className="empty-live-state">
              <p>No hay clases dictándose ahora en las sedes Anasagasti 1 y 2.</p>
              <button
                className="test-time-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSimulador();
                }}
              >
                <Clock size={13} />
                <span>Simular horario con clases activas</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Accesos Rápidos Principales */}
      <section className="dashboard-section">
        <h3 className="section-subtitle">Accesos Rápidos</h3>
        <div className="quick-access-grid">
          <button className="quick-card" onClick={() => onNavigate('plan')}>
            <div className="quick-icon-wrap bg-blue-soft">
              <GraduationCap size={22} className="text-blue" />
            </div>
            <div className="quick-info">
              <h4>Plan de Estudios</h4>
              <span>Correlatividades y avance</span>
            </div>
          </button>

          <button className="quick-card" onClick={() => onNavigate('chat')}>
            <div className="quick-icon-wrap bg-purple-soft">
              <BotMessageSquare size={22} className="text-purple" />
            </div>
            <div className="quick-info">
              <h4>Asistente IA</h4>
              <span>Consultas rápidas 24/7</span>
            </div>
          </button>

          <button className="quick-card" onClick={() => onNavigate('agenda')}>
            <div className="quick-icon-wrap bg-emerald-soft">
              <Calendar size={22} className="text-emerald" />
            </div>
            <div className="quick-info">
              <h4>Mi Agenda</h4>
              <span>Horarios semanales</span>
            </div>
          </button>

          <button className="quick-card" onClick={() => onNavigate('cartelera')}>
            <div className="quick-icon-wrap bg-amber-soft">
              <Bell size={22} className="text-amber" />
            </div>
            <div className="quick-info">
              <h4>Cartelera</h4>
              <span>Avisos de cátedra</span>
            </div>
          </button>
        </div>
      </section>

      {/* Próximo Hito del Calendario */}
      {proximoEvento && (
        <section className="dashboard-section">
          <div className="section-header">
            <div className="section-title-wrap">
              <Calendar size={18} className="text-unrn-red" />
              <h3>Próximo Hito Académico</h3>
            </div>
            <button className="section-link-btn" onClick={() => onNavigate('calendario')}>
              Calendario <ArrowRight size={14} />
            </button>
          </div>

          <div className="calendar-event-card" onClick={() => onNavigate('calendario')} style={{ cursor: 'pointer' }}>
            <div className="event-date-column">
              <div className="date-icon-box">
                <Calendar size={18} className="text-unrn-red" />
              </div>
              <span className="date-main-text">{proximoEvento.fechaTexto}</span>
            </div>
            <div className="event-content-column">
              <span className="event-category-pill badge-cat-examen">Examen</span>
              <h4 className="event-title">{proximoEvento.titulo}</h4>
              <p className="event-desc">Calendario Oficial UNRN 2026</p>
            </div>
          </div>
        </section>
      )}

      {/* Cartelera Destacada */}
      <section className="dashboard-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <Bell size={18} className="text-unrn-red" />
            <h3>Último Aviso de Cátedra</h3>
          </div>
          <button className="section-link-btn" onClick={() => onNavigate('cartelera')}>
            Cartelera <ArrowRight size={14} />
          </button>
        </div>

        <div className="notice-highlight-card" onClick={() => onNavigate('cartelera')}>
          <div className="notice-card-header">
            <span className="notice-author-badge">{ultimaNovedad.rolAutor}</span>
            <span className="notice-date">{ultimaNovedad.fecha}</span>
          </div>
          <h4>{ultimaNovedad.titulo}</h4>
          <p>{ultimaNovedad.contenido}</p>
          <div className="notice-footer-meta">
            <span>Por: <strong>{ultimaNovedad.autor}</strong></span>
          </div>
        </div>
      </section>
    </div>
  );
};
