import { useCallback, useEffect, useState } from 'react';

interface Solicitud { id: number; nombre: string; apellido: string; nombre_usuario: string }

export function AdminSolicitudes({ token }: { token: string }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const cargar = useCallback(async () => {
    const respuesta = await fetch('http://127.0.0.1:8000/api/admin/solicitudes', { headers: { Authorization: `Bearer ${token}` } });
    if (!respuesta.ok) throw new Error('No se pudieron cargar las solicitudes.');
    const datos = await respuesta.json();
    setSolicitudes(datos.solicitudes);
  }, [token]);
  useEffect(() => { cargar().catch(() => setError('No se pudieron cargar las solicitudes.')); }, [cargar]);
  async function resolver(id: number, estado: 'aprobado' | 'rechazado') {
    setOcupado(true); setError('');
    try {
      const respuesta = await fetch('http://127.0.0.1:8000/api/admin/solicitudes', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, estado }),
      });
      if (!respuesta.ok) throw new Error();
      await cargar();
    } catch { setError('No se pudo actualizar la solicitud.'); }
    finally { setOcupado(false); }
  }
  return <section className="admin-solicitudes">
    <h2>Solicitudes docentes</h2>
    {error && <p role="alert" className="login-error">{error}</p>}
    {!error && solicitudes.length === 0 && <p>No hay solicitudes pendientes.</p>}
    {solicitudes.map(s => <article className="admin-solicitud" key={s.id}>
      <p><strong>{s.nombre} {s.apellido}</strong><br />{s.nombre_usuario}</p>
      <div className="admin-acciones">
        <button className="btn-primary" disabled={ocupado} onClick={() => resolver(s.id, 'aprobado')}>Aprobar</button>
        <button className="btn-secondary" disabled={ocupado} onClick={() => resolver(s.id, 'rechazado')}>Rechazar</button>
      </div>
    </article>)}
  </section>;
}
