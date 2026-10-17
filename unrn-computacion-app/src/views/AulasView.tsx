import React, { useState } from 'react';
import { School, Clock, MapPin, User, Search, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import type { HoraSimulada } from '../async/timeSimulator';
import { Aula, type EstadoOcupacionAula } from '../models/Aula';
import { HorarioCursada } from '../models/HorarioCursada';
import { calcularOcupacionDeAulas } from '../functional/academicSelectors';

interface AulasViewProps {
  aulas: Aula[];
  horarios: HorarioCursada[];
  horaInfo: HoraSimulada;
  onOpenSimulador: () => void;
}

export const AulasView: React.FC<AulasViewProps> = ({
  aulas,
  horarios,
  horaInfo,
  onOpenSimulador
}) => {
  const [filtroSede, setFiltroSede] = useState<string>('Todas');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'ocupadas' | 'disponibles'>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Cálculo funcional reactivo de ocupación
  const estadosAulas: EstadoOcupacionAula[] = calcularOcupacionDeAulas(
    aulas,
    horarios,
    horaInfo.dia,
    horaInfo.minutosDesdeMedianoche
  );

  const sedesDisponibles = [
    'Todas',
    'Malvinas Argentinas (Anasagasti 2)',
    'Heroes de Malvinas (Anasagasti I)',
    'Tacuari 150',
    'Virtual'
  ];

  const aulasFiltradas = estadosAulas.filter(a => {
    // Filtro por sede
    if (filtroSede !== 'Todas' && a.sede !== filtroSede) return false;

    // Filtro por estado
    if (filtroEstado === 'ocupadas' && a.estado !== 'ocupada') return false;
    if (filtroEstado === 'disponibles' && a.estado !== 'disponible') return false;

    // Búsqueda por nombre de aula o materia actual
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchAula = a.nombreAula.toLowerCase().includes(term);
      const matchMateria = a.claseActual?.nombreMateria.toLowerCase().includes(term) ?? false;
      const matchDocente = a.claseActual?.docente.toLowerCase().includes(term) ?? false;
      return matchAula || matchMateria || matchDocente;
    }

    return true;
  });

  const totalOcupadas = estadosAulas.filter(a => a.estado === 'ocupada').length;
  const totalDisponibles = estadosAulas.filter(a => a.estado === 'disponible').length;

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-block">
        <div className="view-title-wrap">
          <School className="text-unrn-red" size={24} />
          <div>
            <h2>Estado de Aulas en Tiempo Real</h2>
            <span className="view-subtitle">Sede Andina • San Carlos de Bariloche</span>
          </div>
        </div>

        {/* Barra de tiempo actual y simulador */}
        <div className="time-banner-card">
          <div className="time-banner-info">
            <Clock size={16} className="text-unrn-red" />
            <div>
              <strong>{horaInfo.dia.toUpperCase()} — {horaInfo.horaTexto} HS</strong>
              <p>{totalOcupadas} aulas con clases en curso • {totalDisponibles} aulas libres</p>
            </div>
          </div>
          <button className="change-time-btn" onClick={onOpenSimulador}>
            <Sparkles size={14} />
            <span>Simular Horario</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="filter-controls-card">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por aula, materia o docente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Chips de Sede */}
        <div className="chips-scroll-row">
          {sedesDisponibles.map(sede => (
            <button
              key={sede}
              className={`chip-btn ${filtroSede === sede ? 'active' : ''}`}
              onClick={() => setFiltroSede(sede)}
            >
              {sede.replace('Malvinas Argentinas ', '').replace('Heroes de Malvinas ', '')}
            </button>
          ))}
        </div>

        {/* Segmented control para Estado */}
        <div className="segmented-control">
          <button
            className={`segment-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('todos')}
          >
            Todas ({estadosAulas.length})
          </button>
          <button
            className={`segment-btn ${filtroEstado === 'ocupadas' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('ocupadas')}
          >
            En Curso ({totalOcupadas})
          </button>
          <button
            className={`segment-btn ${filtroEstado === 'disponibles' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('disponibles')}
          >
            Libres ({totalDisponibles})
          </button>
        </div>
      </div>

      {/* Grid de Aulas */}
      <div className="aulas-grid">
        {aulasFiltradas.length > 0 ? (
          aulasFiltradas.map(aula => {
            const esOcupada = aula.estado === 'ocupada';
            const esVirtual = aula.estado === 'virtual';

            return (
              <div
                key={aula.aulaId}
                className={`aula-card ${esOcupada ? 'card-busy' : esVirtual ? 'card-virtual' : 'card-available'}`}
              >
                <div className="aula-card-header">
                  <div className="aula-identity">
                    <span className="aula-name">{aula.nombreAula}</span>
                    <span className="aula-location">
                      <MapPin size={12} /> {aula.sede}
                    </span>
                  </div>

                  <div className="aula-status-pill">
                    {esOcupada && (
                      <span className="status-badge busy">
                        <span className="pulse-dot red" />
                        EN CURSO
                      </span>
                    )}
                    {!esOcupada && !esVirtual && (
                      <span className="status-badge available">
                        <CheckCircle2 size={12} />
                        DISPONIBLE
                      </span>
                    )}
                    {esVirtual && (
                      <span className="status-badge virtual">
                        VIRTUAL
                      </span>
                    )}
                  </div>
                </div>

                {/* Si está ocupada, detalle de la clase en curso */}
                {esOcupada && aula.claseActual && (
                  <div className="current-class-box">
                    <div className="current-class-title-row">
                      <h4>{aula.claseActual.nombreMateria}</h4>
                      <span className="comision-tag">{aula.claseActual.comision}</span>
                    </div>

                    <div className="class-schedule-line">
                      <Clock size={13} />
                      <span>{aula.claseActual.horaDesde} a {aula.claseActual.horaHasta} hs</span>
                      {aula.minutosRestantesClaseActual !== undefined && (
                        <span className="remaining-time">
                          (Resta {Math.floor(aula.minutosRestantesClaseActual / 60)}h {aula.minutosRestantesClaseActual % 60}m)
                        </span>
                      )}
                    </div>

                    <div className="class-teacher-line">
                      <User size={13} />
                      <span>Docente: <strong>{aula.claseActual.docente}</strong></span>
                    </div>

                    {aula.claseActual.auxiliar && (
                      <div className="class-aux-line">
                        <span>Auxiliar: {aula.claseActual.auxiliar}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Si está disponible */}
                {!esOcupada && (
                  <div className="available-room-box">
                    {aula.proximaClase ? (
                      <div className="next-class-preview">
                        <span className="next-class-label">Próxima clase programada:</span>
                        <div className="next-class-name">
                          <strong>{aula.proximaClase.nombreMateria} ({aula.proximaClase.comision})</strong>
                        </div>
                        <span className="next-class-time">
                          A las {aula.proximaClase.horaDesde} hs • Por {aula.proximaClase.docente}
                        </span>
                      </div>
                    ) : (
                      <div className="free-day-message">
                        <CheckCircle2 size={16} className="text-emerald" />
                        <span>Espacio libre sin más actividades programadas hoy</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-results-box">
            <AlertCircle size={28} className="text-muted" />
            <p>No se encontraron aulas con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};
