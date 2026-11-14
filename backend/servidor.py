"""Atiende las solicitudes de login, progreso, agenda y catalogo universitario usando SQLite."""

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from urllib.parse import urlsplit, unquote

from inicializar_db import RUTA_DB, conectar, crear_hash_contrasena


DIRECCION = "127.0.0.1"
PUERTO = int(os.environ.get("BACKEND_PORT", "8000"))
ORIGEN_FRONTEND = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
DURACION_SESION_SEGUNDOS = 8 * 60 * 60
MAX_BYTES_JSON = 64 * 1024
ESTADOS_ACADEMICOS = {"aprobada", "regular", "cursando", "pendiente"}
sesiones: dict[str, tuple[int, float]] = {}
sesiones_lock = Lock()


def aula_canonica(aula: str) -> str:
    return 'Tacuari-Aula5' if aula == 'Aula 5' else aula


def intervalo_solapado(inicio_a: str, fin_a: str, inicio_b: str, fin_b: str) -> bool:
    return inicio_a < fin_b and inicio_b < fin_a


class ErrorSolicitud(Exception):
    """Error de entrada que se responde como JSON al cliente."""

    def __init__(self, estado_http: int, mensaje: str):
        super().__init__(mensaje)
        self.estado_http = estado_http
        self.mensaje = mensaje


def verificar_contrasena(contrasena: str, hash_guardado: str) -> bool:
    """Comprueba el formato PBKDF2 creado por inicializar_db.py."""
    try:
        algoritmo, iteraciones_texto, sal_hex, hash_hex = hash_guardado.split("$")
        if algoritmo != "pbkdf2_sha256":
            return False
        iteraciones = int(iteraciones_texto)
        sal = bytes.fromhex(sal_hex)
        esperado = bytes.fromhex(hash_hex)
        if iteraciones < 1 or len(esperado) == 0:
            return False
        calculado = hashlib.pbkdf2_hmac(
            "sha256", contrasena.encode("utf-8"), sal, iteraciones, dklen=len(esperado)
        )
        return hmac.compare_digest(calculado, esperado)
    except (ValueError, TypeError):
        return False


