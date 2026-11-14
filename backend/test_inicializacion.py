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

    def test_cuenta_demo_anterior_no_se_modifica(self):
        with tempfile.TemporaryDirectory() as directorio:
            ruta = Path(directorio) / 'temporal.db'
            inicializar_db(ruta)
            con = sqlite3.connect(ruta)
            con.execute("UPDATE usuarios SET nombre_usuario='alumna2', nombre='Nombre conservado' WHERE nombre_usuario='alumno2'")
            con.commit()
            antes = con.execute("SELECT * FROM usuarios WHERE nombre_usuario='alumna2'").fetchone()
            con.close()
            inicializar_db(ruta)
            con = sqlite3.connect(ruta)
            try:
                self.assertEqual(con.execute("SELECT * FROM usuarios WHERE nombre_usuario='alumna2'").fetchone(), antes)
                self.assertIsNone(con.execute("SELECT id FROM usuarios WHERE nombre_usuario='alumno2'").fetchone())
            finally:
                con.close()


if __name__ == '__main__':
    unittest.main()
