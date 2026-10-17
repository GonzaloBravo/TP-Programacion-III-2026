import React, { useState } from 'react';
import { X, Clock, Play, RotateCcw, Check } from 'lucide-react';
import { timeSimulator, type HoraSimulada } from '../async/timeSimulator';

interface SimuladorModalProps {
  isOpen: boolean;
  onClose: () => void;
  horaActual: HoraSimulada;
}

export const SimuladorModal: React.FC<SimuladorModalProps> = ({
  isOpen,
  onClose,
  horaActual
}) => {
  const [diaSeleccionado, setDiaSeleccionado] = useState(horaActual.dia);
  const [horaTexto, setHoraTexto] = useState(horaActual.horaTexto);

  if (!isOpen) return null;

  const presets = [
    { label: 'Lunes 11:30 hs', dia: 'lunes' as const, hora: '11:30', desc: 'Física I en B103' },
    { label: 'Martes 16:30 hs', dia: 'martes' as const, hora: '16:30', desc: 'Prog I en B101 y Señales en B102-B' },
    { label: 'Miércoles 16:00 hs', dia: 'miercoles' as const, hora: '16:00', desc: 'Redes en B101 presencial' },
    { label: 'Jueves 19:30 hs', dia: 'jueves' as const, hora: '19:30', desc: 'Prog I en B202-B y Lab-105' },
    { label: 'Viernes 19:30 hs', dia: 'viernes' as const, hora: '19:30', desc: 'Electrónica Digital en B102-A, FPGA en Lab-105 y Física I en B103' },
    { label: 'Sábado 10:00 hs', dia: 'sabado' as const, hora: '10:00', desc: 'Seguridad Ambiental en B202-B' }
  ];

  const handleApplyPreset = (dia: any, hora: string) => {
    timeSimulator.setModoSimulado(dia, hora);
    onClose();
  };

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    timeSimulator.setModoSimulado(diaSeleccionado as any, horaTexto);
    onClose();
  };

  const handleResetReal = () => {
    timeSimulator.volverAHoraReal();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Clock className="text-unrn-red" size={20} />
            <h3>Simulador de Tiempo Real</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <p className="modal-subtitle">
          Probá cómo reacciona la app simulando diferentes días y horarios de cursada en la UNRN Sede Andina.
        </p>

        <div className="presets-section">
          <h4>Escenarios de cursada recomendados:</h4>
          <div className="presets-grid">
            {presets.map((p, idx) => (
              <button
                key={idx}
                className="preset-card"
                onClick={() => handleApplyPreset(p.dia, p.hora)}
              >
                <div className="preset-header">
                  <Play size={13} className="text-unrn-red" />
                  <strong>{p.label}</strong>
                </div>
                <span className="preset-desc">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCustomApply} className="custom-time-form">
          <h4>O seleccioná horario personalizado:</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Día de la semana</label>
              <select
                value={diaSeleccionado}
                onChange={e => setDiaSeleccionado(e.target.value as any)}
                className="select-input"
              >
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
              </select>
            </div>

            <div className="form-group">
              <label>Hora (HH:MM)</label>
              <input
                type="time"
                value={horaTexto}
                onChange={e => setHoraTexto(e.target.value)}
                className="time-input"
                required
              />
            </div>
          </div>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetReal}
            >
              <RotateCcw size={15} />
              <span>Hora Real</span>
            </button>

            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Aplicar Horario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
