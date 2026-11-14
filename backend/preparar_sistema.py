"""Prepara una instalación local, conservando una copia de las bases existentes."""
import sqlite3
import uuid
from contextlib import closing
from pathlib import Path

from crear_primer_admin import crear_admin_interactivo
from inicializar_db import RUTA_DB, inicializar_db
from migracion_admin import VERSION, migrar


def verificar(conexion):
    if conexion.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
        raise RuntimeError('La comprobación de integridad falló.')
    if conexion.execute('PRAGMA foreign_key_check').fetchone():
        raise RuntimeError('Se encontraron referencias inválidas.')


def abrir_lectura(ruta):
    return sqlite3.connect(Path(ruta).resolve().as_uri() + '?mode=ro', uri=True)


def respaldar(ruta):
    ruta = Path(ruta)
    copia = ruta.parent / ('respaldo-' + uuid.uuid4().hex + '.db')
    with copia.open('xb'):
        pass
    try:
        with closing(abrir_lectura(ruta)) as origen:
            with closing(sqlite3.connect(copia)) as destino:
                origen.backup(destino)
        with closing(abrir_lectura(copia)) as respaldo:
            verificar(respaldo)
    except Exception as error:
        raise RuntimeError(f'Falló la creación o verificación del respaldo: {error}. El archivo {copia} puede estar incompleto y no es un respaldo verificado.') from error
    return copia


def estado(ruta):
    with closing(abrir_lectura(ruta)) as conexion:
        verificar(conexion)
        tablas = {f[0] for f in conexion.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        necesarias = {'usuarios', 'materias', 'aulas', 'horarios_cursada', 'agenda_usuario', 'progreso_academico'}
        if not necesarias <= tablas:
            raise RuntimeError('La base no contiene las tablas esperadas; revisar el esquema con el equipo.')
        columnas = {f[1] for f in conexion.execute('PRAGMA table_info(usuarios)')}
        requeridas = {'id', 'nombre', 'nombre_usuario', 'hash_contrasena', 'rol'}
        if not requeridas <= columnas:
            raise RuntimeError('La tabla usuarios no tiene las columnas esperadas.')
        aplicada = False
        if 'migraciones' in tablas:
            versiones = {f[0] for f in conexion.execute('SELECT version FROM migraciones')}
            if any(type(v) is not int or v > VERSION for v in versiones):
                raise RuntimeError('La base contiene una versión de migración no compatible.')
            aplicada = VERSION in versiones
        if aplicada and not {'apellido', 'dni', 'estado'} <= columnas:
            raise RuntimeError('La versión registrada no coincide con el esquema de usuarios.')
        if aplicada:
            administradores = conexion.execute("SELECT estado, count(*) FROM usuarios WHERE rol = 'administrador' GROUP BY estado").fetchall()
        else:
            administradores = []
        return aplicada, dict(administradores)


def confirmar(pregunta):
    return input(pregunta + ' [s/N]: ').strip().lower() in ('s', 'si', 'sí')


def preparar(ruta=RUTA_DB):
    ruta = Path(ruta)
    existente = ruta.exists()
    creada = False
    copia = None
    paso_admin = False
    try:
        if existente:
            print('Detené el backend y cualquier otro programa que escriba en la base antes de continuar.')
            if not confirmar('¿Están detenidos y querés continuar?'):
                print('Operación cancelada; la base no fue modificada.')
                return False
            copia = respaldar(ruta)
            print(f'Respaldo verificado: {copia}')
            aplicada, _ = estado(ruta)
        else:
            ruta.parent.mkdir(parents=True, exist_ok=True)
            with ruta.open('xb'):
                pass
            creada = True
            print('Creando base nueva...')
            inicializar_db(ruta)
            aplicada = False
        if not aplicada:
            print('Aplicando migración administrativa...')
            migrar(ruta)
        else:
            print('La migración administrativa ya está aplicada.')
        aplicada, administradores = estado(ruta)
        if not aplicada:
            raise RuntimeError('No se pudo verificar la migración administrativa.')
        print('Integridad y claves foráneas verificadas.')
        if any(estado_admin != 'aprobado' for estado_admin in administradores):
            raise RuntimeError('Existe un administrador pendiente o rechazado. Esa cuenta no puede administrar el sistema; revisá su situación con el equipo. No se modificó la cuenta.')
        elif administradores.get('aprobado', 0):
            print('Ya existe un administrador; utilizá esa cuenta.')
        else:
            paso_admin = True
            if confirmar('No hay administrador. ¿Querés crear el primero ahora?'):
                crear_admin_interactivo(ruta)
                _, administradores = estado(ruta)
                if not administradores.get('aprobado', 0):
                    raise RuntimeError('No se pudo verificar la creación del administrador.')
            else:
                print('No se creó un administrador; podés crearlo más adelante.')
            paso_admin = False
        print('Preparación finalizada.')
        return True
    except (Exception, KeyboardInterrupt, SystemExit) as error:
        print(f'No se pudo completar la preparación: {error or "operación interrumpida"}')
        if paso_admin:
            print('La base y la migración administrativa quedaron preparadas; la creación o verificación del administrador quedó pendiente.')
            print('Podés volver a ejecutar el asistente para continuar. No restaures el respaldo automáticamente.')
        elif creada:
            print(f'La instalación nueva quedó incompleta en {ruta}; no se eliminó el archivo.')
        elif copia is not None:
            print('No se restauró ni reemplazó la base automáticamente. Conservá el respaldo y revisá el error.')
        elif existente:
            print('No se dispone de un respaldo verificado; no se inició la migración. Revisá el error y cualquier archivo parcial.')
        return False


if __name__ == '__main__':
    raise SystemExit(0 if preparar() else 1)
