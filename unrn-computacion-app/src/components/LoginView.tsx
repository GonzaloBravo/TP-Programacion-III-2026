/** Muestra el formulario de acceso y entrega la sesion validada a la app. */
import { useState, type FormEvent } from 'react';
import { LogIn, AlertCircle, GraduationCap } from 'lucide-react';
import { iniciarSesion, type ErrorApi, type SesionAutenticada } from '../services/authApi';

interface LoginViewProps {
  onLogin: (sesion: SesionAutenticada) => void;
}

/** Valida el formulario y entrega a la app la sesion recibida del backend. */
export function LoginView({ onLogin }: LoginViewProps) {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const sesion = await iniciarSesion(nombreUsuario.trim(), contrasena);
      setContrasena('');
      onLogin(sesion);
    } catch (cause) {
      setError((cause as ErrorApi).message || 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="login-viewport">
      <section className="login-card glass-panel" aria-labelledby="login-title">
        <div className="login-icon"><GraduationCap size={30} /></div>
        <p className="login-kicker">UNRN · Ingeniería en Computación</p>
        <h1 id="login-title">Ingresar</h1>
        <p className="login-description">Usá una de las cuentas de demostración del proyecto.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-username">Nombre de usuario</label>
          <input
            id="login-username"
            className="text-input"
            type="text"
            autoComplete="username"
            value={nombreUsuario}
            onChange={event => setNombreUsuario(event.target.value)}
            required
          />

          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            className="text-input"
            type="password"
            autoComplete="current-password"
            value={contrasena}
            onChange={event => setContrasena(event.target.value)}
            required
          />

          {error && (
            <p className="login-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </p>
          )}

          <button className="btn-primary login-submit" type="submit" disabled={enviando}>
            <LogIn size={17} />
            <span>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</span>
          </button>
        </form>

        <p className="login-demo-hint">Cuentas disponibles: alumno1, alumna2 y docente.</p>
      </section>
    </main>
  );
}
