/** Presenta los avisos y permite publicar a usuarios con rol docente. */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Heart, Pin, Plus, Check, X, ShieldCheck } from 'lucide-react';
import type { NovedadPost } from '../types';
import type { Materia } from '../models/Materia';

interface CarteleraViewProps {
  materias: Materia[];
  novedades: NovedadPost[];
  onAgregarNovedad: (novedad: Omit<NovedadPost, 'id' | 'likes'>) => void;
  onLikeNovedad: (id: string) => void;
  rolUsuario: 'alumno' | 'docente';
  nombreUsuario: string;
}

export const CarteleraView: React.FC<CarteleraViewProps> = ({
  materias,
  novedades,
  onAgregarNovedad,
  onLikeNovedad,
  rolUsuario,
  nombreUsuario
}) => {
  const [filtroMateria, setFiltroMateria] = useState<string>('Todas');
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);

  // Formulario nuevo aviso
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [nuevaMateria, setNuevaMateria] = useState('General');
  const esDocente = rolUsuario === 'docente';

  // Obtener lista única de materias para el filtro
  const materiasFiltro = ['Todas', ...Array.from(new Set(novedades.map(n => n.nombreMateria || 'Institucional')))];

  const novedadesFiltradas = novedades.filter(n => {
    if (filtroMateria === 'Todas') return true;
    return (n.nombreMateria || 'Institucional') === filtroMateria;
  });

  const handleSubmitNuevoAviso = (e: React.FormEvent) => {
    e.preventDefault();

    if (rolUsuario !== 'docente') return;
    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) return;

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    onAgregarNovedad({
      titulo: nuevoTitulo.trim(),
      contenido: nuevoContenido.trim(),
      autor: nombreUsuario,
      rolAutor: 'Docente',
      nombreMateria: nuevaMateria === 'General' ? undefined : nuevaMateria,
      fecha,
      hora,
      importante: true
    });

    setNuevoTitulo('');
    setNuevoContenido('');
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

        {/* El rol proviene de la sesión validada por el backend. */}
        {esDocente ? (
          <button className="btn-primary" onClick={() => setModalAbierto(true)}>
            <Plus size={16} />
            <span>Publicar Aviso</span>
          </button>
        ) : (
          <span className="student-cartelera-notice">Publicación disponible para cuentas docentes.</span>
        )}
      </div>

      {/* Indicador de estado de la sesión */}
      {esDocente ? (
        <div className="docente-status-bar">
          <ShieldCheck size={16} />
          <span>Sesión Docente Activa • Permisos de publicación de cátedra habilitados</span>
        </div>
      ) : (
        <div className="student-cartelera-notice">
          <span>📌 La publicación de comunicados oficiales está reservada al cuerpo docente.</span>
        </div>
      )}

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
        {novedadesFiltradas.length === 0 ? (
          <div className="empty-cartelera-notice" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.4rem' }}>No hay avisos publicados en la cartelera en este momento.</p>
            {esDocente ? (
              <p style={{ fontSize: '0.85rem' }}>
                Como docente, podés presionar <strong>"Publicar Aviso"</strong> para redactar un comunicado para los estudiantes.
              </p>
            ) : (
              <p style={{ fontSize: '0.85rem' }}>
                Los avisos y comunicados oficiales aparecerán aquí cuando los docentes de las cátedras realicen una publicación.
              </p>
            )}
          </div>
        ) : (
          novedadesFiltradas.map(nov => (
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
          ))
        )}
      </div>

      {/* Modal 2: Crear Publicación (Solo accesible para Docentes autenticados) */}
      {modalAbierto && esDocente && createPortal(
        <div className="modal-backdrop publication-modal-backdrop" onClick={() => setModalAbierto(false)}>
          <div className="modal-content glass-panel animate-fade-in publication-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <div className="lock-avatar-badge">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3>Publicar en la Cartelera Virtual</h3>
                  <span className="modal-subtitle">Comunicado Docente Oficial</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setModalAbierto(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitNuevoAviso} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Rol Autor</label>
                  <div className="role-locked-badge">
                    <ShieldCheck size={14} className="text-emerald" />
                    <span>Docente / Cátedra Oficial (Verificado)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Materia vinculada</label>
                  <select
                    value={nuevaMateria}
                    onChange={e => setNuevaMateria(e.target.value)}
                    className="select-input"
                  >
                    <option value="General">Aviso General</option>
                    {materias.map(materia => (
                      <option key={materia.codigoGuarani} value={materia.nombre}>
                        {materia.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Título del Aviso</label>
                <input
                  type="text"
                  placeholder="Ej: Modificación de fecha de examen parcial o consulta"
                  value={nuevoTitulo}
                  onChange={e => setNuevoTitulo(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contenido del Mensaje</label>
                <textarea
                  placeholder="Escribí los detalles del comunicado oficial..."
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
        </div>,
        document.body
      )}
    </div>
  );
};
