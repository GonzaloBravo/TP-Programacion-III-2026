import React from 'react';
import { Clock, Moon, Sun, Smartphone, Monitor, Sparkles } from 'lucide-react';
import type { HoraSimulada } from '../async/timeSimulator';

interface HeaderProps {
  horaInfo: HoraSimulada;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isDeviceFrame: boolean;
  toggleDeviceFrame: () => void;
  onOpenSimulador: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  horaInfo,
  theme,
  toggleTheme,
  isDeviceFrame,
  toggleDeviceFrame,
  onOpenSimulador
}) => {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-container">
          <div className="brand-logo-wrap">
            <img src="/logo-unrn-oficial.jpg" alt="Logo Oficial UNRN" className="unrn-badge-logo" />
          </div>
          <div className="brand-text">
            <div className="brand-title-wrap">
              <span className="brand-badge">UNRN</span>
              <span className="brand-career">Ing. en Computación</span>
            </div>
            <span className="brand-subtitle">Sede Andina • Bariloche</span>
          </div>
        </div>

        <div className="header-actions">
          {/* Botón para alternar marco de teléfono móvil en escritorio */}
          <button
            className="action-icon-btn device-toggle"
            onClick={toggleDeviceFrame}
            title={isDeviceFrame ? "Expandir a pantalla completa" : "Ver como simulador móvil"}
            aria-label="Toggle frame"
          >
            {isDeviceFrame ? <Monitor size={17} /> : <Smartphone size={17} />}
          </button>

          {/* Botón modo claro/oscuro */}
          <button
            className="action-icon-btn"
            onClick={toggleTheme}
            title="Cambiar tema"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
      </div>

      {/* Barra de tiempo y estado en vivo */}
      <div className="header-live-bar" onClick={onOpenSimulador} role="button" tabIndex={0}>
        <div className="live-clock-pill">
          <span className={`status-indicator-dot ${horaInfo.esModoSimulado ? 'simulated' : 'live'}`} />
          <Clock size={14} className="clock-icon" />
          <span className="live-time-text">
            {horaInfo.dia.toUpperCase()} {horaInfo.horaTexto} hs
          </span>
          {horaInfo.esModoSimulado ? (
            <span className="mode-tag simulated">Simulado</span>
          ) : (
            <span className="mode-tag live">En Vivo</span>
          )}
        </div>

        <div className="live-quick-action">
          <Sparkles size={13} />
          <span>Cambiar hora</span>
        </div>
      </div>
    </header>
  );
};
