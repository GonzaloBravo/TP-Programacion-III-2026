import React, { useState } from 'react';
import { Calendar, Search, AlertCircle, FileText } from 'lucide-react';
import { EventoCalendario } from '../models/EventoCalendario';
import type { CategoriaEvento } from '../types';

interface CalendarioViewProps {
  eventos: EventoCalendario[];
}

export const CalendarioView: React.FC<CalendarioViewProps> = ({ eventos }) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categorias = [
    { id: 'todos', label: 'Todos los Hitos' },
    { id: 'examen', label: 'Mesas de Examen' },
    { id: 'cursada', label: 'Ventanas de Cursado' },
    { id: 'inscripcion', label: 'Inscripciones' },
    { id: 'institucional', label: 'Feriados UNRN' },
    { id: 'receso', label: 'Recesos' }
  ];

  const eventosFiltrados = eventos.filter(ev => {
    if (categoriaFiltro !== 'todos' && ev.categoria !== categoriaFiltro) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return ev.titulo.toLowerCase().includes(q) || ev.fechaTexto.includes(q);
    }
    return true;
  });

  const getBadgeStyle = (cat: CategoriaEvento) => {
    switch (cat) {
      case 'examen': return 'badge-cat-examen';
      case 'cursada': return 'badge-cat-cursada';
      case 'inscripcion': return 'badge-cat-inscripcion';
      case 'institucional': return 'badge-cat-institucional';
      case 'receso': return 'badge-cat-receso';
      default: return 'badge-cat-general';
    }
  };

  const getCategoryLabel = (cat: CategoriaEvento) => {
    switch (cat) {
      case 'examen': return 'Examen Final';
      case 'cursada': return 'Ciclo Lectivo';
      case 'inscripcion': return 'Inscripción';
      case 'institucional': return 'Feriado UNRN';
      case 'receso': return 'Receso';
      default: return 'Hito Académico';
    }
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-block">
        <div className="view-title-wrap">
          <Calendar className="text-unrn-red" size={24} />
          <div>
            <h2>Calendario Académico 2026</h2>
            <span className="view-subtitle">Resolución CSDEyVE N° 038/2024 • UNRN Sede Andina</span>
          </div>
        </div>

        {/* Búsqueda rápida */}
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar fecha o evento (ej. 'julio', 'inscripción')..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Chips de Categorías */}
      <div className="chips-scroll-row">
        {categorias.map(c => (
          <button
            key={c.id}
            className={`chip-btn ${categoriaFiltro === c.id ? 'active' : ''}`}
            onClick={() => setCategoriaFiltro(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Timeline de Eventos */}
      <div className="calendar-timeline">
        {eventosFiltrados.length > 0 ? (
          eventosFiltrados.map((ev, index) => {
            const diasFaltan = ev.diasRestantes();

            return (
              <div key={ev.id || index} className="calendar-event-card">
                <div className="event-date-column">
                  <div className="date-icon-box">
                    <Calendar size={18} className="text-unrn-red" />
                  </div>
                  <span className="date-main-text">{ev.fechaTexto}</span>
                  {diasFaltan > 0 && diasFaltan <= 60 && (
                    <span className="countdown-pill">En {diasFaltan}d</span>
                  )}
                </div>

                <div className="event-content-column">
                  <div className="event-category-row">
                    <span className={`event-category-pill ${getBadgeStyle(ev.categoria)}`}>
                      {getCategoryLabel(ev.categoria)}
                    </span>
                    {ev.resolucion && (
                      <span className="resolution-tag">
                        <FileText size={10} /> {ev.resolucion}
                      </span>
                    )}
                  </div>

                  <h4 className="event-title">{ev.titulo}</h4>
                  {ev.descripcion && <p className="event-desc">{ev.descripcion}</p>}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-results-box">
            <AlertCircle size={28} className="text-muted" />
            <p>No se encontraron eventos para el filtro seleccionado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
