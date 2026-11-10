"""Prepara la base SQLite, crea las tablas maestras y las cuentas de demostracion."""

import hashlib
import json
import secrets
import sqlite3
from pathlib import Path


DIRECTORIO_BACKEND = Path(__file__).resolve().parent
RUTA_DB = DIRECTORIO_BACKEND / "data" / "unrn_computacion.db"
RUTA_SEED = DIRECTORIO_BACKEND / "data" / "seed_data.json"

ITERACIONES_PBKDF2 = 310_000
LONGITUD_SAL = 16
LONGITUD_HASH = 32

# Credenciales unicamente para el prototipo local de Programacion III.
# La base guarda el resultado PBKDF2-HMAC, nunca estas contrasenas en texto plano.
USUARIOS_DEMO = (
    ("Alumno Uno", "alumno1", "alumno1", "alumno"),
    ("Alumno Dos", "alumno2", "alumno2", "alumno"),
    ("Docente Demo", "docente", "docente", "docente"),
)

# Se usan solo para reconocer las credenciales demo anteriores durante la migracion.
CONTRASENAS_DEMO_ANTERIORES = {
    "alumno1": "DemoAlumnoUno2026!",
    "alumno2": "DemoAlumnaDos2026!",
    "docente": "DemoDocente2026!",
}
NOMBRE_USUARIO_ANTERIOR = "alumna2"


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


def migrar_columnas_usuarios(conexion: sqlite3.Connection) -> None:
    """Agrega los datos de registro sin borrar cuentas ni datos académicos."""
    columnas = {fila[1] for fila in conexion.execute("PRAGMA table_info(usuarios)")}
    if not columnas:
        raise RuntimeError("La tabla usuarios no existe; inicialice la base primero.")
    if "apellido" not in columnas:
        conexion.execute("ALTER TABLE usuarios ADD COLUMN apellido TEXT")
    if "dni" not in columnas:
        conexion.execute("ALTER TABLE usuarios ADD COLUMN dni TEXT")
    conexion.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_dni "
        "ON usuarios(dni) WHERE dni IS NOT NULL"
    )


def verificar_hash_contrasena(contrasena: str, hash_guardado: str) -> bool:
    """Comprueba si una contraseña coincide con un hash PBKDF2 guardado."""
    try:
        algoritmo, iteraciones_texto, sal_hex, hash_hex = hash_guardado.split("$")
        if algoritmo != "pbkdf2_sha256":
            return False
        iteraciones = int(iteraciones_texto)
        sal = bytes.fromhex(sal_hex)
        esperado = bytes.fromhex(hash_hex)
        calculado = hashlib.pbkdf2_hmac(
            "sha256", contrasena.encode("utf-8"), sal, iteraciones, dklen=len(esperado)
        )
        return secrets.compare_digest(calculado, esperado)
    except (ValueError, TypeError):
        return False


