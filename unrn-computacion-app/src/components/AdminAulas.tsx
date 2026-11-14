import { useState, type FormEvent } from 'react';
import { guardarAulaApi } from '../services/academicApi';
import type { AulaInfo } from '../types';

interface Props {
  token: string;
  aulas: AulaInfo[];
  actualizarAulas: () => Promise<void>;
}

const tipos: { value: AulaInfo['tipo']; label: string }[] = [
  { value: 'aula_teoria', label: 'Aula de teoría' },
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'pecera', label: 'Pecera' },
  { value: 'virtual', label: 'Virtual' },
];

export function AdminAulas({ token, aulas, actualizarAulas }: Props) {
  const [editando, setEditando] = useState<string | null>(null);
  const [id, setId] = useState('');
  const [nombre, setNombre] = useState('');
  const [sede, setSede] = useState('');
  const [tipo, setTipo] = useState<AulaInfo['tipo']>('aula_teoria');
  const [capacidad, setCapacidad] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  function limpiar() {
    setEditando(null); setId(''); setNombre(''); setSede(''); setTipo('aula_teoria'); setCapacidad('');
  }
  function editar(aula: AulaInfo) {
    setEditando(aula.id); setId(aula.id); setNombre(aula.nombre); setSede(aula.sede);
    setTipo(aula.tipo); setCapacidad(aula.capacidadAprox == null ? '' : String(aula.capacidadAprox));
    setMensaje(''); setError('');
  }
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setOcupado(true); setError(''); setMensaje('');
    try {
      await guardarAulaApi(token, { id, nombre, sede, tipo, capacidadAprox: capacidad === '' ? undefined : Number(capacidad) }, editando ?? undefined);
      limpiar();
      try {
        await actualizarAulas();
        setMensaje('Aula guardada correctamente.');
      } catch {
        setError('El aula se guardó, pero no se pudo actualizar el listado. Recargá la aplicación.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el aula.');
    } finally { setOcupado(false); }
  }

  return <section className="admin-solicitudes">
    <h2>Gestión académica · Aulas</h2>
    <form className="admin-aula-form admin-solicitud" onSubmit={guardar}>
      <h3>{editando ? 'Editar aula' : 'Agregar aula'}</h3>
      <label htmlFor="aula-id">ID</label>
      <input id="aula-id" className="text-input" value={id} onChange={e => setId(e.target.value)} disabled={editando !== null || ocupado} pattern="[A-Za-z0-9_-]{1,100}" required />
      <label htmlFor="aula-nombre">Nombre</label>
      <input id="aula-nombre" className="text-input" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={200} required />
      <label htmlFor="aula-sede">Sede</label>
      <input id="aula-sede" className="text-input" value={sede} onChange={e => setSede(e.target.value)} maxLength={200} required />
      <label htmlFor="aula-tipo">Tipo</label>
      <select id="aula-tipo" className="text-input" value={tipo} onChange={e => setTipo(e.target.value as AulaInfo['tipo'])}>
        {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <label htmlFor="aula-capacidad">Capacidad aproximada (opcional)</label>
      <input id="aula-capacidad" className="text-input" type="number" min="1" max="1000000" step="1" value={capacidad} onChange={e => setCapacidad(e.target.value)} />
      {error && <p className="login-error" role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
      <div className="admin-acciones">
        <button className="btn-primary" type="submit" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar aula'}</button>
        {editando && <button className="btn-secondary" type="button" disabled={ocupado} onClick={() => { limpiar(); setError(''); setMensaje(''); }}>Cancelar edición</button>}
      </div>
    </form>
    <h3>Aulas existentes</h3>
    {aulas.map(aula => <article className="admin-solicitud" key={aula.id}>
      <p><strong>{aula.nombre}</strong> · {aula.id}<br />{aula.sede} · {tipos.find(t => t.value === aula.tipo)?.label ?? aula.tipo}<br />Capacidad: {aula.capacidadAprox ?? 'Sin especificar'}</p>
      <div className="admin-acciones"><button className="btn-secondary" type="button" disabled={ocupado} onClick={() => editar(aula)}>Editar</button></div>
    </article>)}
  </section>;
}
