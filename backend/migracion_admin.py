"""Migración explícita de cuentas; nunca se ejecuta al iniciar el servidor."""
import sqlite3
from pathlib import Path

VERSION = 1


def migrar(ruta: str | Path) -> None:
    ruta = Path(ruta)
    if not ruta.is_file():
        raise FileNotFoundError('La base de datos no existe.')
    con = sqlite3.connect(ruta)
    try:
        con.execute('PRAGMA foreign_keys = OFF')
        con.execute('BEGIN IMMEDIATE')
        con.execute('CREATE TABLE IF NOT EXISTS migraciones (version INTEGER PRIMARY KEY)')
        if con.execute('SELECT 1 FROM migraciones WHERE version = ?', (VERSION,)).fetchone():
            con.rollback()
            return
        columnas = {row[1] for row in con.execute('PRAGMA table_info(usuarios)')}
        if not {'id', 'nombre', 'nombre_usuario', 'hash_contrasena', 'rol'} <= columnas:
            raise RuntimeError('Esquema de usuarios no compatible.')
        if columnas - {'id', 'nombre', 'apellido', 'dni', 'nombre_usuario', 'hash_contrasena', 'rol'}:
            raise RuntimeError('La tabla usuarios contiene columnas no contempladas; no se aplicó la migración.')
        objetos = list(con.execute("SELECT type, name, sql FROM sqlite_master WHERE tbl_name = 'usuarios' AND type IN ('index', 'trigger') AND sql IS NOT NULL ORDER BY type"))
        secuencia = con.execute("SELECT seq FROM sqlite_sequence WHERE name = 'usuarios'").fetchone()
        apellido = 'apellido' if 'apellido' in columnas else 'NULL'
        dni = 'dni' if 'dni' in columnas else 'NULL'
        con.execute('''CREATE TABLE usuarios_nueva (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
            apellido TEXT, dni TEXT,
            nombre_usuario TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(trim(nombre_usuario)) > 0),
            hash_contrasena TEXT NOT NULL,
            rol TEXT NOT NULL CHECK (rol IN ('alumno', 'docente', 'administrador')),
            estado TEXT NOT NULL DEFAULT 'aprobado' CHECK (estado IN ('aprobado', 'pendiente', 'rechazado'))
        )''')
        con.execute(f'''INSERT INTO usuarios_nueva (id,nombre,apellido,dni,nombre_usuario,hash_contrasena,rol,estado)
            SELECT id,nombre,{apellido},{dni},nombre_usuario,hash_contrasena,rol,'aprobado' FROM usuarios''')
        con.execute('DROP TABLE usuarios')
        con.execute('ALTER TABLE usuarios_nueva RENAME TO usuarios')
        for _, _, sql in objetos:
            con.execute(sql)
        if not any(tipo == 'index' and nombre == 'idx_usuarios_dni' for tipo, nombre, _ in objetos):
            con.execute('CREATE UNIQUE INDEX idx_usuarios_dni ON usuarios(dni) WHERE dni IS NOT NULL')
        if secuencia:
            con.execute("UPDATE sqlite_sequence SET seq = MAX(seq, ?) WHERE name = 'usuarios'", secuencia)
        if con.execute('PRAGMA foreign_key_check').fetchone():
            raise RuntimeError('La migración detectó referencias inválidas.')
        if con.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise RuntimeError('La comprobación de integridad falló.')
        con.execute('INSERT INTO migraciones(version) VALUES (?)', (VERSION,))
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Migrar una base existente después de crear una copia de seguridad.')
    parser.add_argument('base', help='Ruta explícita de la base SQLite')
    migrar(parser.parse_args().base)
    print('Migración verificada.')
