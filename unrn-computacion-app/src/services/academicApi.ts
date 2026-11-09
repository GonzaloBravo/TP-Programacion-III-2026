/** Servicio para consumir los datos maestros universitarios desde el backend SQLite. */
import type {
  MateriaRaw,
  AulaInfo,
  HorarioCursadaRaw,
  EventoCalendarioRaw,
  NovedadPost,
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

/** Carga las 38 materias oficiales con sus correlativas desde SQLite. */
export async function cargarMateriasApi(): Promise<MateriaRaw[]> {
  const respuesta = await fetch(`${API_BASE_URL}/api/materias`);
  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las materias desde el servidor.');
  }
  const datos = await respuesta.json();
  return datos.materias as MateriaRaw[];
}

/** Carga las aulas físicas y virtuales de la Sede Andina desde SQLite. */
export async function cargarAulasApi(): Promise<AulaInfo[]> {
  const respuesta = await fetch(`${API_BASE_URL}/api/aulas`);
  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las aulas desde el servidor.');
  }
  const datos = await respuesta.json();
  return datos.aulas as AulaInfo[];
}

/** Carga los horarios de cursada y comisiones desde SQLite. */
export async function cargarHorariosApi(): Promise<HorarioCursadaRaw[]> {
  const respuesta = await fetch(`${API_BASE_URL}/api/horarios`);
  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los horarios desde el servidor.');
  }
  const datos = await respuesta.json();
  return datos.horarios as HorarioCursadaRaw[];
}

/** Carga el calendario académico oficial desde SQLite. */
export async function cargarCalendarioApi(): Promise<EventoCalendarioRaw[]> {
  const respuesta = await fetch(`${API_BASE_URL}/api/calendario`);
  if (!respuesta.ok) {
    throw new Error('No se pudo obtener el calendario desde el servidor.');
  }
  const datos = await respuesta.json();
  return datos.eventos as EventoCalendarioRaw[];
}

/** Carga las publicaciones activas de la cartelera virtual desde SQLite. */
export async function cargarNovedadesApi(): Promise<NovedadPost[]> {
  const respuesta = await fetch(`${API_BASE_URL}/api/novedades`);
  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los avisos desde el servidor.');
  }
  const datos = await respuesta.json();
  return datos.novedades as NovedadPost[];
}

/** Guarda un nuevo aviso de cátedra en SQLite (requiere autorización docente). */
export async function publicarNovedadApi(
  token: string,
  novedad: {
    titulo: string;
    contenido: string;
    codigoMateria?: string;
    nombreMateria?: string;
    importante?: boolean;
  },
): Promise<NovedadPost> {
  const respuesta = await fetch(`${API_BASE_URL}/api/novedades`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(novedad),
  });

  if (!respuesta.ok) {
    const errorBody = await respuesta.json().catch(() => ({}));
    throw new Error(errorBody.error || 'No se pudo publicar el aviso en el servidor.');
  }

  const datos = await respuesta.json();
  return datos.novedad as NovedadPost;
}

/** Registra un me gusta en SQLite y devuelve el total actualizado. */
export async function darLikeNovedadApi(id: string): Promise<number> {
  const respuesta = await fetch(`${API_BASE_URL}/api/novedades/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (!respuesta.ok) {
    throw new Error('No se pudo actualizar el me gusta en el servidor.');
  }

  const datos = await respuesta.json();
  return datos.likes as number;
}

