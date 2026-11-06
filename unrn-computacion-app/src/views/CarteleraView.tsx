import React, { useState } from 'react';
import { Bell, Heart, Pin, Plus, Check, X, Lock, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import type { NovedadPost } from '../types';

interface CarteleraViewProps {
  novedades: NovedadPost[];
  onAgregarNovedad: (novedad: Omit<NovedadPost, 'id' | 'likes'>) => void;
  onLikeNovedad: (id: string) => void;
}

const CLAVE_CATEDRA_OFICIAL = 'unrn2026';

export const CarteleraView: React.FC<CarteleraViewProps> = ({
  novedades,
  onAgregarNovedad,
  onLikeNovedad
}) => {
  const [filtroMateria, setFiltroMateria] = useState<string>('Todas');
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);

  // Estado de autenticación docente (Alternativa 2: Validación por Clave de Cátedra / PIN)
  const [esDocente, setEsDocente] = useState<boolean>(() => {
    return localStorage.getItem('unrn_docente_autenticado') === 'true';
  });
  const [modalPinAbierto, setModalPinAbierto] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Formulario nuevo aviso
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [nuevoAutor, setNuevoAutor] = useState('');
  const [nuevaMateria, setNuevaMateria] = useState('General');

  // Obtener lista única de materias para el filtro
  const materiasFiltro = ['Todas', ...Array.from(new Set(novedades.map(n => n.nombreMateria || 'Institucional')))];

  const novedadesFiltradas = novedades.filter(n => {
    if (filtroMateria === 'Todas') return true;
    return (n.nombreMateria || 'Institucional') === filtroMateria;
  });

  // Validador de PIN / Clave de Cátedra
  const handleValidarPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().toLowerCase() === CLAVE_CATEDRA_OFICIAL.toLowerCase()) {
      setEsDocente(true);
      localStorage.setItem('unrn_docente_autenticado', 'true');
      setModalPinAbierto(false);
      setPinInput('');
      setPinError('');
      // Abrir inmediatamente el modal de publicar aviso
      setModalAbierto(true);
    } else {
      setPinError('Clave incorrecta. Solo docentes autorizados de la UNRN pueden emitir avisos.');
    }
  };

  const handleCerrarSesionDocente = () => {
    setEsDocente(false);
    localStorage.removeItem('unrn_docente_autenticado');
    setModalAbierto(false);
  };

  const handleSubmitNuevoAviso = (e: React.FormEvent) => {
    e.preventDefault();

    // Guard de seguridad: Solo docentes autenticados pueden publicar
    if (!esDocente) {
      alert('Acceso no autorizado: se requiere clave de cátedra para publicar avisos.');
      return;
    }

    if (!nuevoTitulo.trim() || !nuevoContenido.trim() || !nuevoAutor.trim()) return;

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    onAgregarNovedad({
      titulo: nuevoTitulo.trim(),
      contenido: nuevoContenido.trim(),
      autor: nuevoAutor.trim(),
      rolAutor: 'Docente',
      nombreMateria: nuevaMateria === 'General' ? undefined : nuevaMateria,
      fecha,
      hora,
      importante: true
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

        {/* Renderizado condicional: Solo visible si el docente validó su clave */}
        {esDocente ? (
          <div className="docente-header-actions">
            <button className="btn-primary" onClick={() => setModalAbierto(true)}>
              <Plus size={16} />
              <span>Publicar Aviso</span>
            </button>
            <button
              className="btn-exit-docente"
              onClick={handleCerrarSesionDocente}
              title="Cerrar sesión de docente y volver a modo estudiante"
            >
              <LogOut size={13} />
              <span>Salir</span>
            </button>
          </div>
        ) : (
          <button
            className="btn-docente-auth"
            onClick={() => {
              setPinError('');
              setPinInput('');
              setModalPinAbierto(true);
            }}
            title="Ingresar clave de cátedra para habilitar publicación"
          >
            <Lock size={14} />
            <span>Acceso Docente</span>
          </button>
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

      {/* Modal 1: Validación de Clave de Cátedra / PIN Docente */}
      {modalPinAbierto && (
        <div className="modal-backdrop" onClick={() => setModalPinAbierto(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <div className="lock-avatar-badge">
                  <Lock size={18} />
                </div>
                <div>
                  <h3>Acceso Exclusivo Docente</h3>
                  <span className="modal-subtitle">Permiso de Publicación de Cátedra</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setModalPinAbierto(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleValidarPin} className="modal-form">
              <p className="pin-description">
                Para redactar y publicar comunicados oficiales en la Cartelera Universitaria, ingresá la <strong>Clave de Cátedra institucional</strong>:
              </p>

              <div className="form-group">
                <label htmlFor="input-pin-catedra">Clave / PIN Institucional</label>
                <input
                  id="input-pin-catedra"
                  type="password"
                  placeholder="Ingresá la clave de cátedra..."
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  className={`text-input ${pinError ? 'input-error' : ''}`}
                  autoFocus
                  required
                />

                {pinError && (
                  <div className="form-error-msg">
                    <AlertCircle size={14} />
                    <span>{pinError}</span>
                  </div>
                )}

                <span className="input-hint">
                  💡 <strong>Clave para evaluación de TP:</strong> <code>unrn2026</code>
                </span>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalPinAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  <span>Validar y Continuar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Crear Publicación (Solo accesible para Docentes autenticados) */}
      {modalAbierto && esDocente && (
        <div className="modal-backdrop" onClick={() => setModalAbierto(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
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
              <div className="form-group">
                <label>Nombre del Docente / Cátedra</label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Lucas Albornoz, Lic. Claudia Lemus..."
                  value={nuevoAutor}
                  onChange={e => setNuevoAutor(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

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
                    <option value="Programación I">Programación I</option>
                    <option value="Programación III">Programación III</option>
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
        </div>
      )}
    </div>
  );
};
