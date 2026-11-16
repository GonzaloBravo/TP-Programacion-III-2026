import contextlib
import io
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from inicializar_db import inicializar_db
from migracion_admin import migrar
from preparar_sistema import preparar


class PrepararSistemaTest(unittest.TestCase):
    def setUp(self):
        self.temporal = tempfile.TemporaryDirectory()
        self.ruta = Path(self.temporal.name) / 'base.db'

    def tearDown(self):
        self.temporal.cleanup()

    def ejecutar(self, respuestas, claves=None):
        salida = io.StringIO()
        with patch('builtins.input', side_effect=respuestas), patch('getpass.getpass', side_effect=claves or []), contextlib.redirect_stdout(salida):
            resultado = preparar(self.ruta)
        return resultado, salida.getvalue()

    def consulta(self, sql):
        with contextlib.closing(sqlite3.connect(self.ruta)) as con:
            return con.execute(sql).fetchall()

    def respaldo(self):
        copias = list(self.ruta.parent.glob('respaldo-*.db'))
        self.assertEqual(len(copias), 1)
        return copias[0]

    def test_instalacion_nueva_y_admin_interactivo(self):
        resultado, mensaje = self.ejecutar(['s', 'Nombre', 'usuario'], ['clave-segura', 'clave-segura'])
        self.assertTrue(resultado, mensaje)
        self.assertEqual(self.consulta('SELECT version FROM migraciones'), [(1,)])
        self.assertEqual(self.consulta("SELECT rol,estado FROM usuarios WHERE nombre_usuario='usuario'"), [('administrador', 'aprobado')])
        self.assertEqual(self.consulta('PRAGMA integrity_check'), [('ok',)])
        self.assertEqual(self.consulta('PRAGMA foreign_key_check'), [])
        self.assertFalse(list(self.ruta.parent.glob('respaldo-*.db')))

    def test_nueva_sin_administrador(self):
        resultado, mensaje = self.ejecutar(['n'])
        self.assertTrue(resultado, mensaje)
        self.assertIn('No se creó un administrador', mensaje)
        self.assertEqual(self.consulta("SELECT count(*) FROM usuarios WHERE rol='administrador'"), [(0,)])

    def test_existente_sin_migrar_conserva_datos_y_respaldo(self):
        inicializar_db(self.ruta)
        with contextlib.closing(sqlite3.connect(self.ruta)) as con:
            con.execute("UPDATE aulas SET nombre='Editada' WHERE id=(SELECT id FROM aulas LIMIT 1)")
            con.execute("INSERT INTO agenda_usuario SELECT id,'encuentro' FROM usuarios LIMIT 1")
            con.commit()
            tablas = ('usuarios', 'materias', 'aulas', 'horarios_cursada', 'agenda_usuario')
            antes = {t: con.execute('SELECT * FROM ' + t + ' ORDER BY rowid').fetchall() for t in tablas}
        resultado, mensaje = self.ejecutar(['s', 'n'])
        self.assertTrue(resultado, mensaje)
        with contextlib.closing(sqlite3.connect(self.respaldo())) as copia:
            self.assertEqual(copia.execute('PRAGMA integrity_check').fetchall(), [('ok',)])
            self.assertEqual(copia.execute('PRAGMA foreign_key_check').fetchall(), [])
            for tabla in tablas:
                self.assertEqual(copia.execute('SELECT * FROM ' + tabla + ' ORDER BY rowid').fetchall(), antes[tabla])
        for tabla in tablas:
            columnas = 'id,nombre,apellido,dni,nombre_usuario,hash_contrasena,rol' if tabla == 'usuarios' else '*'
            self.assertEqual(self.consulta('SELECT ' + columnas + ' FROM ' + tabla + ' ORDER BY rowid'), antes[tabla])
        self.assertEqual(self.consulta('PRAGMA integrity_check'), [('ok',)])
        self.assertEqual(self.consulta('PRAGMA foreign_key_check'), [])

    def test_existente_migrada_con_admin_no_solicita_credenciales(self):
        inicializar_db(self.ruta); migrar(self.ruta)
        with contextlib.closing(sqlite3.connect(self.ruta)) as con:
            con.execute("INSERT INTO usuarios(nombre,nombre_usuario,hash_contrasena,rol,estado) VALUES('Admin','admin','hash','administrador','aprobado')")
            con.commit()
        antes = self.ruta.read_bytes()
        resultado, mensaje = self.ejecutar(['s'])
        self.assertTrue(resultado, mensaje)
        self.assertIn('Ya existe un administrador', mensaje)
        self.assertEqual(self.ruta.read_bytes(), antes)
        self.respaldo()

    def test_incompatible_no_cambia_original(self):
        inicializar_db(self.ruta)
        with contextlib.closing(sqlite3.connect(self.ruta)) as con:
            con.execute('ALTER TABLE usuarios ADD COLUMN dato_extra TEXT')
            con.commit()
        antes = self.ruta.read_bytes()
        resultado, mensaje = self.ejecutar(['s'])
        self.assertFalse(resultado)
        self.assertIn('columnas no contempladas', mensaje)
        self.assertEqual(self.ruta.read_bytes(), antes)
        self.respaldo()

    def test_fallo_respaldo_no_modifica_original(self):
        inicializar_db(self.ruta)
        antes = self.ruta.read_bytes()
        with patch('preparar_sistema.respaldar', side_effect=OSError('sin espacio')):
            resultado, mensaje = self.ejecutar(['s'])
        self.assertFalse(resultado)
        self.assertIn('sin espacio', mensaje)
        self.assertEqual(self.ruta.read_bytes(), antes)

    def test_respaldo_no_verificado_deja_archivo_parcial_sin_migrar(self):
        inicializar_db(self.ruta)
        antes = self.ruta.read_bytes()
        with patch('preparar_sistema.verificar', side_effect=RuntimeError('fallo de verificación')):
            resultado, mensaje = self.ejecutar(['s'])
        self.assertFalse(resultado)
        self.assertIn('Falló la creación o verificación del respaldo', mensaje)
        self.assertIn('no es un respaldo verificado', mensaje)
        self.assertIn('no se inició la migración', mensaje)
        self.assertEqual(self.ruta.read_bytes(), antes)
        self.respaldo()

    def test_restriccion_adicional_rechazada_sin_cambios(self):
        with contextlib.closing(sqlite3.connect(self.ruta)) as con:
            con.execute('''CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
                apellido TEXT UNIQUE, dni TEXT,
                nombre_usuario TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(trim(nombre_usuario)) > 0),
                hash_contrasena TEXT NOT NULL,
                rol TEXT NOT NULL CHECK (rol IN ('alumno', 'docente'))
            )''')
            con.commit()
        antes = self.ruta.read_bytes()
        with self.assertRaisesRegex(RuntimeError, 'esquema de usuarios no es compatible'):
            migrar(self.ruta)
        self.assertEqual(self.ruta.read_bytes(), antes)

    def test_esquema_historico_con_columnas_agregadas_se_migra(self):
        with contextlib.closing(sqlite3.connect(self.ruta)) as con:
            con.execute('''CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
                nombre_usuario TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(trim(nombre_usuario)) > 0),
                hash_contrasena TEXT NOT NULL,
                rol TEXT NOT NULL CHECK (rol IN ('alumno', 'docente'))
            )''')
            con.execute('ALTER TABLE usuarios ADD COLUMN apellido TEXT')
            con.execute('ALTER TABLE usuarios ADD COLUMN dni TEXT')
            con.execute("INSERT INTO usuarios(nombre,nombre_usuario,hash_contrasena,rol,apellido) VALUES('Ana','ana','hash','docente','Pérez')")
            con.commit()
        migrar(self.ruta)
        self.assertEqual(self.consulta('SELECT nombre,apellido,rol,estado FROM usuarios'), [('Ana', 'Pérez', 'docente', 'aprobado')])

    def test_admin_no_aprobado_no_se_modifica_ni_se_crea_otro(self):
        inicializar_db(self.ruta)
        migrar(self.ruta)
        with contextlib.closing(sqlite3.connect(self.ruta)) as con:
            con.execute("INSERT INTO usuarios(nombre,nombre_usuario,hash_contrasena,rol,estado) VALUES('Admin','admin','hash','administrador','pendiente')")
            con.commit()
        antes = self.ruta.read_bytes()
        resultado, mensaje = self.ejecutar(['s'])
        self.assertFalse(resultado)
        self.assertIn('administrador pendiente o rechazado', mensaje)
        self.assertEqual(self.ruta.read_bytes(), antes)

    def test_error_admin_informa_migracion_completada(self):
        resultado, mensaje = self.ejecutar(['s', 'Nombre', 'admin'], ['primera-clave', 'otra-clave'])
        self.assertFalse(resultado)
        self.assertIn('migración administrativa quedaron preparadas', mensaje)
        self.assertIn('volver a ejecutar el asistente', mensaje)
        self.assertIn('No restaures el respaldo automáticamente', mensaje)
        self.assertEqual(self.consulta('SELECT version FROM migraciones'), [(1,)])

    def test_cancelar_base_existente_no_modifica(self):
        inicializar_db(self.ruta)
        antes = self.ruta.read_bytes()
        resultado, mensaje = self.ejecutar(['n'])
        self.assertFalse(resultado)
        self.assertIn('cancelada', mensaje)
        self.assertEqual(self.ruta.read_bytes(), antes)
        self.assertFalse(list(self.ruta.parent.glob('respaldo-*.db')))

    def test_error_base_nueva_informa_incompleta(self):
        with patch('preparar_sistema.migrar', side_effect=RuntimeError('error simulado')):
            resultado, mensaje = self.ejecutar([])
        self.assertFalse(resultado)
        self.assertIn('instalación nueva quedó incompleta', mensaje)
        self.assertTrue(self.ruta.exists())


if __name__ == '__main__':
    unittest.main()
