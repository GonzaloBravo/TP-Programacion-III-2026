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
import { cerrarSesion, type SesionAutenticada } from './services/authApi';

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

export function App() {
  const [sesion, setSesion] = useState<SesionAutenticada | null>(null);
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

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // 6. Instanciación POO de entidades del dominio
  const materias = useMemo(() => MATERIAS_DATA.map(m => new Materia(m)), []);
  const aulas = useMemo(() => AULAS_DATA.map(a => new Aula(a)), []);
  const todosLosHorarios = useMemo(() => HORARIOS_DATA.map(h => new HorarioCursada(h)), []);
  const eventosCalendario = useMemo(() => CALENDARIO_DATA.map(e => new EventoCalendario(e)), []);

  // 7. Estado Académico del Estudiante (con valores iniciales realistas para demostración)
  const [estadoAcademico, setEstadoAcademico] = useState<EstadoAcademicoUsuario>(() => {
    const saved = localStorage.getItem('unrn_estado_academico');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    // Estado inicial de demostración: Alumno cursando 3° año
    return {
      B6000: 'aprobada', // Matemática I
      B6001: 'aprobada', // Intro Ing Comp
      T0002: 'aprobada', // ILEA
      B6002: 'aprobada', // Física I
      B6003: 'aprobada', // Prog I
      B6004: 'aprobada', // Electrónica Digital
      B6005: 'aprobada', // Química
      B6006: 'aprobada', // Matemática II
      B6007: 'aprobada', // Álgebra y Geometría
      B6008: 'aprobada', // Prog II
      B6009: 'aprobada', // Arq Comp I
      B6010: 'regular',  // Matemática III
      B6011: 'regular',  // Física II
      B6012: 'regular',  // Circuitos
      B5638: 'aprobada', // Inglés Técnico
      B6013: 'regular',  // Bases de Datos
      B6015: 'cursando', // Prog III
      B6018: 'cursando', // Sistemas Operativos I
      B6019: 'cursando', // Señales y Sistemas
      B6020: 'cursando'  // Redes
    };
  });

  const handleUpdateEstadoMateria = (codigo: string, nuevoEstado: EstadoMateria) => {
    setEstadoAcademico(prev => {
      const updated = { ...prev, [codigo]: nuevoEstado };
      localStorage.setItem('unrn_estado_academico', JSON.stringify(updated));
      return updated;
    });
  };

  // 8. Horarios de Cursada Seleccionados por el alumno
  const [horariosSeleccionados, setHorariosSeleccionados] = useState<HorarioCursada[]>(() => {
    const savedIds = localStorage.getItem('unrn_horarios_ids');
    if (savedIds) {
      try {
        const ids = JSON.parse(savedIds) as string[];
        return todosLosHorarios.filter(h => ids.includes(h.id));
      } catch (e) { /* fallback */ }
    }
    // Cursadas seleccionadas por defecto para el alumno de 3° año
    return todosLosHorarios.filter(h =>
      h.codigoMateria === 'B6015' || // Prog III
      h.codigoMateria === 'B6018' || // SO I
      h.codigoMateria === 'B6020'    // Redes
    );
  });

  const handleToggleComision = (horario: HorarioCursada) => {
    setHorariosSeleccionados(prev => {
      const existe = prev.some(h => h.id === horario.id);
      let updated: HorarioCursada[];
      if (existe) {
        // Desmarcar esta clase/comisión específica
        updated = prev.filter(h => h.id !== horario.id);
      } else {
        // Permitir selección múltiple de comisiones/días para la misma materia (ej: Teoría y Práctica)
        updated = [...prev, horario];
      }
      localStorage.setItem('unrn_horarios_ids', JSON.stringify(updated.map(u => u.id)));
      return updated;
    });
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
    setActiveTab('inicio');
  };

  // 10. Clases que se están dictando actualmente en toda la sede
  const clasesEnCursoAhora = useMemo(() => {
    return todosLosHorarios.filter(h =>
      h.estaEnCurso(horaInfo.dia, horaInfo.minutosDesdeMedianoche)
    );
  }, [todosLosHorarios, horaInfo]);

  if (!sesion) {
    return <LoginView onLogin={setSesion} />;
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
            />
          )}

          {activeTab === 'agenda' && (
            <AgendaView
              todosLosHorarios={todosLosHorarios}
              horariosSeleccionados={horariosSeleccionados}
              onToggleComision={handleToggleComision}
              diaActual={horaInfo.dia}
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
