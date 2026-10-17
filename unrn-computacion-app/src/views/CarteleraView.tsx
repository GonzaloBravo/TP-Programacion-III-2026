import React, { useState } from 'react';
import { Bell, Heart, Pin, Plus, Check, X } from 'lucide-react';
import type { NovedadPost } from '../types';

interface CarteleraViewProps {
  novedades: NovedadPost[];
  onAgregarNovedad: (novedad: Omit<NovedadPost, 'id' | 'likes'>) => void;
  onLikeNovedad: (id: string) => void;
}

export const CarteleraView: React.FC<CarteleraViewProps> = ({
  novedades,
  onAgregarNovedad,
  onLikeNovedad
}) => {
  const [filtroMateria, setFiltroMateria] = useState<string>('Todas');
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);

  // Formulario nuevo aviso
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [nuevoAutor, setNuevoAutor] = useState('');
  const [nuevoRol, setNuevoRol] = useState<'Estudiante' | 'Docente'>('Estudiante');
  const [nuevaMateria, setNuevaMateria] = useState('General');

  // Obtener lista única de materias para el filtro
  const materiasFiltro = ['Todas', ...Array.from(new Set(novedades.map(n => n.nombreMateria || 'Institucional')))];

  const novedadesFiltradas = novedades.filter(n => {
    if (filtroMateria === 'Todas') return true;
    return (n.nombreMateria || 'Institucional') === filtroMateria;
  });

  const handleSubmitNuevoAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoContenido.trim() || !nuevoAutor.trim()) return;

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    onAgregarNovedad({
      titulo: nuevoTitulo,
      contenido: nuevoContenido,
      autor: nuevoAutor,
      rolAutor: nuevoRol,
      nombreMateria: nuevaMateria === 'General' ? undefined : nuevaMateria,
      fecha,
      hora,
      importante: nuevoRol === 'Docente'
    });

    setNuevoTitulo('');
    setNuevoContenido('');
    setNuevoAutor('');
    setModalAbierto(false);
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-block">
        <div className="view-title-wrap">
          <Bell className="text-unrn-red" size={24} />
          <div>
            <h2>Cartelera Virtual</h2>
            <span className="view-subtitle">Comunicaciones de Cátedras e Institucionales</span>
          </div>
        </div>

        <button className="btn-primary" onClick={() => setModalAbierto(true)}>
          <Plus size={16} />
          <span>Publicar Aviso</span>
        </button>
      </div>

      {/* Filtros de la cartelera */}
      <div className="chips-scroll-row">
        {materiasFiltro.map(mat => (
          <button
            key={mat}
            className={`chip-btn ${filtroMateria === mat ? 'active' : ''}`}
            onClick={() => setFiltroMateria(mat)}
          >
            {mat}
          </button>
        ))}
      </div>

      {/* Lista de Publicaciones */}
      <div className="novedades-feed">
        {novedadesFiltradas.map(nov => (
          <article key={nov.id} className={`novedad-card ${nov.importante ? 'pinned' : ''}`}>
            {nov.importante && (
              <div className="pinned-badge">
                <Pin size={12} />
                <span>Aviso Destacado</span>
              </div>
            )}

            <div className="novedad-card-header">
              <div className="author-meta">
                <div className={`avatar-circle ${nov.rolAutor === 'Docente' ? 'docente' : 'estudiante'}`}>
                  {nov.autor.charAt(0)}
                </div>
                <div>
                  <span className="author-name">{nov.autor}</span>
                  <div className="author-sub">
                    <span className="role-tag">{nov.rolAutor}</span>
                    {nov.nombreMateria && <span className="subject-tag">{nov.nombreMateria}</span>}
                  </div>
                </div>
              </div>

              <span className="post-date">{nov.fecha} {nov.hora}</span>
            </div>

            <div className="novedad-content">
              <h4>{nov.titulo}</h4>
              <p>{nov.contenido}</p>
            </div>

            <div className="novedad-footer">
              <button
                className="like-btn"
                onClick={() => onLikeNovedad(nov.id)}
                aria-label="Dar me gusta"
              >
                <Heart size={15} className="text-busy" fill={nov.likes > 20 ? '#EF4444' : 'none'} />
                <span>{nov.likes} me gusta</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Modal para Crear Publicación */}
      {modalAbierto && (
        <div className="modal-backdrop" onClick={() => setModalAbierto(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Publicar en la Cartelera Virtual</h3>
              <button className="close-btn" onClick={() => setModalAbierto(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitNuevoAviso} className="modal-form">
              <div className="form-group">
                <label>Tu Nombre o Cargo</label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Martín Vilugrón o Juan Pérez (Estudiante)"
                  value={nuevoAutor}
                  onChange={e => setNuevoAutor(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    value={nuevoRol}
                    onChange={e => setNuevoRol(e.target.value as any)}
                    className="select-input"
                  >
                    <option value="Estudiante">Estudiante</option>
                    <option value="Docente">Docente / Cátedra</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Materia vinculada</label>
                  <select
                    value={nuevaMateria}
                    onChange={e => setNuevaMateria(e.target.value)}
                    className="select-input"
                  >
                    <option value="General">Aviso General</option>
                    <option value="Programación I">Programación I</option>
                    <option value="Física General I">Física General I</option>
                    <option value="Electrónica Digital">Electrónica Digital</option>
                    <option value="Redes de Área Local y Extendida">Redes de Área Local</option>
                    <option value="Inteligencia Artificial">Inteligencia Artificial</option>
                    <option value="Sistemas Operativos I">Sistemas Operativos I</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Título del Aviso</label>
                <input
                  type="text"
                  placeholder="Ej: Cambio de aula para el examen parcial"
                  value={nuevoTitulo}
                  onChange={e => setNuevoTitulo(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contenido del Mensaje</label>
                <textarea
                  placeholder="Escribí los detalles del aviso..."
                  rows={4}
                  value={nuevoContenido}
                  onChange={e => setNuevoContenido(e.target.value)}
                  className="textarea-input"
                  required
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  <span>Publicar Ahora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