def inicializar_db(ruta_db: str | Path = RUTA_DB) -> None:
    """Crea las tablas y agrega las cuentas demo y los datos maestros sin borrar datos."""
    conexion = conectar(ruta_db)

    try:
        conexion.execute("BEGIN")

        # 1. Tablas de usuarios y sesion
        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
                apellido TEXT,
                dni TEXT,
                nombre_usuario TEXT NOT NULL COLLATE NOCASE UNIQUE
                    CHECK (length(trim(nombre_usuario)) > 0),
                hash_contrasena TEXT NOT NULL,
                rol TEXT NOT NULL CHECK (rol IN ('alumno', 'docente'))
            )
            """
        )

        migrar_columnas_usuarios(conexion)

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

        # 2. Tablas del Catalogo Universitario (Migracion de datos maestros)
        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS info_carrera (
                clave TEXT PRIMARY KEY,
                valor TEXT NOT NULL
            )
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS materias (
                codigo_guarani TEXT PRIMARY KEY,
                nro_orden TEXT,
                nombre TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
                anio INTEGER NOT NULL CHECK (anio BETWEEN 1 AND 5),
                cuatrimestre INTEGER NOT NULL CHECK (cuatrimestre IN (1, 2)),
                horas_semanales INTEGER,
                horas_totales INTEGER NOT NULL,
                es_optativa INTEGER NOT NULL DEFAULT 0,
                contenidos_minimos TEXT
            )
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS correlativas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                materia_codigo TEXT NOT NULL,
                requisito_codigo TEXT NOT NULL,
                tipo_requisito TEXT NOT NULL CHECK (
                    tipo_requisito IN ('regularizada_para_cursar', 'aprobada_para_cursar', 'aprobada_para_aprobar')
                ),
                FOREIGN KEY (materia_codigo) REFERENCES materias(codigo_guarani) ON DELETE CASCADE,
                UNIQUE (materia_codigo, requisito_codigo, tipo_requisito)
            )
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS objetivos_materia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                materia_codigo TEXT NOT NULL,
                objetivo TEXT NOT NULL,
                FOREIGN KEY (materia_codigo) REFERENCES materias(codigo_guarani) ON DELETE CASCADE
            )
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS aulas (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                sede TEXT NOT NULL,
                tipo TEXT NOT NULL,
                capacidad_aprox INTEGER
            )
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS horarios_cursada (
                id TEXT PRIMARY KEY,
                codigo_materia TEXT NOT NULL,
                nombre_materia TEXT NOT NULL,
                comision TEXT NOT NULL,
                tipo_clase TEXT,
                lugar TEXT,
                aula_id TEXT,
                dia_semana TEXT NOT NULL,
                hora_desde TEXT NOT NULL,
                hora_hasta TEXT NOT NULL,
                duracion TEXT NOT NULL,
                docente TEXT NOT NULL,
                email_docente TEXT,
                auxiliar TEXT,
                email_auxiliar TEXT,
                observaciones TEXT,
                anio INTEGER NOT NULL
            )
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS eventos_calendario (
                id TEXT PRIMARY KEY,
                fecha_texto TEXT NOT NULL,
                fecha_inicio TEXT NOT NULL,
                fecha_fin TEXT,
                titulo TEXT NOT NULL,
                categoria TEXT NOT NULL,
                descripcion TEXT,
                resolucion TEXT
            )
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS novedades_cartelera (
                id TEXT PRIMARY KEY,
                titulo TEXT NOT NULL,
                contenido TEXT NOT NULL,
                autor TEXT NOT NULL,
                rol_autor TEXT NOT NULL,
                codigo_materia TEXT,
                nombre_materia TEXT,
                fecha TEXT NOT NULL,
                hora TEXT NOT NULL,
                importante INTEGER NOT NULL DEFAULT 0,
                likes INTEGER NOT NULL DEFAULT 0
            )
            """
        )

        # 3. Migracion / Ajuste de usuarios de prueba
        usuario_anterior = conexion.execute(
            "SELECT id FROM usuarios WHERE nombre_usuario = ?",
            (NOMBRE_USUARIO_ANTERIOR,),
        ).fetchone()
        usuario_nuevo = conexion.execute(
            "SELECT id FROM usuarios WHERE nombre_usuario = ?",
            ("alumno2",),
        ).fetchone()
        if usuario_anterior and usuario_nuevo and usuario_anterior[0] != usuario_nuevo[0]:
            raise RuntimeError(
                "Existen cuentas distintas para 'alumna2' y 'alumno2'; "
                "se requiere resolver la identidad antes de continuar."
            )
        if usuario_anterior and not usuario_nuevo:
            conexion.execute(
                "UPDATE usuarios SET nombre = ?, nombre_usuario = ? WHERE id = ?",
                ("Alumno Dos", "alumno2", usuario_anterior[0]),
            )

        for nombre, nombre_usuario, contrasena, rol in USUARIOS_DEMO:
            existente = conexion.execute(
                "SELECT id, hash_contrasena, rol FROM usuarios WHERE nombre_usuario = ?",
                (nombre_usuario,),
            ).fetchone()
            if existente:
                if existente[2] != rol:
                    raise RuntimeError(
                        f"El rol de la cuenta demo '{nombre_usuario}' no coincide con el esperado."
                    )

                contrasena_anterior = CONTRASENAS_DEMO_ANTERIORES[nombre_usuario]
                if verificar_hash_contrasena(contrasena_anterior, existente[1]):
                    conexion.execute(
                        "UPDATE usuarios SET hash_contrasena = ? WHERE id = ?",
                        (crear_hash_contrasena(contrasena), existente[0]),
                    )
                continue

            conexion.execute(
                """
                INSERT INTO usuarios (nombre, nombre_usuario, hash_contrasena, rol)
                VALUES (?, ?, ?, ?)
                """,
                (nombre, nombre_usuario, crear_hash_contrasena(contrasena), rol),
            )

        # 4. Poblar datos maestros desde seed_data.json si esta disponible
        if RUTA_SEED.exists():
            with open(RUTA_SEED, "r", encoding="utf-8") as f:
                seed = json.load(f)

            # Info carrera
            if "info_carrera" in seed and isinstance(seed["info_carrera"], dict):
                for k, v in seed["info_carrera"].items():
                    val_str = json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else str(v)
                    conexion.execute(
                        "INSERT OR REPLACE INTO info_carrera (clave, valor) VALUES (?, ?)",
                        (k, val_str)
                    )

            # Materias, correlativas y objetivos
            for m in seed.get("materias", []):
                cod = m["codigoGuarani"]
                conexion.execute(
                    """
                    INSERT OR REPLACE INTO materias 
                    (codigo_guarani, nro_orden, nombre, anio, cuatrimestre, horas_semanales, horas_totales, es_optativa, contenidos_minimos)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        cod,
                        m.get("nroOrden", ""),
                        m["nombre"],
                        m["anio"],
                        m["cuatrimestre"],
                        m.get("horasSemanales", 0),
                        m.get("horasTotales", 0),
                        1 if m.get("esOptativa") else 0,
                        m.get("contenidosMinimos", "")
                    )
                )

                for req in m.get("regularizadaParaCursar", []):
                    conexion.execute(
                        """
                        INSERT OR IGNORE INTO correlativas 
                        (materia_codigo, requisito_codigo, tipo_requisito)
                        VALUES (?, ?, 'regularizada_para_cursar')
                        """,
                        (cod, req)
                    )
                for req in m.get("aprobadaParaCursar", []):
                    conexion.execute(
                        """
                        INSERT OR IGNORE INTO correlativas 
                        (materia_codigo, requisito_codigo, tipo_requisito)
                        VALUES (?, ?, 'aprobada_para_cursar')
                        """,
                        (cod, req)
                    )
                for req in m.get("aprobadaParaAprobar", []):
                    conexion.execute(
                        """
                        INSERT OR IGNORE INTO correlativas 
                        (materia_codigo, requisito_codigo, tipo_requisito)
                        VALUES (?, ?, 'aprobada_para_aprobar')
                        """,
                        (cod, req)
                    )

                for obj in m.get("objetivos", []):
                    existe_obj = conexion.execute(
                        "SELECT 1 FROM objetivos_materia WHERE materia_codigo = ? AND objetivo = ?",
                        (cod, obj)
                    ).fetchone()
                    if not existe_obj:
                        conexion.execute(
                            "INSERT INTO objetivos_materia (materia_codigo, objetivo) VALUES (?, ?)",
                            (cod, obj)
                        )

            # Aulas
            for a in seed.get("aulas", []):
                conexion.execute(
                    """
                    INSERT OR REPLACE INTO aulas (id, nombre, sede, tipo, capacidad_aprox)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (a["id"], a["nombre"], a["sede"], a["tipo"], a.get("capacidadAprox"))
                )

            # Horarios de cursada
            for h in seed.get("horarios", []):
                conexion.execute(
                    """
                    INSERT OR REPLACE INTO horarios_cursada
                    (id, codigo_materia, nombre_materia, comision, tipo_clase, lugar, aula_id, dia_semana, hora_desde, hora_hasta, duracion, docente, email_docente, auxiliar, email_auxiliar, observaciones, anio)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        h["id"],
                        h["codigoMateria"],
                        h["nombreMateria"],
                        h["comision"],
                        h.get("tipoClase", "Teoría / Práctica"),
                        h.get("lugar", ""),
                        h.get("aula", ""),
                        h["diaSemana"],
                        h["horaDesde"],
                        h["horaHasta"],
                        h["duracion"],
                        h["docente"],
                        h.get("emailDocente"),
                        h.get("auxiliar"),
                        h.get("emailAuxiliar"),
                        h.get("observaciones"),
                        h.get("anio", 1)
                    )
                )

            # Calendario
            for ev in seed.get("calendario", []):
                conexion.execute(
                    """
                    INSERT OR REPLACE INTO eventos_calendario
                    (id, fecha_texto, fecha_inicio, fecha_fin, titulo, categoria, descripcion, resolucion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        ev["id"],
                        ev["fechaTexto"],
                        ev["fechaInicio"],
                        ev.get("fechaFin"),
                        ev["titulo"],
                        ev["categoria"],
                        ev.get("descripcion"),
                        ev.get("resolucion")
                    )
                )

            # Novedades iniciales (INSERT OR IGNORE para respetar avisos docentes creados)
            for nov in seed.get("novedades", []):
                conexion.execute(
                    """
                    INSERT OR IGNORE INTO novedades_cartelera
                    (id, titulo, contenido, autor, rol_autor, codigo_materia, nombre_materia, fecha, hora, importante, likes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        nov["id"],
                        nov["titulo"],
                        nov["contenido"],
                        nov["autor"],
                        nov["rolAutor"],
                        nov.get("codigoMateria"),
                        nov.get("nombreMateria"),
                        nov["fecha"],
                        nov["hora"],
                        1 if nov.get("importante") else 0,
                        nov.get("likes", 0)
                    )
                )

        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        conexion.close()


if __name__ == "__main__":
    inicializar_db()
    print(f"Base SQLite inicializada exitosamente en: {RUTA_DB}")
