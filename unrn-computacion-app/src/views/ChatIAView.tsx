import React, { useState, useRef, useEffect } from 'react';
import { BotMessageSquare, Send, Sparkles, Key, Check, Info, User } from 'lucide-react';
import { aiAssistant, type ChatMessage } from '../services/aiKnowledgeEngine';

export const ChatIAView: React.FC = () => {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      remitente: 'ia',
      texto: `👋 **¡Hola! Soy el Asistente Inteligente de Ingeniería en Computación (UNRN Sede Andina).**

Estoy capacitado con toda la documentación oficial de la carrera:
• **Correlatividades**: consultame qué materias necesitás para cursar o rendir.
• **Aulas y Horarios**: consultame en qué aula se dicta una clase o con qué docente.
• **Calendario 2026**: fechas de exámenes, receso o inicio de cuatrimestres.
• **Contenidos Mínimos**: qué temas se ven en cada materia.

*¿Qué te gustaría consultar hoy?*`,
      timestamp: 'Ahora',
      fuente: 'Resoluciones CSDEyVE 044/2019 y 038/2024 - UNRN',
      sugerencias: [
        '¿Qué necesito para cursar Inteligencia Artificial?',
        '¿Dónde y con quién se cursa Programación I?',
        '¿Cuáles son las fechas de exámenes de Julio 2026?',
        '¿Qué materias componen el título de Técnico Universitario?'
      ]
    }
  ]);

  const [inputTexto, setInputTexto] = useState('');
  const [estaPensando, setEstaPensando] = useState(false);
  const [mostrarConfigKey, setMostrarConfigKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(aiAssistant.getApiKey());
  const [keyGuardada, setKeyGuardada] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, estaPensando]);

  const handleEnviarMensaje = async (texto: string) => {
    if (!texto.trim() || estaPensando) return;

    const ahora = new Date();
    const horaStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    const mensajeUsuario: ChatMessage = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto: texto.trim(),
      timestamp: horaStr
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    setInputTexto('');
    setEstaPensando(true);

    try {
      const respuestaIA = await aiAssistant.responderConsulta(texto);
      setMensajes(prev => [...prev, respuestaIA]);
    } catch (err) {
      setMensajes(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          remitente: 'ia',
          texto: 'Lo siento, ocurrió una dificultad procesando la respuesta. Por favor intentá nuevamente.',
          timestamp: horaStr
        }
      ]);
    } finally {
      setEstaPensando(false);
    }
  };

  const handleGuardarKey = (e: React.FormEvent) => {
    e.preventDefault();
    aiAssistant.setApiKey(apiKeyInput);
    setKeyGuardada(true);
    setTimeout(() => setKeyGuardada(false), 2500);
    setMostrarConfigKey(false);
  };

  return (
    <div className="view-container chat-view-container animate-fade-in">
      {/* Header del Chat */}
      <div className="chat-header-bar">
        <div className="chat-header-left">
          <div className="ai-avatar-badge">
            <BotMessageSquare size={20} className="text-white" />
            <span className="online-indicator" />
          </div>
          <div>
            <h3>Asistente IA UNRN</h3>
            <span className="chat-status-sub">Ing. en Computación • Sede Andina</span>
          </div>
        </div>

        <button
          className="api-key-toggle-btn"
          onClick={() => setMostrarConfigKey(!mostrarConfigKey)}
          title="Configurar clave Gemini API (opcional)"
        >
          <Key size={15} />
          <span>{aiAssistant.getApiKey() ? 'API Key OK' : 'Configurar'}</span>
        </button>
      </div>

      {/* Drawer de Configuración de API Key (Opcional) */}
      {mostrarConfigKey && (
        <div className="api-key-drawer glass-panel animate-fade-in">
          <div className="drawer-header">
            <h4>Configurar Google Gemini API (Opcional)</h4>
            <span className="drawer-hint">
              El asistente ya funciona con el motor local RAG integrado sin clave, pero podés conectar tu propia API Key de Gemini para expandir su razonamiento.
            </span>
          </div>
          <form onSubmit={handleGuardarKey} className="key-form">
            <input
              type="password"
              placeholder="Pegá tu Gemini API Key..."
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              className="text-input"
            />
            <button type="submit" className="btn-primary">
              {keyGuardada ? <Check size={16} /> : <span>Guardar</span>}
            </button>
          </form>
        </div>
      )}

      {/* Mensajes del Chat */}
      <div className="chat-messages-area">
        {mensajes.map(msg => {
          const esUsuario = msg.remitente === 'usuario';

          return (
            <div key={msg.id} className={`chat-message-row ${esUsuario ? 'user-row' : 'ia-row'}`}>
              {!esUsuario && (
                <div className="message-avatar ia">
                  <BotMessageSquare size={16} />
                </div>
              )}

              <div className={`message-bubble ${esUsuario ? 'bubble-user' : 'bubble-ia'}`}>
                <div className="message-content">
                  {msg.texto.split('\n').map((line, i) => {
                    // Formato markdown simple y elegante
                    if (line.startsWith('### ')) {
                      return <h4 key={i} className="msg-h4">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('• ') || line.startsWith('- ')) {
                      return <p key={i} className="msg-bullet">{line}</p>;
                    }
                    if (line.trim() === '') {
                      return <div key={i} className="msg-spacer" />;
                    }
                    return <p key={i}>{line}</p>;
                  })}
                </div>

                <div className="message-meta-footer">
                  <span className="msg-timestamp">{msg.timestamp}</span>
                  {msg.fuente && (
                    <span className="msg-source">
                      <Info size={11} /> {msg.fuente}
                    </span>
                  )}
                </div>

                {/* Sugerencias interactivas de seguimiento */}
                {Boolean(msg.sugerencias && msg.sugerencias.length > 0) && (
                  <div className="message-suggestions-wrap">
                    <span className="suggestions-title">Preguntas sugeridas:</span>
                    <div className="suggestions-chips">
                      {msg.sugerencias!.map((sug, idx) => (
                        <button
                          key={idx}
                          className="suggestion-chip"
                          onClick={() => handleEnviarMensaje(sug)}
                        >
                          <Sparkles size={11} className="text-unrn-red" />
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {esUsuario && (
                <div className="message-avatar user">
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}

        {estaPensando && (
          <div className="chat-message-row ia-row">
            <div className="message-avatar ia">
              <BotMessageSquare size={16} />
            </div>
            <div className="message-bubble bubble-ia thinking">
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="thinking-text">Consultando reglamentos y horarios de UNRN...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input de Mensaje */}
      <div className="chat-input-bar">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleEnviarMensaje(inputTexto);
          }}
          className="chat-input-form"
        >
          <input
            type="text"
            placeholder="Preguntale al Asistente IA sobre correlativas, aulas o calendario..."
            value={inputTexto}
            onChange={e => setInputTexto(e.target.value)}
            disabled={estaPensando}
            className="chat-text-input"
          />
          <button
            type="submit"
            disabled={!inputTexto.trim() || estaPensando}
            className="chat-send-btn"
            aria-label="Enviar mensaje"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
