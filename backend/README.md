# Backend Python + SQLite

El backend local utiliza Python y SQLite, incluidos en la instalación de Python. La aplicación requiere Python 3.10 o posterior y, para el frontend, Git, Node.js 20.19 o posterior en la rama 20, o 22.12 o posterior, con npm. Los ejemplos siguientes son para PowerShell en Windows; si `py` no está disponible, utilizá `python`.

Comprobá que los programas estén disponibles con `git --version`, `py --version`, `node --version` y `npm.cmd --version`. El backend usa solo módulos de la biblioteca estándar: no requiere `pip install` ni un entorno virtual obligatorio. Podés usar uno si ya trabajás con él.

## Obtener el proyecto

Cuando la rama esté publicada y tengas acceso al repositorio:

```powershell
git clone --branch feature/admin-login https://github.com/GonzaloBravo/TP-Programacion-III-2026.git
cd TP-Programacion-III-2026
```

Si ya tenés un clon, revisá y guardá tus cambios locales antes de actualizar o cambiar de rama. Git no incluye `backend/data/unrn_computacion.db`: cada instalación conserva su propia base.

## Escenario A: instalación desde cero

Desde la raíz del proyecto, comprobá que no exista una base que necesites conservar. Solo para preparar una instalación nueva:

```powershell
cd backend
Test-Path .\data\unrn_computacion.db
```

Si devuelve `False`, prepará la base y aplicá la migración administrativa:

```powershell
py .\inicializar_db.py
py .\migracion_admin.py .\data\unrn_computacion.db
```

Si devuelve `True`, seguí el procedimiento de **base existente**. El inicializador carga el catálogo y cuentas demo; las credenciales demo están en `inicializar_db.py` y son solo para el prototipo. El servidor requiere la migración versión 1, pero no la ejecuta automáticamente.

Después de esos dos comandos, seguí con **Primer administrador** y **Iniciar los servicios** más abajo. El script del administrador permite elegir usuario y contraseña: no hay credenciales predeterminadas para esa cuenta.

## Escenario B: base existente

1. Detené el backend y cualquier otro programa que escriba en la base. No elimines ni reemplaces el archivo original.
2. Desde la carpeta `backend`, ejecutá este bloque completo en PowerShell. Abre el original en modo de solo lectura, crea un nombre único con reserva exclusiva y usa la API de respaldo de SQLite. Informa la ruta y verifica integridad, claves foráneas y cantidad de filas de cada tabla.

   ```powershell
   @'
   import pathlib, sqlite3, uuid

   original = pathlib.Path('data/unrn_computacion.db').resolve()
   copia = original.parent / ('respaldo-' + uuid.uuid4().hex + '.db')
   if not original.is_file():
       raise SystemExit('No existe la base original; no se creó respaldo.')
   with copia.open('xb'):
       pass
   origen = sqlite3.connect(original.as_uri() + '?mode=ro', uri=True)
   try:
       origen.execute('BEGIN')
       destino = sqlite3.connect(copia)
       try:
           origen.backup(destino)
       finally:
           destino.close()
       verificacion = sqlite3.connect(copia.as_uri() + '?mode=ro', uri=True)
       try:
           integridad = verificacion.execute('PRAGMA integrity_check').fetchall()
           claves = verificacion.execute('PRAGMA foreign_key_check').fetchall()
           consulta = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
           tablas = [fila[0] for fila in origen.execute(consulta)]
           tablas_copia = [fila[0] for fila in verificacion.execute(consulta)]
           iguales = tablas == tablas_copia
           for tabla in tablas:
               nombre = '"' + tabla.replace('"', '""') + '"'
               antes = origen.execute('SELECT COUNT(*) FROM ' + nombre).fetchone()[0]
               despues = verificacion.execute('SELECT COUNT(*) FROM ' + nombre).fetchone()[0]
               print(tabla, antes, despues)
               iguales = iguales and antes == despues
           print('Respaldo:', copia, '- bytes:', copia.stat().st_size)
           print('integrity_check:', integridad, '- foreign_key_check:', claves)
           if integridad != [('ok',)] or claves or not iguales:
               raise SystemExit('Verificación fallida: no continuar con la migración.')
       finally:
           verificacion.close()
   finally:
       origen.close()
   '@ | py -
   ```

