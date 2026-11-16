import { useState, type FormEvent } from 'react';
import { guardarHorarioApi, type DatosHorario } from '../services/academicApi';
import type { AulaInfo, HorarioCursadaRaw, MateriaRaw } from '../types';

interface Props {
  token: string;
  materias: MateriaRaw[];
  aulas: AulaInfo[];
  horarios: HorarioCursadaRaw[];
  actualizarHorarios: () => Promise<void>;
}

const vacio = (): DatosHorario => ({ id: '', codigoMateria: '', comision: '', aula: '', diaSemana: 'lunes', horaDesde: '', horaHasta: '', docente: '', tipoClase: '', emailDocente: '' });
const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
const tiposClase = ['Teoría / Práctica', 'Presencial híbrida'];

export function AdminHorarios({ token, materias, aulas, horarios, actualizarHorarios }: Props) {
  const [datos, setDatos] = useState<DatosHorario>(vacio);
  const [original, setOriginal] = useState<HorarioCursadaRaw | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const historica = original && !materias.some(m => m.codigoGuarani === original.codigoMateria);
  const aulaHistorica = original && !aulas.some(a => a.id === original.aula);

  function editar(horario: HorarioCursadaRaw) {
    setOriginal(horario);
    setDatos({ id: horario.id, codigoMateria: horario.codigoMateria, comision: horario.comision, aula: horario.aula, diaSemana: horario.diaSemana, horaDesde: horario.horaDesde, horaHasta: horario.horaHasta, docente: horario.docente, tipoClase: horario.tipoClase ?? '', emailDocente: horario.emailDocente ?? '' });
    setError(''); setMensaje('');
  }
  function limpiar() { setOriginal(null); setDatos(vacio()); }
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setOcupado(true); setError(''); setMensaje('');
    try {
      await guardarHorarioApi(token, datos, original?.id);
      limpiar();
      try { await actualizarHorarios(); setMensaje('Encuentro guardado correctamente.'); }
      catch { setError('El encuentro se guardó, pero no se pudo actualizar el listado. Recargá la aplicación.'); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el encuentro.'); }
    finally { setOcupado(false); }
  }
  return <section className="admin-solicitudes">
    <h2>Gestión académica · Horarios</h2>
    <p>Los encuentros se tratan como semanales; no se distinguen períodos académicos.</p>
    <form className="admin-aula-form admin-solicitud" onSubmit={guardar}>
      <h3>{original ? 'Editar encuentro' : 'Agregar encuentro'}</h3>
      <label htmlFor="horario-id">ID</label>
      <input id="horario-id" className="text-input" value={datos.id} onChange={e => setDatos({ ...datos, id: e.target.value })} disabled={!!original || ocupado} pattern="[A-Za-z0-9_-]{1,100}" required />
      <label htmlFor="horario-materia">Materia</label>
      <select id="horario-materia" className="text-input" value={datos.codigoMateria} onChange={e => setDatos({ ...datos, codigoMateria: e.target.value })} required>
        <option value="">Seleccionar materia</option>
        {historica && <option value={original.codigoMateria}>{original.nombreMateria} ({original.codigoMateria}) — referencia histórica</option>}
        {materias.map(m => <option key={m.codigoGuarani} value={m.codigoGuarani}>{m.nombre} ({m.codigoGuarani})</option>)}
      </select>
      <label htmlFor="horario-comision">Comisión</label>
      <input id="horario-comision" className="text-input" value={datos.comision} onChange={e => setDatos({ ...datos, comision: e.target.value })} maxLength={200} required />
      <label htmlFor="horario-tipo">Tipo de clase</label>
      <select id="horario-tipo" className="text-input" value={datos.tipoClase} onChange={e => setDatos({ ...datos, tipoClase: e.target.value })} required={!original}>
        <option value="">Sin especificar</option>
        {datos.tipoClase && !tiposClase.includes(datos.tipoClase) && <option value={datos.tipoClase}>{datos.tipoClase} — valor histórico</option>}
        {tiposClase.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
      </select>
      <label htmlFor="horario-aula">Aula</label>
      <select id="horario-aula" className="text-input" value={datos.aula} onChange={e => setDatos({ ...datos, aula: e.target.value })} required>
        <option value="">Seleccionar aula</option>
        {aulaHistorica && <option value={original.aula}>{original.aula} — referencia histórica</option>}
        {aulas.map(a => <option key={a.id} value={a.id}>{a.nombre} · {a.sede} ({a.id})</option>)}
      </select>
      <label htmlFor="horario-dia">Día</label>
      <select id="horario-dia" className="text-input" value={datos.diaSemana} onChange={e => setDatos({ ...datos, diaSemana: e.target.value as DatosHorario['diaSemana'] })}>
        {dias.map(d => <option key={d} value={d}>{d === 'miercoles' ? 'miércoles' : d === 'sabado' ? 'sábado' : d}</option>)}
      </select>
      <label htmlFor="horario-desde">Hora de inicio</label>
      <input id="horario-desde" className="text-input" type="time" value={datos.horaDesde} onChange={e => setDatos({ ...datos, horaDesde: e.target.value })} required />
      <label htmlFor="horario-hasta">Hora de finalización</label>
      <input id="horario-hasta" className="text-input" type="time" value={datos.horaHasta} onChange={e => setDatos({ ...datos, horaHasta: e.target.value })} required />
      <label htmlFor="horario-docente">Docente</label>
      <input id="horario-docente" className="text-input" value={datos.docente} onChange={e => setDatos({ ...datos, docente: e.target.value, emailDocente: '' })} maxLength={200} required />
      <label htmlFor="horario-email">Correo del docente (opcional)</label>
      <input id="horario-email" className="text-input" value={datos.emailDocente ?? ''} onChange={e => setDatos({ ...datos, emailDocente: e.target.value })} maxLength={254} />
      {error && <p className="login-error" role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
      <div className="admin-acciones">
        <button className="btn-primary" type="submit" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar encuentro'}</button>
        {original && <button className="btn-secondary" type="button" disabled={ocupado} onClick={() => { limpiar(); setError(''); setMensaje(''); }}>Cancelar edición</button>}
      </div>
    </form>
    <h3>Encuentros existentes</h3>
    {horarios.map(h => <article className="admin-solicitud" key={h.id}>
      <p><strong>{h.nombreMateria} · {h.comision}</strong><br />{h.diaSemana} {h.horaDesde}–{h.horaHasta} · {h.aula}<br />ID: {h.id}</p>
      <div className="admin-acciones"><button className="btn-secondary" type="button" disabled={ocupado} onClick={() => editar(h)}>Editar</button></div>
    </article>)}
  </section>;
}
