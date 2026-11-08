/** Coordina las pantallas, los datos compartidos y la sesion del usuario. */
import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { Header } from './components/Header';
import { BottomNav, type TabId } from './components/BottomNav';
import { SimuladorModal } from './components/SimuladorModal';
import { InicioView } from './views/InicioView';
import { AulasView } from './views/AulasView';
import { PlanEstudiosView } from './views/PlanEstudiosView';
import { AgendaView } from './views/AgendaView';
import { CarteleraView } from './views/CarteleraView';
import { CalendarioView } from './views/CalendarioView';
import { ChatIAView } from './views/ChatIAView';
import { LoginView } from './components/LoginView';
import {
  cerrarSesion,
  guardarEstadoMateria,
  guardarAgenda,
  obtenerAgenda,
  obtenerProgreso,
  ErrorApi,
  type SesionAutenticada,
} from './services/authApi';

// Models
import { Materia } from './models/Materia';
import { Aula } from './models/Aula';
import { HorarioCursada } from './models/HorarioCursada';
import { EventoCalendario } from './models/EventoCalendario';

// Data
import { MATERIAS_DATA } from './data/carreraData';
import { AULAS_DATA, HORARIOS_DATA } from './data/horariosData';
import { CALENDARIO_DATA } from './data/calendarioData';
import { NOVEDADES_INICIALES } from './data/carteleraData';

// Async time simulator
import { timeSimulator, type HoraSimulada } from './async/timeSimulator';
import type { EstadoAcademicoUsuario, EstadoMateria, NovedadPost } from './types';

