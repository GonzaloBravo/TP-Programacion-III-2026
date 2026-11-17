import sqlite3
import tempfile
import unittest
from pathlib import Path

from inicializar_db import inicializar_db
from migracion_admin import migrar


class InicializacionTest(unittest.TestCase):
    def test_repeticion_conserva_cambios_y_relaciones(self):
        with tempfile.TemporaryDirectory() as directorio:
            ruta = Path(directorio) / 'temporal.db'
            inicializar_db(ruta)
            migrar(ruta)
            con = sqlite3.connect(ruta)
            con.execute('PRAGMA foreign_keys = ON')
            aula = con.execute('SELECT id FROM aulas ORDER BY id LIMIT 1').fetchone()[0]
            horario = con.execute('SELECT id FROM horarios_cursada ORDER BY id LIMIT 1').fetchone()[0]
            materia = con.execute('SELECT codigo_guarani FROM materias ORDER BY codigo_guarani LIMIT 1').fetchone()[0]
            con.execute("INSERT INTO usuarios (nombre, apellido, dni, nombre_usuario, hash_contrasena, rol, estado) VALUES ('Usuario Test', 'Apellido', '12345678', 'usertest', 'hash', 'alumno', 'aprobado')")
            con.commit()
            usuario = con.execute('SELECT id FROM usuarios ORDER BY id LIMIT 1').fetchone()[0]
            con.execute('UPDATE aulas SET nombre = ? WHERE id = ?', ('Aula administrada', aula))
            con.execute('UPDATE horarios_cursada SET docente = ? WHERE id = ?', ('Docente editado', horario))
            con.execute('UPDATE materias SET nombre = ? WHERE codigo_guarani = ?', ('Materia editada', materia))
            con.execute('UPDATE info_carrera SET valor = ? WHERE clave = (SELECT clave FROM info_carrera LIMIT 1)', ('Valor editado',))
            con.execute('UPDATE eventos_calendario SET titulo = ? WHERE id = (SELECT id FROM eventos_calendario LIMIT 1)', ('Evento editado',))
            con.execute('INSERT INTO correlativas(materia_codigo,requisito_codigo,tipo_requisito) VALUES(?,?,?)', (materia, 'TEST', 'aprobada_para_cursar'))
            con.execute('INSERT INTO objetivos_materia(materia_codigo,objetivo) VALUES(?,?)', (materia, 'Objetivo agregado'))
            con.execute('INSERT INTO agenda_usuario(usuario_id,encuentro_id) VALUES(?,?)', (usuario, horario))
            con.commit()
            tablas = ('usuarios', 'aulas', 'horarios_cursada', 'materias', 'info_carrera', 'eventos_calendario', 'correlativas', 'objetivos_materia', 'agenda_usuario', 'progreso_academico', 'novedades_cartelera')
            antes = {tabla: con.execute('SELECT * FROM ' + tabla + ' ORDER BY rowid').fetchall() for tabla in tablas}
            con.close()
            inicializar_db(ruta)
            con = sqlite3.connect(ruta)
            try:
                for tabla in tablas:
                    with self.subTest(tabla=tabla):
                        self.assertEqual(antes[tabla], con.execute('SELECT * FROM ' + tabla + ' ORDER BY rowid').fetchall())
                self.assertEqual(con.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
                self.assertEqual(con.execute('PRAGMA foreign_key_check').fetchall(), [])
                self.assertEqual(con.execute('SELECT version FROM migraciones').fetchall(), [(1,)])
            finally:
                con.close()

    def test_no_crea_usuarios_demo_automaticos(self):
        with tempfile.TemporaryDirectory() as directorio:
            ruta = Path(directorio) / 'temporal.db'
            inicializar_db(ruta)
            con = sqlite3.connect(ruta)
            try:
                total_usuarios = con.execute("SELECT count(*) FROM usuarios").fetchone()[0]
                self.assertEqual(total_usuarios, 0)
            finally:
                con.close()


if __name__ == '__main__':
    unittest.main()