3. Confirmá que la salida muestre `integrity_check: [('ok',)]`, claves foráneas vacías y los mismos dos conteos por tabla. Si hay un error, detenete y conservá el original; no ejecutes la migración. Guardá la copia en un lugar seguro distinto del original.
4. Desde `backend`, consultá en modo de solo lectura el estado de la migración y la cantidad de administradores, sin mostrar datos de usuarios ni contraseñas:

   ```powershell
   @'
   import pathlib, sqlite3

   ruta = pathlib.Path('data/unrn_computacion.db').resolve()
   if not ruta.is_file():
       raise SystemExit('No existe la base esperada; no continuar.')
   conexion = sqlite3.connect(ruta.as_uri() + '?mode=ro', uri=True)
   try:
       tablas = {fila[0] for fila in conexion.execute("SELECT name FROM sqlite_master WHERE type='table'")}
       if 'usuarios' not in tablas:
           raise SystemExit('No existe la tabla usuarios; revisar el esquema antes de continuar.')
       columnas = {fila[1] for fila in conexion.execute('PRAGMA table_info(usuarios)')}
       if 'rol' not in columnas:
           raise SystemExit('La tabla usuarios no tiene rol; revisar el esquema antes de continuar.')
       aplicada = 'migraciones' in tablas and conexion.execute('SELECT 1 FROM migraciones WHERE version = 1').fetchone() is not None
       cantidad = conexion.execute('SELECT COUNT(*) FROM usuarios WHERE rol = ?', ('administrador',)).fetchone()[0]
       print('Migración versión 1:', 'aplicada' if aplicada else 'no aplicada')
       print('Administradores existentes:', cantidad)
   finally:
       conexion.close()
   '@ | py -
   ```

   Si la consulta falla o el esquema no coincide con lo esperado, detenete y revisá la base con el equipo. No supongas que se puede migrar solo porque la versión figura como no aplicada.

5. Si la salida indica **no aplicada**, revisá que el esquema sea compatible: la migración detiene la operación si `usuarios` tiene columnas no contempladas o existen errores de integridad. Con el respaldo verificado y la base original en `backend/data/unrn_computacion.db`, ejecutá desde `backend`:

   ```powershell
   py .\migracion_admin.py .\data\unrn_computacion.db
   ```

   Si indica **aplicada**, no vuelvas a ejecutar el comando. Si la migración falla por un esquema incompatible u otro error, no sigas con el arranque ni intentes repararla automáticamente: conservá el respaldo y revisá el mensaje con el equipo.

La migración está diseñada para conservar los ID, usuarios y relaciones, sin reemplazar materias, aulas, horarios ni agendas; también marca como aprobados a los docentes anteriores. Es transaccional e idempotente, pero no sustituye el respaldo. Después de migrar, verificá la base real en modo de solo lectura desde `backend`:

```powershell
@'
import pathlib, sqlite3
p = pathlib.Path('data/unrn_computacion.db').resolve()
c = sqlite3.connect(p.as_uri() + '?mode=ro', uri=True)
try:
    print('integrity_check:', c.execute('PRAGMA integrity_check').fetchall())
    print('foreign_key_check:', c.execute('PRAGMA foreign_key_check').fetchall())
finally:
    c.close()
'@ | py -
```

La integridad debe devolver `[('ok',)]` y las claves foráneas `[]`. Si no es así, detenete y revisá la situación antes de continuar. No repitas la migración como paso de cada inicio.

6. Si la consulta del paso 4 indicó **cero administradores**, continuá con **Primer administrador**. Si ya existe uno, usá esa cuenta. Luego seguí con **Iniciar los servicios**. No ejecutes el inicializador para una base existente como parte de este procedimiento.

## Primer administrador

Después de migrar, desde `backend`:

```powershell
py .\crear_primer_admin.py
```

Ingresá nombre, el nombre de usuario que elijas y una contraseña de al menos ocho caracteres; la contraseña no se muestra mientras se escribe y debe confirmarse. No hay una contraseña predeterminada para el administrador. Si ya existe uno, el comando se detiene sin crear otro: usá esa cuenta. No pases contraseñas como argumentos ni las guardes en el repositorio.

## Iniciar los servicios

En una terminal desde la raíz:

```powershell
cd backend
py .\servidor.py
```

En otra terminal desde la raíz, instalá las dependencias del frontend cuando prepares el proyecto por primera vez y ejecutá Vite:

```powershell
cd unrn-computacion-app
npm.cmd ci
npm.cmd run dev
```

Abrí http://localhost:5173 e iniciá sesión con el usuario y la contraseña que elegiste. Como administrador, abrí **Administración** para aprobar o rechazar solicitudes docentes y consultar o editar aulas y horarios. El backend escucha en http://127.0.0.1:8000 y permite el origen `http://localhost:5173`. Para detenerlos, usá Ctrl+C en cada terminal. Reiniciar el backend invalida las sesiones en memoria.

No repitas `npm.cmd ci` en cada arranque ni ejecutes `inicializar_db.py`, la migración o el alta de administrador como pasos rutinarios. El inicializador preserva los registros existentes de la semilla, pero puede agregar datos faltantes, cuentas demo o columnas; no reemplaza un respaldo ni una migración controlada.

## Funcionamiento y pruebas

Los alumnos se registran normalmente. Los docentes nuevos quedan pendientes hasta que un administrador los apruebe; el administrador gestiona solicitudes, aulas y horarios desde la aplicación. Los encuentros se tratan como semanales sin período académico específico: se rechazan nuevos solapamientos físicos y se admite simultaneidad virtual.

La base contiene usuarios, progreso, agenda, materias, aulas, horarios, calendario y novedades. Las operaciones administrativas requieren un token y el backend comprueba el rol. Para ejecutar las pruebas con bases temporales:

```powershell
cd backend
py -m unittest -v test_inicializacion test_admin test_horarios
```

Para comprobar TypeScript y el build, desde `unrn-computacion-app` ejecutá `npm.cmd run build`. Si un puerto está ocupado, identificá el proceso existente antes de iniciar otro servicio.
