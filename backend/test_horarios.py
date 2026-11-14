import json
import sqlite3
import tempfile
import threading
import unittest
from contextlib import closing
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path

import servidor


class HorariosTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Path(self.tmp.name) / 'prueba.db'
        c = sqlite3.connect(self.db)
        c.executescript('''
            CREATE TABLE usuarios(id INTEGER PRIMARY KEY, rol TEXT, estado TEXT);
            INSERT INTO usuarios VALUES(1,'administrador','aprobado'),(2,'alumno','aprobado'),(3,'docente','aprobado');
            CREATE TABLE materias(codigo_guarani TEXT PRIMARY KEY, nombre TEXT, anio INTEGER);
            INSERT INTO materias VALUES('M1','Materia 1',1),('M2','Materia 2',2);
            CREATE TABLE aulas(id TEXT PRIMARY KEY, nombre TEXT, sede TEXT, tipo TEXT, capacidad_aprox INTEGER);
            INSERT INTO aulas VALUES('A1','Aula 1','Sede','aula_teoria',30),('Tacuari-Aula5','Aula 5','Tacuari','aula_teoria',30),('Virtual','Aula virtual','Virtual','virtual',NULL);
            CREATE TABLE horarios_cursada(id TEXT PRIMARY KEY,codigo_materia TEXT NOT NULL,nombre_materia TEXT NOT NULL,comision TEXT NOT NULL,tipo_clase TEXT,lugar TEXT,aula_id TEXT,dia_semana TEXT NOT NULL,hora_desde TEXT NOT NULL,hora_hasta TEXT NOT NULL,duracion TEXT NOT NULL,docente TEXT NOT NULL,email_docente TEXT,auxiliar TEXT,email_auxiliar TEXT,observaciones TEXT,anio INTEGER NOT NULL);
            INSERT INTO horarios_cursada VALUES('viejo','LEG','Materia histórica','C1','Teoría','Tacuari','Aula 5','lunes','10:00','12:00','02:00','Docente','correo','aux','mail','nota',1);
            INSERT INTO horarios_cursada VALUES('otro','M1','Materia 1','C1',NULL,'Tacuari','Tacuari-Aula5','lunes','11:00','13:00','02:00','Docente',NULL,NULL,NULL,NULL,1);
            CREATE TABLE agenda_usuario(usuario_id INTEGER,encuentro_id TEXT);
            INSERT INTO agenda_usuario VALUES(2,'viejo');
        ''')
        c.close()
        self.original = servidor.RUTA_DB
        servidor.RUTA_DB = self.db
        servidor.sesiones.update({'admin': (1, float('inf')), 'alumno': (2, float('inf')), 'docente': (3, float('inf'))})
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), servidor.ManejadorAPI)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True); self.thread.start()

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()
        servidor.RUTA_DB = self.original; servidor.sesiones.clear(); self.tmp.cleanup()

    def request(self, method, path, data, token='admin'):
        c = HTTPConnection('127.0.0.1', self.server.server_port)
        c.request(method, path, json.dumps(data), {'Content-Type':'application/json', 'Authorization':'Bearer '+token})
        r = c.getresponse(); result = (r.status, json.loads(r.read())); c.close(); return result

    def test_flujos(self):
        nuevo = {'id':'nuevo','codigoMateria':'M1','comision':'C1','aula':'A1','diaSemana':'lunes','horaDesde':'09:00','horaHasta':'10:00','docente':'Docente','tipoClase':'Teoría / Práctica'}
        for token in ('alumno', 'docente'):
            self.assertEqual(self.request('POST','/api/admin/horarios',nuevo,token)[0],403)
            self.assertEqual(self.request('PUT','/api/admin/horarios/viejo',dict(nuevo,id='viejo'),token)[0],403)
        for invalido in (dict(nuevo,codigoMateria='inexistente'),dict(nuevo,aula='inexistente'),dict(nuevo,comision=' '),dict(nuevo,docente=''),dict(nuevo,tipoClase=' '),dict(nuevo,diaSemana='domingo'),dict(nuevo,horaDesde='24:00'),dict(nuevo,horaHasta='08:00')):
            self.assertEqual(self.request('POST','/api/admin/horarios',invalido)[0],400)
        self.assertEqual(self.request('POST','/api/admin/horarios',nuevo)[0],201)
        self.assertEqual(self.request('POST','/api/admin/horarios',nuevo)[0],409)
        self.assertEqual(self.request('POST','/api/admin/horarios',dict(nuevo,id='choque',horaDesde='09:30',horaHasta='10:30'))[0],409)
        self.assertEqual(self.request('POST','/api/admin/horarios',dict(nuevo,id='contiguo',horaDesde='10:00',horaHasta='11:00'))[0],201)
        self.assertEqual(self.request('POST','/api/admin/horarios',dict(nuevo,id='alias',aula='Tacuari-Aula5',horaDesde='10:30',horaHasta='11:00'))[0],409)
        for nombre in ('v1','v2'):
            self.assertEqual(self.request('POST','/api/admin/horarios',dict(nuevo,id=nombre,aula='Virtual'))[0],201)
        anterior = dict(nuevo,id='viejo',codigoMateria='LEG',aula='Aula 5',horaDesde='10:00',horaHasta='12:00',tipoClase='Teoría')
        self.assertEqual(self.request('PUT','/api/admin/horarios/viejo',dict(anterior,comision='C2'))[0],200)
        self.assertEqual(self.request('PUT','/api/admin/horarios/viejo',dict(anterior,horaHasta='12:30'))[0],409)
        self.assertEqual(self.request('PUT','/api/admin/horarios/viejo',dict(anterior,horaHasta='11:30'))[0],200)
        self.assertEqual(self.request('PUT','/api/admin/horarios/viejo',dict(anterior,id='cambiado'))[0],400)
        self.assertEqual(self.request('PUT','/api/admin/horarios/viejo',dict(anterior,codigoMateria='OTRA'))[0],400)
        self.assertEqual(self.request('PUT','/api/admin/horarios/viejo',dict(anterior,aula='OTRA'))[0],400)
        c = sqlite3.connect(self.db)
        self.assertEqual(c.execute("SELECT id,codigo_materia,aula_id,email_docente,auxiliar,observaciones FROM horarios_cursada WHERE id='viejo'").fetchone(), ('viejo','LEG','Aula 5','correo','aux','nota'))
        self.assertEqual(c.execute('SELECT * FROM agenda_usuario').fetchall(), [(2,'viejo')])
        c.close()

    def test_cambiar_tipo_aula(self):
        nuevo = {'id':'v1','codigoMateria':'M1','comision':'C1','aula':'Virtual','diaSemana':'lunes','horaDesde':'09:00','horaHasta':'10:00','docente':'Docente','tipoClase':'Teoría / Práctica'}
        self.assertEqual(self.request('POST', '/api/admin/horarios', nuevo)[0], 201)
        self.assertEqual(self.request('POST', '/api/admin/horarios', dict(nuevo,id='v2',horaDesde='09:30',horaHasta='10:30'))[0], 201)
        cambio = {'id':'Virtual','nombre':'Nombre cambiado','sede':'Otra sede','tipo':'aula_teoria','capacidadAprox':50}
        estado, respuesta = self.request('PUT', '/api/admin/aulas/Virtual', cambio)
        self.assertEqual(estado, 409)
        self.assertIn('v1', respuesta['error'])
        self.assertIn('v2', respuesta['error'])
        c = sqlite3.connect(self.db)
        self.assertEqual(c.execute("SELECT nombre,sede,tipo,capacidad_aprox FROM aulas WHERE id='Virtual'").fetchone(), ('Aula virtual','Virtual','virtual',None))
        self.assertEqual(c.execute("SELECT count(*) FROM horarios_cursada WHERE aula_id='Virtual'").fetchone()[0], 2)
        c.execute("UPDATE horarios_cursada SET hora_desde='10:00', hora_hasta='11:00' WHERE id='v2'")
        c.commit(); c.close()
        self.assertEqual(self.request('PUT', '/api/admin/aulas/Virtual', cambio)[0], 200)
        self.assertEqual(self.request('PUT', '/api/admin/aulas/Virtual', dict(cambio,tipo='virtual'))[0], 200)
        c = sqlite3.connect(self.db)
        self.assertEqual(c.execute("SELECT tipo FROM aulas WHERE id='Virtual'").fetchone(), ('virtual',))
        c.close()

    def test_tipo_y_correo_del_docente(self):
        nuevo = {'id':'nuevo','codigoMateria':'M1','comision':'C1','aula':'A1','diaSemana':'lunes','horaDesde':'09:00','horaHasta':'10:00','docente':'Ana','tipoClase':'Presencial híbrida','emailDocente':'ana@unrn.edu.ar'}
        self.assertEqual(self.request('POST', '/api/admin/horarios', {k:v for k,v in nuevo.items() if k != 'tipoClase'})[0], 400)
        self.assertEqual(self.request('POST', '/api/admin/horarios', nuevo)[0], 201)
        with closing(sqlite3.connect(self.db)) as c:
            self.assertEqual(c.execute("SELECT tipo_clase,email_docente FROM horarios_cursada WHERE id='nuevo'").fetchone(), ('Presencial híbrida', 'ana@unrn.edu.ar'))
            self.assertEqual(c.execute("SELECT tipo_clase,email_docente FROM horarios_cursada WHERE id='viejo'").fetchone(), ('Teoría', 'correo'))
        # Un cliente anterior que no envía correo no debe asociar el correo previo a otro docente.
        cambio = {k:v for k,v in dict(nuevo,docente='Bruno').items() if k != 'emailDocente'}
        self.assertEqual(self.request('PUT', '/api/admin/horarios/nuevo', cambio)[0], 200)
        with closing(sqlite3.connect(self.db)) as c:
            self.assertEqual(c.execute("SELECT docente,email_docente FROM horarios_cursada WHERE id='nuevo'").fetchone(), ('Bruno', None))
        self.assertEqual(self.request('PUT', '/api/admin/horarios/nuevo', dict(cambio,emailDocente='bruno@unrn.edu.ar'))[0], 200)
        with closing(sqlite3.connect(self.db)) as c:
            self.assertEqual(c.execute("SELECT email_docente FROM horarios_cursada WHERE id='nuevo'").fetchone(), ('bruno@unrn.edu.ar',))


if __name__ == '__main__': unittest.main()
