"""Prepara la base SQLite y crea las cuentas de demostracion que falten."""

import hashlib
import secrets
import sqlite3
from pathlib import Path


DIRECTORIO_BACKEND = Path(__file__).resolve().parent
RUTA_DB = DIRECTORIO_BACKEND / "data" / "unrn_computacion.db"

ITERACIONES_PBKDF2 = 310_000
LONGITUD_SAL = 16
LONGITUD_HASH = 32

# Credenciales unicamente para el prototipo local de Programacion III.
# La base guarda el resultado PBKDF2-HMAC, nunca estas contrasenas en texto plano.
USUARIOS_DEMO = (
    ("Alumno Uno", "alumno1", "DemoAlumnoUno2026!", "alumno"),
    ("Alumna Dos", "alumna2", "DemoAlumnaDos2026!", "alumno"),
    ("Docente Demo", "docente", "DemoDocente2026!", "docente"),
)


def conectar(ruta_db: str | Path = RUTA_DB) -> sqlite3.Connection:
    """Abre SQLite y habilita las claves foraneas para esta conexion."""
    ruta = Path(ruta_db)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    conexion = sqlite3.connect(ruta)
    conexion.execute("PRAGMA foreign_keys = ON")

    activadas = conexion.execute("PRAGMA foreign_keys").fetchone()[0]
    if activadas != 1:
        conexion.close()
        raise RuntimeError("No se pudieron habilitar las claves foraneas de SQLite.")

    return conexion


def crear_hash_contrasena(contrasena: str) -> str:
    """Devuelve un hash PBKDF2-HMAC-SHA256 con sal aleatoria."""
    sal = secrets.token_bytes(LONGITUD_SAL)
    derivado = hashlib.pbkdf2_hmac(
        "sha256",
        contrasena.encode("utf-8"),
        sal,
        ITERACIONES_PBKDF2,
        dklen=LONGITUD_HASH,
    )
    return f"pbkdf2_sha256${ITERACIONES_PBKDF2}${sal.hex()}${derivado.hex()}"


def inicializar_db(ruta_db: str | Path = RUTA_DB) -> None:
    """Crea las tablas y agrega las cuentas demo faltantes sin borrar datos."""
    conexion = conectar(ruta_db)

    try:
        conexion.execute("BEGIN")

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
                nombre_usuario TEXT NOT NULL COLLATE NOCASE UNIQUE
                    CHECK (length(trim(nombre_usuario)) > 0),
                hash_contrasena TEXT NOT NULL,
                rol TEXT NOT NULL CHECK (rol IN ('alumno', 'docente'))
            )
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS progreso_academico (
                usuario_id INTEGER NOT NULL,
                codigo_materia TEXT NOT NULL CHECK (length(trim(codigo_materia)) > 0),
                estado TEXT NOT NULL
                    CHECK (estado IN ('aprobada', 'regular', 'cursando', 'pendiente')),
                PRIMARY KEY (usuario_id, codigo_materia),
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS agenda_usuario (
                usuario_id INTEGER NOT NULL,
                encuentro_id TEXT NOT NULL CHECK (length(trim(encuentro_id)) > 0),
                PRIMARY KEY (usuario_id, encuentro_id),
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
            """
        )

        for nombre, nombre_usuario, contrasena, rol in USUARIOS_DEMO:
            existe = conexion.execute(
                "SELECT 1 FROM usuarios WHERE nombre_usuario = ?",
                (nombre_usuario,),
            ).fetchone()
            if existe:
                continue

            conexion.execute(
                """
                INSERT INTO usuarios (nombre, nombre_usuario, hash_contrasena, rol)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (nombre_usuario) DO NOTHING
                """,
                (nombre, nombre_usuario, crear_hash_contrasena(contrasena), rol),
            )

        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        conexion.close()


if __name__ == "__main__":
    inicializar_db()
    print(f"Base SQLite inicializada en: {RUTA_DB}")
