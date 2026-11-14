"""Alta local interactiva del primer administrador, sin contraseñas en argumentos."""
import getpass
import sqlite3
from inicializar_db import RUTA_DB, crear_hash_contrasena


def crear_admin(ruta, nombre, usuario, contrasena):
    if not nombre.strip() or not usuario.strip() or len(contrasena) < 8:
        raise ValueError('Nombre y usuario obligatorios; contraseña de al menos 8 caracteres.')
    con = sqlite3.connect(ruta.resolve().as_uri() + '?mode=rw', uri=True)
    try:
        con.execute('BEGIN IMMEDIATE')
        if not con.execute('SELECT 1 FROM migraciones WHERE version = 1').fetchone():
            raise RuntimeError('Primero se requiere la migración versión 1.')
        if con.execute("SELECT 1 FROM usuarios WHERE rol = 'administrador'").fetchone():
            raise RuntimeError('Ya existe un administrador.')
        con.execute("INSERT INTO usuarios(nombre,nombre_usuario,hash_contrasena,rol,estado) VALUES (?,?,?,'administrador','aprobado')", (nombre.strip(), usuario.strip(), crear_hash_contrasena(contrasena)))
        con.commit()
    finally:
        con.close()


def crear_admin_interactivo(ruta=RUTA_DB):
    nombre = input('Nombre: ')
    usuario = input('Usuario: ')
    clave = getpass.getpass('Contraseña (mínimo 8 caracteres): ')
    if clave != getpass.getpass('Repetir contraseña: '):
        raise SystemExit('Las contraseñas no coinciden.')
    crear_admin(ruta, nombre, usuario, clave)
    print('Administrador creado.')


if __name__ == '__main__':
    crear_admin_interactivo()
