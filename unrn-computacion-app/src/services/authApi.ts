/** Define los tipos de sesion y las llamadas de acceso al servidor Python. */
export type RolAutenticado = 'alumno' | 'docente';

export interface UsuarioAutenticado {
  nombre: string;
  nombre_usuario: string;
  rol: RolAutenticado;
}

export interface SesionAutenticada {
  token: string;
  usuario: UsuarioAutenticado;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export class ErrorApi extends Error {
  /** Crea un error con un mensaje sencillo para mostrar en la interfaz. */
  constructor(message: string) {
    super(message);
    this.name = 'ErrorApi';
  }
}

/** Envia las credenciales y devuelve la sesion validada por el servidor. */
export async function iniciarSesion(
  nombreUsuario: string,
  contrasena: string,
): Promise<SesionAutenticada> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_usuario: nombreUsuario, contrasena }),
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. Verificá que el backend Python esté iniciado.');
  }

  if (respuesta.status === 401) {
    throw new ErrorApi('El usuario o la contraseña son incorrectos.');
  }
  if (!respuesta.ok) {
    throw new ErrorApi('No se pudo iniciar sesión. Intentá nuevamente.');
  }

  let datos: unknown;
  try {
    datos = await respuesta.json();
  } catch {
    throw new ErrorApi('El servidor devolvió una respuesta inválida.');
  }

  if (!esSesionAutenticada(datos)) {
    throw new ErrorApi('El servidor devolvió datos de sesión incompletos.');
  }
  return datos;
}

/** Informa al backend que el usuario quiere invalidar su token de sesion. */
export async function cerrarSesion(token: string): Promise<void> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ErrorApi('No se pudo confirmar el cierre de sesión con el servidor.');
  }

  // Si el servidor ya perdió la sesión (por ejemplo, tras reiniciarse), ya no es válida.
  if (respuesta.status !== 401 && !respuesta.ok) {
    throw new ErrorApi('No se pudo cerrar la sesión en el servidor.');
  }
}

/** Comprueba que la respuesta del servidor tenga los datos de sesion esperados. */
function esSesionAutenticada(datos: unknown): datos is SesionAutenticada {
  if (!datos || typeof datos !== 'object') return false;
  const sesion = datos as Partial<SesionAutenticada>;
  const usuario = sesion.usuario;
  return (
    typeof sesion.token === 'string' &&
    sesion.token.length > 0 &&
    !!usuario &&
    typeof usuario.nombre === 'string' &&
    typeof usuario.nombre_usuario === 'string' &&
    (usuario.rol === 'alumno' || usuario.rol === 'docente')
  );
}
