# Backend simple - SQLite

Esta etapa prepara la base local del prototipo. Usa `sqlite3`, incluida en la biblioteca estandar de Python. Todavia no incluye servidor HTTP ni autenticacion.

## Inicializar

Requiere Python 3.10 o posterior. Desde esta carpeta ejecutar:

```powershell
py .\inicializar_db.py
```

El script crea `data/unrn_computacion.db`, las tres tablas y las cuentas demo que falten. También actualiza las credenciales demo anteriores y renombra `alumna2` a `alumno2`, conservando sus identificadores y datos asociados. Se puede ejecutar nuevamente: no duplica usuarios, borra progreso o selecciones, ni restablece contraseñas que hayan sido cambiadas posteriormente. Las contraseñas se almacenan como hashes PBKDF2-HMAC-SHA256 con sal aleatoria.

## Tablas

- `usuarios`: perfil, nombre de usuario unico, hash de contrasena y rol (`alumno` o `docente`).
- `progreso_academico`: estado por usuario y codigo de materia. El codigo coincide con `MateriaRaw.codigoGuarani` del frontend.
- `agenda_usuario`: encuentros seleccionados por usuario. `encuentro_id` conserva como texto el `HorarioCursadaRaw.id` del frontend; los horarios siguen precargados en React y no se duplican en SQLite en esta etapa.

Las claves foraneas se habilitan con `PRAGMA foreign_keys = ON` en cada conexion abierta por `conectar()`.

## Verificar tablas

Desde esta carpeta:

```powershell
py -c "import sqlite3; c=sqlite3.connect('data/unrn_computacion.db'); c.execute('PRAGMA foreign_keys=ON'); print(c.execute(\"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name\").fetchall()); print(c.execute('SELECT nombre_usuario, rol, hash_contrasena FROM usuarios ORDER BY nombre_usuario').fetchall()); print(c.execute('PRAGMA foreign_key_check').fetchall()); c.close()"
```

La salida de `foreign_key_check` debe ser una lista vacia. El archivo `.db` local esta excluido por `.gitignore`.

## Cuentas de demostracion

Estas cuentas son solo para el prototipo local:

| Usuario | Contrasena de prueba | Rol |
|---|---|---|
| `alumno1` | `alumno1` | alumno |
| `alumno2` | `alumno2` | alumno |
| `docente` | `docente` | docente |

No reutilizar estas credenciales fuera de la demostracion.

## Servidor HTTP local

Desde esta carpeta, iniciar el servidor con:

```powershell
py .\servidor.py
```

El servidor escucha solamente en `127.0.0.1:8000`. Durante desarrollo permite el origen `http://localhost:5173`; se puede cambiar mediante `FRONTEND_ORIGIN`. El puerto puede cambiarse mediante `BACKEND_PORT`. No requiere dependencias externas.

### API

- `POST /api/login`: recibe `{ "nombre_usuario": "alumno1", "contrasena": "..." }`; devuelve un token temporal y el perfil.
- `POST /api/logout`: invalida la sesión del token enviado como `Authorization: Bearer <token>`.
- `GET /api/progreso`: devuelve los estados académicos del usuario autenticado.
- `PUT /api/progreso`: recibe `{ "codigo_materia": "B6000", "estado": "cursando" }` y crea o actualiza ese estado.
- `GET /api/agenda`: devuelve los IDs de encuentros seleccionados por el usuario autenticado.
- `PUT /api/agenda`: recibe `{ "encuentros": ["id-del-frontend"] }` y reemplaza la selección de ese usuario en una transacción.

Progreso y agenda requieren sesión. Los estados aceptados son `aprobada`, `regular`, `cursando` y `pendiente`. Como los horarios siguen solamente en React, el servidor valida formato y duplicados de IDs, pero todavía no puede verificar que existan en los datos de horarios. Los tokens son aleatorios, viven en memoria hasta ocho horas y se invalidan al cerrar sesión o reiniciar el servidor. Progreso y agenda sí persisten en SQLite.

Las respuestas son JSON. Los errores de entrada devuelven 400, credenciales o sesiones inválidas 401, origen no permitido 403, rutas inexistentes 404 y errores internos genéricos 500. No se escriben contraseñas ni tokens en los logs.
