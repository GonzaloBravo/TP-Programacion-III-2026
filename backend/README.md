# Backend Python + SQLite

## 1. ¿Qué hace este backend?

El backend ofrece una API local para iniciar y cerrar sesión, guardar el progreso académico de cada alumno y conservar su agenda personalizada. El frontend React se comunica con él mediante solicitudes HTTP.

## 2. Requisitos

- Python 3.10 o superior.
- SQLite ya viene incluido en Python; no hace falta instalarlo por separado.
- Para usar la aplicación completa, también se necesita Node.js y npm para ejecutar el frontend.

En Windows, los comandos de esta guía utilizan el lanzador `py`.

## 3. Primera ejecución

1. Abrí una terminal, por ejemplo PowerShell.
2. Desde la carpeta raíz del repositorio, entrá a `backend`:

   ```powershell
   cd backend
   ```

3. Creá la base local y las cuentas de demostración:

   ```powershell
   py inicializar_db.py
   ```

   Esto crea `data/unrn_computacion.db` si todavía no existe. Las contraseñas se guardan como hashes PBKDF2-HMAC con sal aleatoria. El inicializador conserva el progreso y la agenda que ya existan.

4. Iniciá el servidor:

   ```powershell
   py servidor.py
   ```

El backend queda escuchando en `http://127.0.0.1:8000`. Dejá esta terminal abierta mientras usás la aplicación.

## 4. Ejecuciones posteriores

Una vez creada la base local, normalmente solo hace falta entrar a `backend` e iniciar el servidor:

```powershell
cd backend
py servidor.py
```

No vuelvas a inicializar la base en cada ejecución. El inicializador es repetible y no borra datos, pero se usa principalmente la primera vez o cuando se necesite preparar las cuentas demo.

## 5. Cómo utilizarlo con el frontend

Mantené el backend abierto en una terminal. Abrí una segunda terminal desde la raíz del repositorio y ejecutá:

```powershell
cd unrn-computacion-app
npm.cmd ci
npm.cmd run dev
```

`npm.cmd ci` instala las dependencias del frontend; normalmente alcanza con ejecutarlo la primera vez. Vite muestra la dirección local, habitualmente `http://localhost:5173`. Abrila en el navegador. El backend debe seguir disponible en `http://127.0.0.1:8000`.

Para detener los servicios, presioná **Ctrl+C** en cada terminal: una para React y otra para Python.

## 6. Usuarios de prueba

Estas cuentas se utilizan solo para la demostración académica:

| Usuario | Contraseña | Rol |
|---|---|---|
| `alumno1` | `alumno1` | alumno |
| `alumno2` | `alumno2` | alumno |
| `docente` | `docente` | docente |

## 7. ¿Qué información se guarda?

- **`usuarios`** guarda el nombre, nombre de usuario, hash de contraseña y rol (`alumno` o `docente`). Nunca guarda la contraseña en texto plano.
- **`progreso_academico`** guarda el estado de cada materia por alumno, por ejemplo aprobada, regular o cursando.
- **`agenda_usuario`** guarda los identificadores de los encuentros seleccionados por cada usuario. Los horarios y las materias de referencia siguen definidos en el frontend.

La base vive en `backend/data/unrn_computacion.db` y está excluida del control de versiones. El progreso y la agenda permanecen guardados aunque se cierre el servidor.

## 8. Información técnica

El servidor usa bibliotecas incluidas en Python (`http.server`, `sqlite3` y `json`); no requiere instalar dependencias de backend.

| Método y ruta | Función |
|---|---|
| `POST /api/login` | Verifica las credenciales y devuelve un token de sesión y el perfil. |
| `POST /api/logout` | Invalida la sesión actual. |
| `GET /api/progreso` | Consulta el progreso del usuario autenticado. |
| `PUT /api/progreso` | Guarda el estado de una materia del usuario autenticado. |
| `GET /api/agenda` | Consulta los encuentros seleccionados por el usuario autenticado. |
| `PUT /api/agenda` | Guarda la selección de encuentros de ese usuario. |

Las rutas de progreso y agenda requieren el token enviado como `Authorization: Bearer <token>`. El servidor obtiene el usuario de esa sesión, no de un identificador enviado por React. Los tokens viven en memoria hasta ocho horas o hasta que se cierre la sesión o se reinicie el servidor. Por eso, tras reiniciar Python hay que iniciar sesión otra vez; el progreso y la agenda siguen en SQLite.

El acceso de desarrollo está limitado al frontend `http://localhost:5173`. El servidor escucha en `127.0.0.1:8000`.

## 9. Problemas frecuentes

- **Windows no reconoce `py`:** probá `python` en lugar de `py`. Si tampoco aparece, instalá Python 3.10 o posterior y habilitá la opción para agregarlo al `PATH`.
- **El frontend indica que no puede conectarse:** comprobá que la terminal del backend siga abierta y que muestre que está escuchando en el puerto 8000. Si se cerró, volvé a iniciar `py servidor.py` desde `backend`.
- **El puerto 8000 está ocupado:** puede haber otra instancia del backend en ejecución. Detenela con Ctrl+C en su terminal antes de iniciar una nueva.
- **PowerShell bloquea `npm`:** usá `npm.cmd ci` y `npm.cmd run dev`, como en los comandos anteriores.
