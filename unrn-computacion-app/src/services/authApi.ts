/** Define los tipos de sesion y las llamadas de acceso al servidor Python. */
import type { EstadoAcademicoUsuario, EstadoMateria } from '../types';

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

/** Carga desde SQLite los estados academicos de la sesion autenticada. */
export async function obtenerProgreso(token: string): Promise<EstadoAcademicoUsuario> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/progreso`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. El progreso no se cargo.');
  }

  if (respuesta.status === 401) {
    throw new ErrorApi('La sesion vencio. Inicia sesion nuevamente.');
  }
  if (!respuesta.ok) {
    throw new ErrorApi('No se pudo cargar el progreso academico.');
  }

  let datos: unknown;
  try {
    datos = await respuesta.json();
  } catch {
    throw new ErrorApi('El servidor devolvio un progreso invalido.');
  }

  if (!datos || typeof datos !== 'object' || !Array.isArray((datos as { progreso?: unknown }).progreso)) {
    throw new ErrorApi('El servidor devolvio un progreso invalido.');
  }

  const progreso: EstadoAcademicoUsuario = {};
  for (const fila of (datos as { progreso: unknown[] }).progreso) {
    if (
      !fila ||
      typeof fila !== 'object' ||
      typeof (fila as { codigo_materia?: unknown }).codigo_materia !== 'string' ||
      !(fila as { codigo_materia: string }).codigo_materia.trim() ||
      !esEstadoMateria((fila as { estado?: unknown }).estado)
    ) {
      throw new ErrorApi('El servidor devolvio un progreso invalido.');
    }
    const registro = fila as { codigo_materia: string; estado: EstadoMateria };
    progreso[registro.codigo_materia] = registro.estado;
  }
  return progreso;
}

/** Guarda un estado y confirma que el servidor haya persistido el mismo cambio. */
export async function guardarEstadoMateria(
  token: string,
  codigoMateria: string,
  estado: EstadoMateria,
): Promise<void> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/progreso`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codigo_materia: codigoMateria, estado }),
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. El cambio no se guardo.');
  }

  if (respuesta.status === 401) {
    throw new ErrorApi('La sesion vencio. El cambio no se guardo.');
  }
  if (!respuesta.ok) {
    throw new ErrorApi('No se pudo guardar el cambio de progreso.');
  }

  let datos: unknown;
  try {
    datos = await respuesta.json();
  } catch {
    throw new ErrorApi('El servidor no confirmo el guardado del progreso.');
  }
  if (
    !datos ||
    typeof datos !== 'object' ||
    (datos as { codigo_materia?: unknown }).codigo_materia !== codigoMateria ||
    (datos as { estado?: unknown }).estado !== estado
  ) {
    throw new ErrorApi('El servidor no confirmo el guardado del progreso.');
  }
}

/** Carga los identificadores de encuentros guardados para la sesion actual. */
export async function obtenerAgenda(token: string): Promise<string[]> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/agenda`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. La agenda no se cargo.');
  }

  if (respuesta.status === 401) {
    throw new ErrorApi('La sesion vencio. Inicia sesion nuevamente.');
  }
  if (!respuesta.ok) {
    throw new ErrorApi('No se pudo cargar la agenda.');
  }

  let datos: unknown;
  try {
    datos = await respuesta.json();
  } catch {
    throw new ErrorApi('El servidor devolvio una agenda invalida.');
  }

  if (
    !datos ||
    typeof datos !== 'object' ||
    !Array.isArray((datos as { encuentros?: unknown }).encuentros)
  ) {
    throw new ErrorApi('El servidor devolvio una agenda invalida.');
  }

  const encuentros = (datos as { encuentros: unknown[] }).encuentros;
  if (
    encuentros.some(id => typeof id !== 'string' || !id.trim()) ||
    new Set(encuentros).size !== encuentros.length
  ) {
    throw new ErrorApi('El servidor devolvio una agenda invalida.');
  }
  return encuentros as string[];
}

/** Reemplaza la seleccion de encuentros y verifica la confirmacion del servidor. */
export async function guardarAgenda(token: string, encuentros: string[]): Promise<void> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/agenda`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encuentros }),
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. El cambio de agenda no se guardo.');
  }

  if (respuesta.status === 401) {
    throw new ErrorApi('La sesion vencio. El cambio de agenda no se guardo.');
  }
  if (!respuesta.ok) {
    throw new ErrorApi('No se pudo guardar el cambio de agenda.');
  }

  let datos: unknown;
  try {
    datos = await respuesta.json();
  } catch {
    throw new ErrorApi('El servidor no confirmo el guardado de la agenda.');
  }
  const confirmados = datos && typeof datos === 'object'
    ? (datos as { encuentros?: unknown }).encuentros
    : undefined;
  if (
    !Array.isArray(confirmados) ||
    confirmados.length !== encuentros.length ||
    confirmados.some((id, indice) => id !== encuentros[indice])
  ) {
    throw new ErrorApi('El servidor no confirmo el guardado de la agenda.');
  }
}

/** Comprueba que el estado recibido pertenezca a los valores de la aplicacion. */
function esEstadoMateria(estado: unknown): estado is EstadoMateria {
  return estado === 'aprobada' || estado === 'regular' || estado === 'cursando' || estado === 'pendiente';
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
