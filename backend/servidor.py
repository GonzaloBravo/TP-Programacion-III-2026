"""Servidor HTTP local para el prototipo de Programacion III."""

import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from urllib.parse import urlsplit

from inicializar_db import RUTA_DB, conectar


DIRECCION = "127.0.0.1"
PUERTO = int(os.environ.get("BACKEND_PORT", "8000"))
ORIGEN_FRONTEND = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
DURACION_SESION_SEGUNDOS = 8 * 60 * 60
MAX_BYTES_JSON = 64 * 1024
ESTADOS_ACADEMICOS = {"aprobada", "regular", "cursando", "pendiente"}
sesiones: dict[str, tuple[int, float]] = {}
sesiones_lock = Lock()


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
        if ruta == "/api/login":
            self._manejar(self._login)
        elif ruta == "/api/logout":
            self._manejar(self._logout)
        else:
            self._responder(404, {"error": "Ruta no encontrada."})

    def do_GET(self) -> None:
        ruta = urlsplit(self.path).path
        if ruta == "/api/progreso":
            self._manejar(self._obtener_progreso)
        elif ruta == "/api/agenda":
            self._manejar(self._obtener_agenda)
        else:
            self._responder(404, {"error": "Ruta no encontrada."})

    def do_PUT(self) -> None:
        ruta = urlsplit(self.path).path
        if ruta == "/api/progreso":
            self._manejar(self._actualizar_progreso)
        elif ruta == "/api/agenda":
            self._manejar(self._actualizar_agenda)
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
                "SELECT id, nombre, nombre_usuario, rol, hash_contrasena "
                "FROM usuarios WHERE nombre_usuario = ?",
                (nombre_usuario.strip(),),
            ).fetchone()
        finally:
            conexion.close()

        if fila is None or not verificar_contrasena(contrasena, fila[4]):
            raise ErrorSolicitud(401, "Nombre de usuario o contrasena incorrectos.")

        token = secrets.token_urlsafe(32)
        with sesiones_lock:
            sesiones[token] = (fila[0], time.time() + DURACION_SESION_SEGUNDOS)
        self._responder(
            200,
            {
                "token": token,
                "usuario": {
                    "nombre": fila[1],
                    "nombre_usuario": fila[2],
                    "rol": fila[3],
                },
            },
        )

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


def iniciar_servidor() -> None:
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