class ManejadorAPI(BaseHTTPRequestHandler):
    """Valida cada solicitud y devuelve respuestas JSON al frontend."""

    server_version = "UNRNBackend/1.0"

    def log_message(self, formato: str, *argumentos: object) -> None:
        # No se registran cuerpos, contrasenas, tokens ni cabeceras.
        return

    def _responder(self, estado: int, contenido: dict | list | None = None) -> None:
        cuerpo = b"" if contenido is None else json.dumps(contenido, ensure_ascii=False).encode("utf-8")
        self.send_response(estado)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-store")
        origen = self.headers.get("Origin")
        if origen == ORIGEN_FRONTEND:
            self.send_header("Access-Control-Allow-Origin", ORIGEN_FRONTEND)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.end_headers()
        if cuerpo:
            self.wfile.write(cuerpo)

    def _validar_origen(self) -> None:
        origen = self.headers.get("Origin")
        if origen is not None and origen != ORIGEN_FRONTEND:
            raise ErrorSolicitud(403, "Origen no permitido.")

    def _json_entrada(self) -> dict:
        if self.headers.get_content_type() != "application/json":
            raise ErrorSolicitud(415, "Se requiere contenido JSON.")
        try:
            longitud = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise ErrorSolicitud(400, "Longitud de solicitud invalida.") from error
        if longitud < 1 or longitud > MAX_BYTES_JSON:
            raise ErrorSolicitud(400, "Cuerpo JSON vacio o demasiado grande.")
        try:
            datos = json.loads(self.rfile.read(longitud))
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            raise ErrorSolicitud(400, "JSON invalido.") from error
        if not isinstance(datos, dict):
            raise ErrorSolicitud(400, "El cuerpo debe ser un objeto JSON.")
        return datos

    def _usuario_sesion(self) -> int:
        esquema, separador, token = self.headers.get("Authorization", "").partition(" ")
        if not separador or esquema.lower() != "bearer" or not token:
            raise ErrorSolicitud(401, "Autenticacion requerida.")
        ahora = time.time()
        with sesiones_lock:
            sesion = sesiones.get(token)
            if sesion is None:
                raise ErrorSolicitud(401, "Sesion invalida o vencida.")
            if sesion[1] <= ahora:
                sesiones.pop(token, None)
                raise ErrorSolicitud(401, "Sesion invalida o vencida.")
            return sesion[0]

    def _manejar(self, operacion) -> None:
        try:
            self._validar_origen()
            operacion()
        except ErrorSolicitud as error:
            self._responder(error.estado_http, {"error": error.mensaje})
        except sqlite3.Error:
            self._responder(500, {"error": "Error al consultar los datos."})
        except Exception:
            self._responder(500, {"error": "Error interno del servidor."})

    def do_OPTIONS(self) -> None:
        self._manejar(lambda: self._responder(204))

    def do_POST(self) -> None:
        ruta = urlsplit(self.path).path
        if ruta == "/api/registro":
            self._manejar(self._registrar)
        elif ruta == "/api/login":
            self._manejar(self._login)
        elif ruta == "/api/logout":
            self._manejar(self._logout)
        elif ruta == "/api/novedades":
            self._manejar(self._crear_novedad)
        elif ruta == "/api/novedades/like":
            self._manejar(self._like_novedad)
        elif ruta == "/api/admin/solicitudes":
            self._manejar(self._resolver_solicitud)
        elif ruta == "/api/admin/aulas":
            self._manejar(lambda: self._guardar_aula())
        elif ruta == "/api/admin/horarios":
            self._manejar(lambda: self._guardar_horario())
        else:
            self._responder(404, {"error": "Ruta no encontrada."})

    def do_GET(self) -> None:
        ruta = urlsplit(self.path).path
        if ruta == "/api/progreso":
            self._manejar(self._obtener_progreso)
        elif ruta == "/api/agenda":
            self._manejar(self._obtener_agenda)
        elif ruta == "/api/materias":
            self._manejar(self._obtener_materias)
        elif ruta == "/api/aulas":
            self._manejar(self._obtener_aulas)
        elif ruta == "/api/horarios":
            self._manejar(self._obtener_horarios)
        elif ruta == "/api/calendario":
            self._manejar(self._obtener_calendario)
        elif ruta == "/api/novedades":
            self._manejar(self._obtener_novedades)
        elif ruta == "/api/admin/solicitudes":
            self._manejar(self._solicitudes_pendientes)
        else:
            self._responder(404, {"error": "Ruta no encontrada."})

    def do_PUT(self) -> None:
        ruta = urlsplit(self.path).path
        if ruta == "/api/progreso":
            self._manejar(self._actualizar_progreso)
        elif ruta == "/api/agenda":
            self._manejar(self._actualizar_agenda)
        elif ruta.startswith('/api/admin/aulas/'):
            self._manejar(lambda: self._guardar_aula(unquote(ruta[len('/api/admin/aulas/'):])))
        elif ruta.startswith('/api/admin/horarios/'):
            self._manejar(lambda: self._guardar_horario(unquote(ruta[len('/api/admin/horarios/'):])))
        else:
            self._responder(404, {"error": "Ruta no encontrada."})

    def _login(self) -> None:
        datos = self._json_entrada()
        nombre_usuario = datos.get("nombre_usuario")
        contrasena = datos.get("contrasena")
        if (
            not isinstance(nombre_usuario, str)
            or not nombre_usuario.strip()
            or len(nombre_usuario) > 100
            or not isinstance(contrasena, str)
            or not contrasena
            or len(contrasena) > 1024
        ):
            raise ErrorSolicitud(400, "Credenciales con formato invalido.")

        conexion = conectar(RUTA_DB)
        try:
            fila = conexion.execute(
                "SELECT id, nombre, apellido, nombre_usuario, rol, hash_contrasena, estado "
                "FROM usuarios WHERE nombre_usuario = ?",
                (nombre_usuario.strip(),),
            ).fetchone()
        finally:
            conexion.close()

        if fila is None or not verificar_contrasena(contrasena, fila[5]):
            raise ErrorSolicitud(401, "Nombre de usuario o contrasena incorrectos.")
        if fila[4] == 'docente' and fila[6] != 'aprobado':
            raise ErrorSolicitud(403, 'Tu solicitud docente está ' + fila[6] + '.')

        token = secrets.token_urlsafe(32)
        with sesiones_lock:
            sesiones[token] = (fila[0], time.time() + DURACION_SESION_SEGUNDOS)
        self._responder(
            200,
            {
                "token": token,
                "usuario": {
                    "nombre": " ".join(parte for parte in (fila[1], fila[2]) if parte),
                    "apellido": fila[2] or "",
                    "nombre_usuario": fila[3],
                    "rol": fila[4],
                },
            },
        )

    def _registrar(self) -> None:
        datos = self._json_entrada()
        nombre = datos.get("nombre")
        apellido = datos.get("apellido")
        dni = datos.get("dni")
        nombre_usuario = datos.get("nombre_usuario")
        contrasena = datos.get("contrasena")
        rol = datos.get("rol")

        if not all(isinstance(valor, str) and valor.strip() for valor in
                   (nombre, apellido, dni, nombre_usuario, contrasena)):
            raise ErrorSolicitud(400, "Todos los campos son obligatorios.")
        nombre = nombre.strip()
        apellido = apellido.strip()
        dni = dni.strip()
        nombre_usuario = nombre_usuario.strip()
        if len(nombre) > 100 or len(apellido) > 100:
            raise ErrorSolicitud(400, "El nombre y el apellido no pueden superar 100 caracteres.")
        if not re.fullmatch(r"[0-9]{7,8}", dni):
            raise ErrorSolicitud(400, "El DNI debe contener 7 u 8 dígitos.")
        if not re.fullmatch(r"[A-Za-z0-9._-]{3,30}", nombre_usuario):
            raise ErrorSolicitud(400, "El usuario debe tener entre 3 y 30 caracteres alfanuméricos, punto, guion o guion bajo.")
        if len(contrasena) < 8 or len(contrasena) > 1024:
            raise ErrorSolicitud(400, "La contraseña debe tener al menos 8 caracteres.")
        if not isinstance(rol, str) or rol not in {"alumno", "docente"}:
            raise ErrorSolicitud(400, "El rol debe ser alumno o docente.")

        conexion = conectar(RUTA_DB)
        try:
            if conexion.execute("SELECT 1 FROM usuarios WHERE dni = ?", (dni,)).fetchone():
                raise ErrorSolicitud(409, "Ya existe una cuenta registrada con ese DNI.")
            if conexion.execute(
                "SELECT 1 FROM usuarios WHERE nombre_usuario = ? COLLATE NOCASE",
                (nombre_usuario,),
            ).fetchone():
                raise ErrorSolicitud(409, "Ese nombre de usuario ya está en uso.")
            conexion.execute(
                "INSERT INTO usuarios (nombre, apellido, dni, nombre_usuario, hash_contrasena, rol, estado) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (nombre, apellido, dni, nombre_usuario, crear_hash_contrasena(contrasena), rol, 'pendiente' if rol == 'docente' else 'aprobado'),
            )
            conexion.commit()
        except sqlite3.IntegrityError as error:
            raise ErrorSolicitud(409, "El DNI o el nombre de usuario ya está registrado.") from error
        finally:
            conexion.close()

        self._responder(201, {"mensaje": "Solicitud pendiente de aprobación." if rol == 'docente' else "Cuenta creada. Ya podés iniciar sesión."})

    def _exigir_administrador(self, conexion) -> None:
        usuario_id = self._usuario_sesion()
        fila = conexion.execute('SELECT rol, estado FROM usuarios WHERE id = ?', (usuario_id,)).fetchone()
        if not fila or fila != ('administrador', 'aprobado'):
            raise ErrorSolicitud(403, 'Se requiere una cuenta administradora.')

    def _guardar_aula(self, id_existente=None) -> None:
        conexion = conectar(RUTA_DB)
        try:
            conexion.execute('BEGIN IMMEDIATE')
            self._exigir_administrador(conexion)
            datos = self._json_entrada()
            identificador = datos.get('id')
            nombre, sede, tipo = (datos.get(k) for k in ('nombre', 'sede', 'tipo'))
            capacidad = datos.get('capacidadAprox')
            if not isinstance(identificador, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', identificador):
                raise ErrorSolicitud(400, 'El ID debe contener letras, números, guiones o guion bajo.')
            if id_existente is not None and identificador != id_existente:
                raise ErrorSolicitud(400, 'El ID de un aula existente no se puede modificar.')
            if any(not isinstance(v, str) or not v.strip() or len(v.strip()) > 200 for v in (nombre, sede)):
                raise ErrorSolicitud(400, 'Nombre y sede son obligatorios (máximo 200 caracteres).')
            if tipo not in ('aula_teoria', 'laboratorio', 'pecera', 'virtual'):
                raise ErrorSolicitud(400, 'El tipo de aula no es válido.')
            if capacidad is not None and (type(capacidad) is not int or not 1 <= capacidad <= 1000000):
                raise ErrorSolicitud(400, 'La capacidad debe ser un número entero positivo.')
            if id_existente is None:
                try:
                    conexion.execute('INSERT INTO aulas (id, nombre, sede, tipo, capacidad_aprox) VALUES (?, ?, ?, ?, ?)', (identificador, nombre.strip(), sede.strip(), tipo, capacidad))
                except sqlite3.IntegrityError as error:
                    raise ErrorSolicitud(409, 'Ya existe un aula con ese ID.') from error
            else:
                actual = conexion.execute('SELECT tipo FROM aulas WHERE id = ?', (id_existente,)).fetchone()
                if not actual:
                    raise ErrorSolicitud(404, 'No se encontró el aula.')
                if actual[0] == 'virtual' and tipo != 'virtual':
                    filas = conexion.execute('SELECT id, aula_id, dia_semana, hora_desde, hora_hasta FROM horarios_cursada').fetchall()
                    encuentros = [f for f in filas if aula_canonica(f[1]) == aula_canonica(id_existente)]
                    for i, primero in enumerate(encuentros):
                        for segundo in encuentros[i + 1:]:
                            if primero[2] == segundo[2] and intervalo_solapado(primero[3], primero[4], segundo[3], segundo[4]):
                                raise ErrorSolicitud(409, f'No se puede cambiar a aula física: los encuentros {primero[0]} y {segundo[0]} se superponen ({primero[2]}).')
                resultado = conexion.execute('UPDATE aulas SET nombre = ?, sede = ?, tipo = ?, capacidad_aprox = ? WHERE id = ?', (nombre.strip(), sede.strip(), tipo, capacidad, id_existente))
                if resultado.rowcount != 1:
                    raise ErrorSolicitud(404, 'No se encontró el aula.')
            conexion.commit()
            self._responder(201 if id_existente is None else 200, {'mensaje': 'Aula guardada correctamente.'})
        finally:
            conexion.close()

    def _guardar_horario(self, id_existente=None) -> None:
        conexion = conectar(RUTA_DB)
        try:
            conexion.execute('BEGIN IMMEDIATE')
            self._exigir_administrador(conexion)
            datos = self._json_entrada()
            identificador = datos.get('id')
            if not isinstance(identificador, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', identificador):
                raise ErrorSolicitud(400, 'El ID debe contener letras, números, guiones o guion bajo.')
            if id_existente is not None and identificador != id_existente:
                raise ErrorSolicitud(400, 'El ID de un encuentro no se puede modificar.')
            anterior = conexion.execute('SELECT codigo_materia,nombre_materia,anio,aula_id,lugar,dia_semana,hora_desde,hora_hasta FROM horarios_cursada WHERE id = ?', (identificador,)).fetchone()
            if id_existente is None and anterior:
                raise ErrorSolicitud(409, 'Ya existe un encuentro con ese ID.')
            if id_existente is not None and not anterior:
                raise ErrorSolicitud(404, 'No se encontró el encuentro.')
            materia, aula = datos.get('codigoMateria'), datos.get('aula')
            comision, docente = datos.get('comision'), datos.get('docente')
            dia, desde, hasta = datos.get('diaSemana'), datos.get('horaDesde'), datos.get('horaHasta')
            for valor, nombre in ((materia, 'Materia'), (aula, 'Aula'), (comision, 'Comisión'), (docente, 'Docente')):
                if not isinstance(valor, str) or not valor.strip() or len(valor) > 200:
                    raise ErrorSolicitud(400, nombre + ' es obligatorio (máximo 200 caracteres).')
            if dia not in ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'):
                raise ErrorSolicitud(400, 'Día inválido.')
            if not all(isinstance(h, str) and re.fullmatch(r'(?:[01][0-9]|2[0-3]):[0-5][0-9]', h) for h in (desde, hasta)) or desde >= hasta:
                raise ErrorSolicitud(400, 'Las horas deben ser válidas y el inicio anterior al fin.')
            fila_materia = conexion.execute('SELECT nombre, anio FROM materias WHERE codigo_guarani = ?', (materia,)).fetchone()
            fila_aula = conexion.execute('SELECT sede, tipo FROM aulas WHERE id = ?', (aula,)).fetchone()
            if not fila_materia and (not anterior or materia != anterior[0]):
                raise ErrorSolicitud(400, 'Seleccioná una materia válida del catálogo.')
            if not fila_aula and (not anterior or aula != anterior[3]):
                raise ErrorSolicitud(400, 'Seleccioná un aula válida del catálogo.')
            # Los encuentros son semanales; no existe período académico por horario.
            aula_canon = aula_canonica(aula)
            tipo = conexion.execute('SELECT tipo FROM aulas WHERE id = ?', (aula_canon,)).fetchone()
            if not tipo or tipo[0] != 'virtual':
                filas = conexion.execute('SELECT id,aula_id,dia_semana,hora_desde,hora_hasta FROM horarios_cursada WHERE id <> ?', (identificador,)).fetchall()
                for otro_id, otra_aula, otro_dia, otro_inicio, otro_fin in filas:
                    if aula_canonica(otra_aula) != aula_canon or otro_dia != dia:
                        continue
                    inicio, fin = max(desde, otro_inicio), min(hasta, otro_fin)
                    if not intervalo_solapado(desde, hasta, otro_inicio, otro_fin):
                        continue
                    # Se conserva un solapamiento histórico solo si su intervalo no crece.
                    previo = anterior and aula_canonica(anterior[3]) == aula_canon and anterior[5] == dia
                    if previo:
                        inicio_previo, fin_previo = max(anterior[6], otro_inicio), min(anterior[7], otro_fin)
                        previo = inicio_previo < fin_previo and inicio >= inicio_previo and fin <= fin_previo
                    if not previo:
                        raise ErrorSolicitud(409, f'Conflicto de aula con el encuentro {otro_id} ({otro_inicio}–{otro_fin}).')
            minutos = (int(hasta[:2]) * 60 + int(hasta[3:])) - (int(desde[:2]) * 60 + int(desde[3:]))
            duracion = f'{minutos // 60:02}:{minutos % 60:02}'
            nombre_materia, anio = (anterior[1], anterior[2]) if anterior and materia == anterior[0] else fila_materia
            lugar = anterior[4] if anterior and aula == anterior[3] else fila_aula[0]
            valores = (materia, nombre_materia, comision.strip(), lugar, aula, dia, desde, hasta, duracion, docente.strip(), anio)
            if anterior:
                conexion.execute('UPDATE horarios_cursada SET codigo_materia=?,nombre_materia=?,comision=?,lugar=?,aula_id=?,dia_semana=?,hora_desde=?,hora_hasta=?,duracion=?,docente=?,anio=? WHERE id=?', (*valores, identificador))
            else:
                conexion.execute('INSERT INTO horarios_cursada (codigo_materia,nombre_materia,comision,lugar,aula_id,dia_semana,hora_desde,hora_hasta,duracion,docente,anio,id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', (*valores, identificador))
            conexion.commit()
            self._responder(200 if anterior else 201, {'mensaje': 'Encuentro guardado correctamente.'})
        finally:
            conexion.close()

    def _solicitudes_pendientes(self) -> None:
        conexion = conectar(RUTA_DB)
        try:
            self._exigir_administrador(conexion)
            filas = conexion.execute("SELECT id, nombre, apellido, nombre_usuario FROM usuarios WHERE rol = 'docente' AND estado = 'pendiente' ORDER BY id").fetchall()
            self._responder(200, {'solicitudes': [{'id': f[0], 'nombre': f[1], 'apellido': f[2] or '', 'nombre_usuario': f[3]} for f in filas]})
        finally:
            conexion.close()

    def _resolver_solicitud(self) -> None:
        conexion = conectar(RUTA_DB)
        try:
            conexion.execute('BEGIN IMMEDIATE')
            self._exigir_administrador(conexion)
            datos = self._json_entrada()
            usuario_id, estado = datos.get('id'), datos.get('estado')
            if type(usuario_id) is not int or estado not in ('aprobado', 'rechazado'):
                raise ErrorSolicitud(400, 'Solicitud inválida.')
            resultado = conexion.execute("UPDATE usuarios SET estado = ? WHERE id = ? AND rol = 'docente' AND estado = 'pendiente'", (estado, usuario_id))
            if resultado.rowcount != 1:
                raise ErrorSolicitud(409, 'La solicitud ya no está pendiente.')
            conexion.commit()
            self._responder(200, {'mensaje': 'Solicitud actualizada.'})
        finally:
            conexion.close()

    def _logout(self) -> None:
        esquema, separador, token = self.headers.get("Authorization", "").partition(" ")
        if not separador or esquema.lower() != "bearer" or not token:
            raise ErrorSolicitud(401, "Autenticacion requerida.")
        with sesiones_lock:
            if sesiones.pop(token, None) is None:
                raise ErrorSolicitud(401, "Sesion invalida o vencida.")
        self._responder(200, {"status": "ok"})

    def _obtener_progreso(self) -> None:
        usuario_id = self._usuario_sesion()
        conexion = conectar(RUTA_DB)
        try:
            filas = conexion.execute(
                "SELECT codigo_materia, estado FROM progreso_academico "
                "WHERE usuario_id = ? ORDER BY codigo_materia",
                (usuario_id,),
            ).fetchall()
        finally:
            conexion.close()
        self._responder(
            200,
            {
                "progreso": [
                    {"codigo_materia": fila[0], "estado": fila[1]} for fila in filas
                ]
            },
        )

    def _actualizar_progreso(self) -> None:
        usuario_id = self._usuario_sesion()
        datos = self._json_entrada()
        codigo = datos.get("codigo_materia")
        estado = datos.get("estado")
        if not isinstance(codigo, str) or not codigo.strip() or len(codigo) > 50:
            raise ErrorSolicitud(400, "codigo_materia invalido.")
        if not isinstance(estado, str) or estado not in ESTADOS_ACADEMICOS:
            raise ErrorSolicitud(400, "Estado academico invalido.")

        conexion = conectar(RUTA_DB)
        try:
            conexion.execute(
                "INSERT INTO progreso_academico (usuario_id, codigo_materia, estado) "
                "VALUES (?, ?, ?) ON CONFLICT (usuario_id, codigo_materia) "
                "DO UPDATE SET estado = excluded.estado",
                (usuario_id, codigo.strip(), estado),
            )
            conexion.commit()
        finally:
            conexion.close()
        self._responder(200, {"codigo_materia": codigo.strip(), "estado": estado})

    def _obtener_agenda(self) -> None:
        usuario_id = self._usuario_sesion()
        conexion = conectar(RUTA_DB)
        try:
            filas = conexion.execute(
                "SELECT encuentro_id FROM agenda_usuario WHERE usuario_id = ? "
                "ORDER BY encuentro_id",
                (usuario_id,),
            ).fetchall()
        finally:
            conexion.close()
        self._responder(200, {"encuentros": [fila[0] for fila in filas]})

    def _actualizar_agenda(self) -> None:
        usuario_id = self._usuario_sesion()
        datos = self._json_entrada()
        encuentros = datos.get("encuentros")
        if not isinstance(encuentros, list) or len(encuentros) > 500:
            raise ErrorSolicitud(400, "encuentros debe ser una lista de hasta 500 elementos.")
        if any(not isinstance(item, str) or not item.strip() or len(item) > 200 for item in encuentros):
            raise ErrorSolicitud(400, "Cada identificador de encuentro debe ser texto valido.")
        normalizados = [item.strip() for item in encuentros]
        if len(set(normalizados)) != len(normalizados):
            raise ErrorSolicitud(400, "La lista contiene encuentros duplicados.")

        conexion = conectar(RUTA_DB)
        try:
            with conexion:
                conexion.execute("DELETE FROM agenda_usuario WHERE usuario_id = ?", (usuario_id,))
                conexion.executemany(
                    "INSERT INTO agenda_usuario (usuario_id, encuentro_id) VALUES (?, ?)",
                    ((usuario_id, encuentro_id) for encuentro_id in normalizados),
                )
        finally:
            conexion.close()
        self._responder(200, {"encuentros": normalizados})

    # =========================================================================
    # CATALOGO UNIVERSITARIO (Datos maestros en SQLite)
    # =========================================================================

    def _obtener_materias(self) -> None:
        conexion = conectar(RUTA_DB)
        try:
            info_filas = conexion.execute("SELECT clave, valor FROM info_carrera").fetchall()
            info_carrera = {}
            for k, v in info_filas:
                try:
                    info_carrera[k] = json.loads(v)
                except Exception:
                    info_carrera[k] = v

            correlativas_filas = conexion.execute(
                "SELECT materia_codigo, requisito_codigo, tipo_requisito FROM correlativas"
            ).fetchall()
            corr_map = {}
            for mat_cod, req_cod, tipo in correlativas_filas:
                if mat_cod not in corr_map:
                    corr_map[mat_cod] = {
                        "regularizadaParaCursar": [],
                        "aprobadaParaCursar": [],
                        "aprobadaParaAprobar": []
                    }
                if tipo == "regularizada_para_cursar":
                    corr_map[mat_cod]["regularizadaParaCursar"].append(req_cod)
                elif tipo == "aprobada_para_cursar":
                    corr_map[mat_cod]["aprobadaParaCursar"].append(req_cod)
                elif tipo == "aprobada_para_aprobar":
                    corr_map[mat_cod]["aprobadaParaAprobar"].append(req_cod)

            obj_filas = conexion.execute(
                "SELECT materia_codigo, objetivo FROM objetivos_materia ORDER BY id"
            ).fetchall()
            obj_map = {}
            for mat_cod, obj in obj_filas:
                obj_map.setdefault(mat_cod, []).append(obj)

            materias_filas = conexion.execute(
                """
                SELECT codigo_guarani, nro_orden, nombre, anio, cuatrimestre,
                       horas_semanales, horas_totales, es_optativa, contenidos_minimos
                FROM materias ORDER BY anio, cuatrimestre, nro_orden
                """
            ).fetchall()

            materias = []
            for fila in materias_filas:
                cod = fila[0]
                corrs = corr_map.get(cod, {
                    "regularizadaParaCursar": [],
                    "aprobadaParaCursar": [],
                    "aprobadaParaAprobar": []
                })
                materias.append({
                    "codigoGuarani": cod,
                    "nroOrden": fila[1],
                    "nombre": fila[2],
                    "anio": fila[3],
                    "cuatrimestre": fila[4],
                    "horasSemanales": fila[5],
                    "horasTotales": fila[6],
                    "esOptativa": bool(fila[7]),
                    "contenidosMinimos": fila[8] or "",
                    "regularizadaParaCursar": corrs["regularizadaParaCursar"],
                    "aprobadaParaCursar": corrs["aprobadaParaCursar"],
                    "aprobadaParaAprobar": corrs["aprobadaParaAprobar"],
                    "objetivos": obj_map.get(cod, [])
                })
        finally:
            conexion.close()

        self._responder(200, {"materias": materias, "infoCarrera": info_carrera})

    def _obtener_aulas(self) -> None:
        conexion = conectar(RUTA_DB)
        try:
            filas = conexion.execute(
                "SELECT id, nombre, sede, tipo, capacidad_aprox FROM aulas ORDER BY id"
            ).fetchall()
        finally:
            conexion.close()

        aulas = [
            {
                "id": f[0],
                "nombre": f[1],
                "sede": f[2],
                "tipo": f[3],
                "capacidadAprox": f[4]
            }
            for f in filas
        ]
        self._responder(200, {"aulas": aulas})

    def _obtener_horarios(self) -> None:
        conexion = conectar(RUTA_DB)
        try:
            filas = conexion.execute(
                """
                SELECT id, codigo_materia, nombre_materia, comision, tipo_clase, lugar,
                       aula_id, dia_semana, hora_desde, hora_hasta, duracion, docente,
                       email_docente, auxiliar, email_auxiliar, observaciones, anio
                FROM horarios_cursada ORDER BY anio, codigo_materia, comision, dia_semana
                """
            ).fetchall()
        finally:
            conexion.close()

        horarios = [
            {
                "id": f[0],
                "codigoMateria": f[1],
                "nombreMateria": f[2],
                "comision": f[3],
                "tipoClase": f[4],
                "lugar": f[5],
                "aula": f[6],
                "diaSemana": f[7],
                "horaDesde": f[8],
                "horaHasta": f[9],
                "duracion": f[10],
                "docente": f[11],
                "emailDocente": f[12],
                "auxiliar": f[13],
                "emailAuxiliar": f[14],
                "observaciones": f[15],
                "anio": f[16]
            }
            for f in filas
        ]
        self._responder(200, {"horarios": horarios})

    def _obtener_calendario(self) -> None:
        conexion = conectar(RUTA_DB)
        try:
            filas = conexion.execute(
                """
                SELECT id, fecha_texto, fecha_inicio, fecha_fin, titulo, categoria, descripcion, resolucion
                FROM eventos_calendario ORDER BY fecha_inicio
                """
            ).fetchall()
        finally:
            conexion.close()

        eventos = [
            {
                "id": f[0],
                "fechaTexto": f[1],
                "fechaInicio": f[2],
                "fechaFin": f[3],
                "titulo": f[4],
                "categoria": f[5],
                "descripcion": f[6],
                "resolucion": f[7]
            }
            for f in filas
        ]
        self._responder(200, {"eventos": eventos})

    def _obtener_novedades(self) -> None:
        conexion = conectar(RUTA_DB)
        try:
            filas = conexion.execute(
                """
                SELECT id, titulo, contenido, autor, rol_autor, codigo_materia,
                       nombre_materia, fecha, hora, importante, likes
                FROM novedades_cartelera ORDER BY fecha DESC, hora DESC, id DESC
                """
            ).fetchall()
        finally:
            conexion.close()

        novedades = [
            {
                "id": f[0],
                "titulo": f[1],
                "contenido": f[2],
                "autor": f[3],
                "rolAutor": f[4],
                "codigoMateria": f[5],
                "nombreMateria": f[6],
                "fecha": f[7],
                "hora": f[8],
                "importante": bool(f[9]),
                "likes": f[10]
            }
            for f in filas
        ]
        self._responder(200, {"novedades": novedades})

    def _crear_novedad(self) -> None:
        usuario_id = self._usuario_sesion()
        conexion = conectar(RUTA_DB)
        try:
            usuario = conexion.execute(
                "SELECT id, nombre, apellido, rol, estado FROM usuarios WHERE id = ?",
                (usuario_id,)
            ).fetchone()
            if not usuario or usuario[3] != "docente" or usuario[4] != 'aprobado':
                raise ErrorSolicitud(403, "Solo los docentes pueden publicar comunicados.")

            datos = self._json_entrada()
            titulo = datos.get("titulo")
            contenido = datos.get("contenido")
            if not isinstance(titulo, str) or not titulo.strip() or len(titulo) > 200:
                raise ErrorSolicitud(400, "Titulo invalido.")
            if not isinstance(contenido, str) or not contenido.strip() or len(contenido) > 5000:
                raise ErrorSolicitud(400, "Contenido invalido.")

            codigo_materia = datos.get("codigoMateria")
            nombre_materia = datos.get("nombreMateria")
            autor = " ".join(parte for parte in (usuario[1], usuario[2]) if parte)
            rol_autor = "Docente"
            importante = bool(datos.get("importante", True))

            ahora_fecha = time.strftime("%Y-%m-%d")
            ahora_hora = time.strftime("%H:%M")
            nov_id = f"nov-{int(time.time() * 1000)}"

            conexion.execute(
                """
                INSERT INTO novedades_cartelera
                (id, titulo, contenido, autor, rol_autor, codigo_materia, nombre_materia, fecha, hora, importante, likes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                """,
                (
                    nov_id,
                    titulo.strip(),
                    contenido.strip(),
                    autor,
                    rol_autor,
                    codigo_materia,
                    nombre_materia,
                    ahora_fecha,
                    ahora_hora,
                    1 if importante else 0
                )
            )
            conexion.commit()
        finally:
            conexion.close()

        self._responder(
            201,
            {
                "novedad": {
                    "id": nov_id,
                    "titulo": titulo.strip(),
                    "contenido": contenido.strip(),
                    "autor": autor,
                    "rolAutor": rol_autor,
                    "codigoMateria": codigo_materia,
                    "nombreMateria": nombre_materia,
                    "fecha": ahora_fecha,
                    "hora": ahora_hora,
                    "importante": importante,
                    "likes": 0
                }
            }
        )

    def _like_novedad(self) -> None:
        datos = self._json_entrada()
        nov_id = datos.get("id")
        if not isinstance(nov_id, str) or not nov_id.strip():
            raise ErrorSolicitud(400, "id de novedad invalido.")

        conexion = conectar(RUTA_DB)
        try:
            conexion.execute(
                "UPDATE novedades_cartelera SET likes = likes + 1 WHERE id = ?",
                (nov_id.strip(),)
            )
            conexion.commit()
            fila = conexion.execute(
                "SELECT likes FROM novedades_cartelera WHERE id = ?",
                (nov_id.strip(),)
            ).fetchone()
            if not fila:
                raise ErrorSolicitud(404, "Aviso no encontrado.")
            likes = fila[0]
        finally:
            conexion.close()

        self._responder(200, {"id": nov_id, "likes": likes})


def iniciar_servidor() -> None:
    """Inicia el servidor local y limpia las sesiones al detenerlo."""
    # La migración es explícita: el arranque nunca modifica el esquema.
    conexion = sqlite3.connect(RUTA_DB.resolve().as_uri() + '?mode=ro', uri=True)
    try:
        existe = conexion.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'migraciones'").fetchone()
        if not existe or not conexion.execute("SELECT 1 FROM migraciones WHERE version = 1").fetchone():
            raise RuntimeError('Se requiere la migración de administrador versión 1.')
    finally:
        conexion.close()
    servidor = ThreadingHTTPServer((DIRECCION, PUERTO), ManejadorAPI)
    print(f"Backend local disponible en http://{DIRECCION}:{PUERTO}")
    print(f"Origen frontend permitido: {ORIGEN_FRONTEND}")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        servidor.server_close()
        with sesiones_lock:
            sesiones.clear()


if __name__ == "__main__":
    iniciar_servidor()
