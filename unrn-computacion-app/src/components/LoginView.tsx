/** Muestra el formulario de acceso y entrega la sesion validada a la app. */
import { useState, type FormEvent } from 'react';
import { LogIn, AlertCircle, GraduationCap, UserPlus } from 'lucide-react';
import { iniciarSesion, registrarUsuario, type ErrorApi, type SesionAutenticada, type RolAutenticado } from '../services/authApi';

interface LoginViewProps {
  onLogin: (sesion: SesionAutenticada) => void;
}

/** Valida el formulario y entrega a la app la sesion recibida del backend. */
export function LoginView({ onLogin }: LoginViewProps) {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [modoRegistro, setModoRegistro] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [rol, setRol] = useState<RolAutenticado>('alumno');

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

  const handleRegistro = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!/^\d{7,8}$/.test(dni.trim())) {
      setError('El DNI debe tener 7 u 8 dígitos.');
      return;
    }
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setEnviando(true);
    try {
      await registrarUsuario({
        nombre: nombre.trim(), apellido: apellido.trim(), dni: dni.trim(),
        nombre_usuario: nombreUsuario.trim(), contrasena, rol,
      });
      setContrasena('');
      setConfirmarContrasena('');
      setModoRegistro(false);
      setMensaje('Cuenta creada. Ya podés iniciar sesión.');
    } catch (cause) {
      setError((cause as ErrorApi).message || 'No se pudo crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className={`login-viewport ${modoRegistro ? 'registration-viewport' : ''}`}>
      <section className="login-card glass-panel" aria-labelledby="login-title">
        <div className="login-icon"><GraduationCap size={30} /></div>
        <p className="login-kicker">UNRN · Ingeniería en Computación</p>
        <h1 id="login-title">{modoRegistro ? 'Crear cuenta' : 'Ingresar'}</h1>
        <p className="login-description">{modoRegistro ? 'Completá tus datos para crear una cuenta.' : 'Ingresá con tu cuenta o registrate para comenzar'}</p>

        {modoRegistro && (
          <form className="login-form" onSubmit={handleRegistro}>
            <label htmlFor="register-name">Nombre</label>
            <input id="register-name" className="text-input" value={nombre} onChange={event => setNombre(event.target.value)} autoComplete="given-name" maxLength={100} required />

            <label htmlFor="register-surname">Apellido</label>
            <input id="register-surname" className="text-input" value={apellido} onChange={event => setApellido(event.target.value)} autoComplete="family-name" maxLength={100} required />

            <label htmlFor="register-dni">DNI</label>
            <input id="register-dni" className="text-input" type="text" inputMode="numeric" pattern="[0-9]{7,8}" maxLength={8} value={dni} onChange={event => setDni(event.target.value)} autoComplete="off" required />

            <label htmlFor="register-username">Nombre de usuario</label>
            <input id="register-username" className="text-input" type="text" pattern="[A-Za-z0-9._-]{3,30}" maxLength={30} value={nombreUsuario} onChange={event => setNombreUsuario(event.target.value)} autoComplete="username" required />

            <label htmlFor="register-password">Contraseña</label>
            <input id="register-password" className="text-input" type="password" minLength={8} maxLength={1024} value={contrasena} onChange={event => setContrasena(event.target.value)} autoComplete="new-password" required />

            <label htmlFor="register-confirm-password">Confirmar contraseña</label>
            <input id="register-confirm-password" className="text-input" type="password" minLength={8} maxLength={1024} value={confirmarContrasena} onChange={event => setConfirmarContrasena(event.target.value)} autoComplete="new-password" required />

            <label htmlFor="register-role">Rol</label>
            <select id="register-role" className="text-input" value={rol} onChange={event => setRol(event.target.value as RolAutenticado)}>
              <option value="alumno">Alumno</option>
              <option value="docente">Docente</option>
            </select>
            <p className="login-description">El registro docente está abierto únicamente para la demostración académica.</p>

            {error && <p className="login-error" role="alert"><AlertCircle size={16} /><span>{error}</span></p>}
            <button className="btn-primary login-submit" type="submit" disabled={enviando}>
              <UserPlus size={17} /><span>{enviando ? 'Creando cuenta…' : 'Registrarse'}</span>
            </button>
          </form>
        )}

        {!modoRegistro && <form className="login-form" onSubmit={handleSubmit}>
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

          {mensaje && <p className="registration-success" role="status">{mensaje}</p>}
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
        </form>}

        <button className="login-mode-toggle" type="button" onClick={() => { setModoRegistro(!modoRegistro); setError(''); setMensaje(''); }}>
          {modoRegistro ? 'Ya tengo cuenta: iniciar sesión' : '¿No tenés cuenta? Registrarse'}
        </button>
      </section>
    </main>
  );
}
