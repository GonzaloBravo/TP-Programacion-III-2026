import json
import sqlite3
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path

import servidor
from inicializar_db import crear_hash_contrasena
from migracion_admin import migrar
from crear_primer_admin import crear_admin


class AdminTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Path(self.tmp.name) / 'test.db'
        con = sqlite3.connect(self.db)
        con.executescript('''CREATE TABLE usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, apellido TEXT, dni TEXT, nombre_usuario TEXT NOT NULL COLLATE NOCASE UNIQUE, hash_contrasena TEXT NOT NULL, rol TEXT NOT NULL CHECK(rol IN ('alumno','docente')));
        CREATE UNIQUE INDEX idx_usuarios_dni ON usuarios(dni) WHERE dni IS NOT NULL;
        CREATE TABLE progreso_academico(usuario_id INTEGER REFERENCES usuarios(id), codigo_materia TEXT);
        CREATE TABLE agenda_usuario(usuario_id INTEGER REFERENCES usuarios(id), encuentro_id TEXT);
        CREATE TABLE aulas(id TEXT PRIMARY KEY, nombre TEXT NOT NULL, sede TEXT NOT NULL, tipo TEXT NOT NULL, capacidad_aprox INTEGER);
        CREATE TABLE horarios_cursada(id TEXT PRIMARY KEY, aula_id TEXT);
        CREATE TABLE novedades_cartelera(id TEXT, titulo TEXT, contenido TEXT, autor TEXT, rol_autor TEXT, codigo_materia TEXT, nombre_materia TEXT, fecha TEXT, hora TEXT, importante INTEGER, likes INTEGER);''')
        con.execute('INSERT INTO usuarios VALUES (7,?,?,?,?,?,?)', ('Docente', 'Anterior', '12345678', 'anterior', crear_hash_contrasena('clave123'), 'docente'))
        con.execute("INSERT INTO progreso_academico VALUES(7,'mat')")
        con.execute("INSERT INTO agenda_usuario VALUES(7,'enc')")
        con.execute("INSERT INTO aulas VALUES('A1','Aula 1','Sede','aula_teoria',30)")
        con.execute("INSERT INTO horarios_cursada VALUES('enc','A1')")
        con.commit(); con.close()
        migrar(self.db)
        self.original_db = servidor.RUTA_DB
        servidor.RUTA_DB = self.db
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), servidor.ManejadorAPI)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True); self.thread.start()

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()
        servidor.RUTA_DB = self.original_db
        servidor.sesiones.clear()
        self.tmp.cleanup()

    def request(self, method, path, data=None, token=None):
        con = HTTPConnection('127.0.0.1', self.server.server_port)
        headers = {'Content-Type': 'application/json'}
        if token: headers['Authorization'] = 'Bearer ' + token
        con.request(method, path, json.dumps(data) if data is not None else None, headers)
        resp = con.getresponse(); result = (resp.status, json.loads(resp.read() or b'{}')); con.close()
        return result

    def test_migracion_y_permisos(self):
        con = sqlite3.connect(self.db)
        before = list(con.iterdump()); con.close()
        migrar(self.db)
        con = sqlite3.connect(self.db)
        self.assertEqual(before, list(con.iterdump()))
        self.assertEqual(con.execute('PRAGMA foreign_key_check').fetchall(), [])
        self.assertEqual(con.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
        self.assertEqual(con.execute('SELECT id,dni,rol,estado FROM usuarios').fetchone(), (7, '12345678', 'docente', 'aprobado'))
        self.assertTrue(servidor.verificar_contrasena('clave123', con.execute('SELECT hash_contrasena FROM usuarios WHERE id=7').fetchone()[0]))
        self.assertEqual(con.execute('SELECT * FROM progreso_academico').fetchone(), (7, 'mat'))
        self.assertEqual(con.execute('SELECT * FROM agenda_usuario').fetchone(), (7, 'enc')); con.close()
        crear_admin(self.db, 'Admin', 'admin', 'clave123')
        def registro(user, dni, rol):
            return self.request('POST', '/api/registro', {'nombre':'Nombre','apellido':'Apellido','dni':dni,'nombre_usuario':user,'contrasena':'clave123','rol':rol})
        def login(user): return self.request('POST', '/api/login', {'nombre_usuario':user,'contrasena':'clave123'})
        self.assertEqual(registro('alumno', '12345670', 'alumno')[0], 201)
        self.assertEqual(registro('docente', '12345671', 'docente')[0], 201)
        self.assertEqual(registro('rechazo', '12345672', 'docente')[0], 201)
        self.assertEqual(registro('intruso', '12345673', 'administrador')[0], 400)
        self.assertEqual(login('docente')[0], 403)
        alumno = login('alumno')[1]['token']; admin = login('admin')[1]['token']; docente_viejo = login('anterior')[1]['token']
        for token in (alumno, docente_viejo):
            self.assertEqual(self.request('GET', '/api/admin/solicitudes', token=token)[0], 403)
            self.assertEqual(self.request('POST', '/api/admin/solicitudes', {'id': 7, 'estado':'aprobado'}, token)[0], 403)
        solicitudes = self.request('GET', '/api/admin/solicitudes', token=admin)[1]['solicitudes']
        ids = {s['nombre_usuario']:s['id'] for s in solicitudes}
        # Simula una sesión previa cuya aprobación fue revocada.
        servidor.sesiones['pendiente'] = (ids['docente'], float('inf'))
        self.assertEqual(self.request('POST', '/api/novedades', {'titulo':'x','contenido':'x'}, 'pendiente')[0], 403)
        self.assertEqual(self.request('POST', '/api/admin/solicitudes', {'id':ids['docente'], 'estado':'aprobado'}, admin)[0], 200)
        aprobado = login('docente')
        self.assertEqual(aprobado[0], 200)
        self.assertEqual(self.request('POST', '/api/novedades', {'titulo':'Aviso','contenido':'Contenido'}, aprobado[1]['token'])[0], 201)
        self.assertEqual(self.request('POST', '/api/admin/solicitudes', {'id':ids['rechazo'], 'estado':'rechazado'}, admin)[0], 200)
        self.assertEqual(login('rechazo')[0], 403)
        servidor.sesiones['rechazado'] = (ids['rechazo'], float('inf'))
        self.assertEqual(self.request('POST', '/api/novedades', {'titulo':'x','contenido':'x'}, 'rechazado')[0], 403)

    def test_gestion_aulas(self):
        crear_admin(self.db, 'Admin', 'admin', 'clave123')
        con = sqlite3.connect(self.db)
        con.execute("INSERT INTO usuarios(nombre,nombre_usuario,hash_contrasena,rol,estado) VALUES(?,?,?,'alumno','aprobado')", ('Alumno','alumno',crear_hash_contrasena('clave123')))
        con.commit(); con.close()
        def token(usuario):
            return self.request('POST', '/api/login', {'nombre_usuario':usuario,'contrasena':'clave123'})[1]['token']
        admin, alumno, docente = token('admin'), token('alumno'), token('anterior')
        nueva = {'id':'A2', 'nombre':'Aula 2', 'sede':'Sede', 'tipo':'laboratorio', 'capacidadAprox':25}
        for usuario in (alumno, docente):
            self.assertEqual(self.request('POST', '/api/admin/aulas', nueva, usuario)[0], 403)
            self.assertEqual(self.request('PUT', '/api/admin/aulas/A1', dict(nueva, id='A1'), usuario)[0], 403)
        self.assertEqual(self.request('POST', '/api/admin/aulas', nueva, admin)[0], 201)
        self.assertEqual(self.request('POST', '/api/admin/aulas', nueva, admin)[0], 409)
        for dato in (dict(nueva, id=''), dict(nueva, nombre='  '), dict(nueva, sede=''), dict(nueva, tipo='otro'), dict(nueva, capacidadAprox=-1), dict(nueva, capacidadAprox=1.5), dict(nueva, capacidadAprox=True)):
            self.assertEqual(self.request('POST', '/api/admin/aulas', dato, admin)[0], 400)
        self.assertEqual(self.request('PUT', '/api/admin/aulas/A1', dict(nueva, id='A2'), admin)[0], 400)
        self.assertEqual(self.request('PUT', '/api/admin/aulas/noexiste', dict(nueva, id='noexiste'), admin)[0], 404)
        self.assertEqual(self.request('PUT', '/api/admin/aulas/A1', dict(nueva, id='A1', nombre='Aula actualizada'), admin)[0], 200)
        con = sqlite3.connect(self.db)
        self.assertEqual(con.execute("SELECT nombre FROM aulas WHERE id='A1'").fetchone(), ('Aula actualizada',))
        self.assertEqual(con.execute('SELECT * FROM horarios_cursada').fetchall(), [('enc', 'A1')])
        self.assertEqual(con.execute('SELECT * FROM agenda_usuario').fetchall(), [(7, 'enc')])
        con.close()


if __name__ == '__main__': unittest.main()