/** Mantiene el estado general y muestra el acceso o la aplicacion autenticada. */
export function App() {
  const [sesion, setSesion] = useState<SesionAutenticada | null>(null);
  const [estadoAcademico, setEstadoAcademico] = useState<EstadoAcademicoUsuario>({});
  const [agendaIds, setAgendaIds] = useState<string[]>([]);
  const [progresoCargando, setProgresoCargando] = useState(false);
  const [errorCargaProgreso, setErrorCargaProgreso] = useState<string | null>(null);
  const [errorGuardadoProgreso, setErrorGuardadoProgreso] = useState<string | null>(null);
  const [errorGuardadoAgenda, setErrorGuardadoAgenda] = useState<string | null>(null);
  const [agendaGuardando, setAgendaGuardando] = useState(false);
  const [intentosCargaProgreso, setIntentosCargaProgreso] = useState(0);
  // 1. Estado reactivo del navegador de pestañas 
  const [activeTab, setActiveTab] = useState<TabId>('inicio');

  // 2. Estado de tema claro / oscuro
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('unrn_theme') as 'light' | 'dark') || 'light';
  });

  // 3. Alternar entre marco simulador móvil y vista completa
  const [isDeviceFrame, setIsDeviceFrame] = useState<boolean>(true);

  // 4. Modal de simulación temporal
  const [simuladorAbierto, setSimuladorAbierto] = useState<boolean>(false);

  // 5. Tiempo reactivo (En Vivo / Simulado)
  const [horaInfo, setHoraInfo] = useState<HoraSimulada>(timeSimulator.getEstado());

  useEffect(() => {
    const desuscribir = timeSimulator.suscribir((nuevaHora) => {
      setHoraInfo(nuevaHora);
    });
    return desuscribir;
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('unrn_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!sesion) return;

    let vigente = true;
    setProgresoCargando(true);
    setErrorCargaProgreso(null);
    Promise.all([obtenerProgreso(sesion.token), obtenerAgenda(sesion.token)])
      .then(([progreso, encuentros]) => {
        if (vigente) {
          setEstadoAcademico(progreso);
          setAgendaIds(encuentros);
        }
      })
      .catch((error: unknown) => {
        if (vigente) {
          setErrorCargaProgreso(
            error instanceof ErrorApi ? error.message : 'No se pudieron cargar tus datos personales.',
          );
        }
      })
      .finally(() => {
        if (vigente) setProgresoCargando(false);
      });

    return () => { vigente = false; };
  }, [sesion, intentosCargaProgreso]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // 6. Instanciación POO de entidades del dominio
  const materias = useMemo(() => MATERIAS_DATA.map(m => new Materia(m)), []);
  const aulas = useMemo(() => AULAS_DATA.map(a => new Aula(a)), []);
  const todosLosHorarios = useMemo(() => HORARIOS_DATA.map(h => new HorarioCursada(h)), []);
  const eventosCalendario = useMemo(() => CALENDARIO_DATA.map(e => new EventoCalendario(e)), []);

  // Progreso academico asociado a la cuenta autenticada.
  /** Limpia el progreso anterior antes de cargar el del usuario que inicio sesion. */
  const handleLogin = (nuevaSesion: SesionAutenticada) => {
    setEstadoAcademico({});
    setAgendaIds([]);
    setErrorCargaProgreso(null);
    setErrorGuardadoProgreso(null);
    setErrorGuardadoAgenda(null);
    setAgendaGuardando(false);
    setProgresoCargando(true);
    setSesion(nuevaSesion);
  };

  /** Guarda primero en SQLite y actualiza la vista solo cuando la API confirma. */
  const handleUpdateEstadoMateria = async (codigo: string, nuevoEstado: EstadoMateria) => {
    if (!sesion) return;
    setErrorGuardadoProgreso(null);
    try {
      await guardarEstadoMateria(sesion.token, codigo, nuevoEstado);
      setEstadoAcademico(prev => ({ ...prev, [codigo]: nuevoEstado }));
    } catch (error) {
      setErrorGuardadoProgreso(
        error instanceof ErrorApi ? error.message : 'No se pudo guardar el cambio de progreso.',
      );
    }
  };

  /** Obtiene los encuentros locales que corresponden a los IDs de la cuenta. */
  const horariosSeleccionados = useMemo(
    () => todosLosHorarios.filter(horario => agendaIds.includes(horario.id)),
    [todosLosHorarios, agendaIds],
  );

  /** Guarda la nueva lista de encuentros antes de reflejarla en la agenda. */
  const handleToggleComision = async (horario: HorarioCursada) => {
    if (!sesion || agendaGuardando) return;
    const actualizados = agendaIds.includes(horario.id)
      ? agendaIds.filter(id => id !== horario.id)
      : [...agendaIds, horario.id];
    setErrorGuardadoAgenda(null);
    setAgendaGuardando(true);
    try {
      await guardarAgenda(sesion.token, actualizados);
      setAgendaIds(actualizados);
    } catch (error) {
      setErrorGuardadoAgenda(
        error instanceof ErrorApi ? error.message : 'No se pudo guardar el cambio de agenda.',
      );
    } finally {
      setAgendaGuardando(false);
    }
  };

  // 9. Novedades y Cartelera
  const [novedades, setNovedades] = useState<NovedadPost[]>(() => {
    const saved = localStorage.getItem('unrn_novedades');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return NOVEDADES_INICIALES;
  });

  const handleAgregarNovedad = (nueva: Omit<NovedadPost, 'id' | 'likes'>) => {
    const post: NovedadPost = {
      ...nueva,
      id: `nov-${Date.now()}`,
      likes: 0
    };
    setNovedades(prev => {
      const updated = [post, ...prev];
      localStorage.setItem('unrn_novedades', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLikeNovedad = (id: string) => {
    setNovedades(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, likes: n.likes + 1 } : n);
      localStorage.setItem('unrn_novedades', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLogout = async () => {
    if (sesion) {
      try {
        await cerrarSesion(sesion.token);
      } catch {
        // Se limpia el token local aunque el servidor no esté disponible.
      }
    }
    setSesion(null);
    setEstadoAcademico({});
    setAgendaIds([]);
    setProgresoCargando(false);
    setErrorCargaProgreso(null);
    setErrorGuardadoProgreso(null);
    setErrorGuardadoAgenda(null);
    setAgendaGuardando(false);
    setActiveTab('inicio');
  };

  const handleReintentarCargaProgreso = () => {
    setEstadoAcademico({});
    setAgendaIds([]);
    setProgresoCargando(true);
    setErrorCargaProgreso(null);
    setIntentosCargaProgreso(prev => prev + 1);
  };

  // 10. Clases que se están dictando actualmente en toda la sede
  const clasesEnCursoAhora = useMemo(() => {
    return todosLosHorarios.filter(h =>
      h.estaEnCurso(horaInfo.dia, horaInfo.minutosDesdeMedianoche)
    );
  }, [todosLosHorarios, horaInfo]);

  if (!sesion) return <LoginView onLogin={handleLogin} />;

  if (progresoCargando) {
    return (
      <main className="login-viewport">
        <section className="login-card glass-panel" role="status">Cargando tus datos...</section>
      </main>
    );
  }

  if (errorCargaProgreso) {
    return (
      <main className="login-viewport">
        <section className="login-card glass-panel">
          <p className="login-error" role="alert">{errorCargaProgreso}</p>
          <button className="btn-primary login-submit" type="button" onClick={handleReintentarCargaProgreso}>
            Reintentar
          </button>
          <button className="session-logout-button" type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className={`app-viewport ${isDeviceFrame ? '' : 'full-screen'}`}>
      <main className="device-wrapper glass-panel">
        {/* Notch / Speaker del marco de teléfono móvil */}
        {isDeviceFrame && (
          <div className="device-notch">
            <div className="device-speaker" />
            <div className="device-camera" />
          </div>
        )}

        {/* Encabezado Superior con Identidad UNRN y Reloj En Vivo */}
        <Header
          horaInfo={horaInfo}
          theme={theme}
          toggleTheme={toggleTheme}
          isDeviceFrame={isDeviceFrame}
          toggleDeviceFrame={() => setIsDeviceFrame(!isDeviceFrame)}
          onOpenSimulador={() => setSimuladorAbierto(true)}
        />

        <div className="authenticated-user-bar">
          <span>
            {sesion.usuario.nombre}
            <span className="authenticated-user-role">
              {sesion.usuario.rol === 'docente' ? 'Docente' : 'Alumno'}
            </span>
          </span>
          <button className="session-logout-button" type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        {/* Contenido Dinámico según la Pestaña Activa */}
        <div className="app-content-scroll">
          {activeTab === 'inicio' && (
            <InicioView
              onNavigate={setActiveTab}
              horaInfo={horaInfo}
              clasesEnCurso={clasesEnCursoAhora}
              materias={materias}
              estadoAcademico={estadoAcademico}
              onOpenSimulador={() => setSimuladorAbierto(true)}
            />
          )}

          {activeTab === 'aulas' && (
            <AulasView
              aulas={aulas}
              horarios={todosLosHorarios}
              horaInfo={horaInfo}
              onOpenSimulador={() => setSimuladorAbierto(true)}
            />
          )}

          {activeTab === 'plan' && (
            <PlanEstudiosView
              materias={materias}
              estadoAcademico={estadoAcademico}
              onUpdateEstadoMateria={handleUpdateEstadoMateria}
              errorProgreso={errorGuardadoProgreso}
            />
          )}

          {activeTab === 'agenda' && (
            <AgendaView
              todosLosHorarios={todosLosHorarios}
              horariosSeleccionados={horariosSeleccionados}
              onToggleComision={handleToggleComision}
              diaActual={horaInfo.dia}
              errorAgenda={errorGuardadoAgenda}
              guardandoAgenda={agendaGuardando}
            />
          )}

          {activeTab === 'cartelera' && (
            <CarteleraView
              novedades={novedades}
              onAgregarNovedad={handleAgregarNovedad}
              onLikeNovedad={handleLikeNovedad}
              rolUsuario={sesion.usuario.rol}
              nombreUsuario={sesion.usuario.nombre}
            />
          )}

          {activeTab === 'calendario' && (
            <CalendarioView eventos={eventosCalendario} />
          )}

          {activeTab === 'chat' && (
            <ChatIAView />
          )}
        </div>

        {/* Barra de Navegación Inferior */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unreadCount={novedades.filter(n => n.importante).length}
        />

        {/* Modal de Simulación Temporal */}
        <SimuladorModal
          isOpen={simuladorAbierto}
          onClose={() => setSimuladorAbierto(false)}
          horaActual={horaInfo}
        />
      </main>
    </div>
  );
}

export default App;
