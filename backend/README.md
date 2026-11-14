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

## Preparación del sistema

Detené el backend con Ctrl+C en su terminal y cerrá cualquier otro programa que escriba en la base. Desde la raíz del proyecto ejecutá:

```powershell
cd backend
py .\preparar_sistema.py
```

Si no existe la base, el asistente la inicializa y aplica la migración administrativa. Si ya existe, pide confirmar que los procesos estén detenidos, crea un respaldo único en `backend/data/respaldo-<identificador>.db` y verifica su integridad antes de migrar solo si hace falta. Después comprueba la integridad y las claves foráneas. Si no hay administrador, ofrece crearlo; elegí nombre, usuario y contraseña en la terminal. Si ya existe uno, usá esa cuenta. Si rechazás crearlo, la preparación termina sin cuenta administradora.

El asistente informa la ruta del respaldo y se detiene ante errores. No elimina ni restaura archivos automáticamente. Si una instalación nueva falla, puede quedar una base incompleta: revisá el mensaje antes de continuar. No guardes contraseñas en el repositorio. No es necesario volver a ejecutar el asistente en cada arranque.

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

Abrí http://localhost:5173 e iniciá sesión con el administrador que creaste durante la preparación. En **Administración** podés gestionar solicitudes, aulas y horarios. El backend escucha en http://127.0.0.1:8000; para detener cada servicio usá Ctrl+C en su terminal. Reiniciar el backend invalida las sesiones.

## Procedimientos avanzados

Los scripts `inicializar_db.py`, `migracion_admin.py` y `crear_primer_admin.py` permiten realizar pasos manuales, pero normalmente alcanza con el asistente. Ante un error, conservá la base y cualquier respaldo verificado; revisá el mensaje con el equipo antes de restaurar o modificar archivos.

Si una instalación nueva queda incompleta, no inicies el servidor ni elimines la base. Revisá el error con el equipo: una nueva ejecución tratará el archivo existente como una base existente y podría rechazarlo si está incompleto. Si solo quedó pendiente el administrador después de completar la migración, podés volver a ejecutar el asistente para continuar.

## Funcionamiento y pruebas

Los alumnos se registran normalmente. Los docentes nuevos quedan pendientes hasta que un administrador los apruebe; el administrador gestiona solicitudes, aulas y horarios desde la aplicación. Los encuentros se tratan como semanales sin período académico específico: se rechazan nuevos solapamientos físicos y se admite simultaneidad virtual.

La base contiene usuarios, progreso, agenda, materias, aulas, horarios, calendario y novedades. Las operaciones administrativas requieren un token y el backend comprueba el rol. Para ejecutar las pruebas con bases temporales:

```powershell
cd backend
py -m unittest -v test_preparar_sistema test_inicializacion test_admin test_horarios
```

Para comprobar TypeScript y el build, desde `unrn-computacion-app` ejecutá `npm.cmd run build`. Si un puerto está ocupado, identificá el proceso existente antes de iniciar otro servicio.
