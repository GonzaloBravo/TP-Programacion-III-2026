# App Móvil UNRN — Ingeniería en Computación
> **Trabajo Práctico para la Asignatura: Programación III (Ciclo Lectivo 2026)**  
> **Universidad Nacional de Río Negro (UNRN) — Sede Andina, San Carlos de Bariloche**  
> *Escuela de Producción, Tecnología y Medio Ambiente*

Prototipo de aplicación web progresiva (**PWA**) inspirada en plataformas universitarias de autogestión académica, diseñada específicamente para los estudiantes y docentes de la carrera de **Ingeniería en Computación**.

---

## 🚀 Guía de instalación y ejecución

La aplicación conserva el frontend React y utiliza un backend local Python con SQLite para las cuentas, el progreso y la agenda.

**Tecnologías:** React, TypeScript y Vite en el frontend; Python y SQLite en el backend.

### Requisitos

- Git.
- Python 3.10 o posterior. En Windows se puede usar el lanzador `py`.
- Node.js 20.19 o posterior (rama 20), o 22.12 o posterior, y npm; Vite no admite las versiones intermedias de Node 21 ni 22 anteriores a 22.12.
- Navegador web moderno.

### Clonar la rama

Cuando la rama esté publicada en GitHub, abrir PowerShell o Git Bash y ejecutar:

```powershell
git clone --branch feature/admin-login https://github.com/GonzaloBravo/TP-Programacion-III-2026.git
cd TP-Programacion-III-2026
git switch feature/admin-login
```

La rama se mantiene separada de `main`; no hace falta fusionarla para ejecutarla.

### Preparar la base y el administrador

Para una instalación nueva, comprobá primero que no exista una base que necesites conservar en `backend/data/unrn_computacion.db`. Desde la raíz:

```powershell
cd backend
py .\inicializar_db.py
py .\migracion_admin.py .\data\unrn_computacion.db
py .\crear_primer_admin.py
```

El último comando solicita la contraseña de forma interactiva. Si ya existe un administrador, no lo ejecutes de nuevo: ingresá con esa cuenta. Si la base ya existe, **no la reemplaces ni ejecutes el inicializador como rutina**: primero hacé y verificá un respaldo y revisá su esquema antes de migrarla. El procedimiento completo está en [backend/README.md](backend/README.md).

La inicialización agrega datos semilla faltantes sin reemplazar los existentes, pero puede crear tablas, columnas y cuentas demo faltantes. La migración modifica el esquema una sola vez. Ninguno de esos comandos se necesita para cada arranque.

### Iniciar el backend

En una terminal, desde la raíz:

```powershell
cd backend
py .\servidor.py
```

La base local se guarda en `backend/data/unrn_computacion.db` y no se incluye en Git. El backend queda disponible en `http://127.0.0.1:8000`.

### Instalar e iniciar el frontend

En una segunda terminal, desde la raíz del repositorio:

```powershell
cd unrn-computacion-app
npm.cmd ci
npm.cmd run dev
```

Abrir **http://localhost:5173**. Para comprobar una compilación de producción:

```powershell
npm.cmd run build
```

Los docentes nuevos deben ser aprobados por un administrador. La inicialización crea cuentas de demostración del prototipo; sus credenciales están definidas en `backend/inicializar_db.py` y no deben reutilizarse fuera de ese entorno.

### Detener los servicios

En cada terminal, presionar **Ctrl+C**: una vez en la terminal del frontend y otra en la del backend.

### Problemas frecuentes en Windows

- Si PowerShell bloquea `npm.ps1`, utilizar los comandos `npm.cmd` de esta guía.
- Si `py` no está disponible, instalar Python y usar `python` en su lugar.
- Si el puerto 8000 está ocupado, detener el otro proceso antes de iniciar el backend. El frontend usa el puerto 5173 por defecto.
- Abrir el frontend en `http://localhost:5173` para que coincida con el origen permitido por el backend.

La rama solo se podrá clonar con `--branch feature/admin-login` después de que alguien con acceso la publique en el remoto.

---

## 🎯 Funcionalidades Principales

1. **Aulas en Tiempo Real ("¿Qué está sucediendo en las aulas ahora?"):**
   * Tablero con filtro por sedes de Bariloche (**Anasagasti 2 / Malvinas Argentinas**, **Anasagasti 1 / Héroes de Malvinas**, **Tacuarí 150** y **Virtual**).
   * Muestra en tiempo real si cada aula está **En Curso** (materia, comisión, docente y tiempo restante) o **Disponible** (próxima clase programada).
   * **Simulador de Horario Integrado:** Permite simular días y horarios (Lunes, Martes, Miércoles, Jueves, Viernes y Sábado) para verificar la actividad áulica sin depender de la hora real.

2. **Plan de Estudios y Correlatividades Oficiales:**
   * Las 37 materias de 1° a 5° año conforme a la **Resolución CSDEyVE N° 044/2019**.
   * Medidor de progreso hacia el **Título de Grado** (5 años, 3816 hs) y el **Título Intermedio de Técnico/a Universitario/a en Computación** (3 años, 2272 hs).
   * Selector dinámico de estado por materia (*Aprobada*, *Regular*, *Cursando*, *Pendiente*) que calcula automáticamente la habilitación para cursar o rendir examen final.
   * Modal con los **Contenidos Mínimos** y **Objetivos Pedagógicos** de cada cátedra.

3. **Asistente de Inteligencia Artificial (UNRN Copilot):**
   * Motor híbrido RAG con conocimiento oficial de la carrera:
     * Responde correlatividades exactas (ej. *"¿Qué necesito para cursar Inteligencia Artificial?"*).
     * Ubicación y docentes (ej. *"¿Dónde y con quién se cursa Programación I los martes?"*).
     * Calendario académico y fechas de mesas de examen.
   * Conexión opcional a la API de **Google Gemini 1.5 Flash** ingresando una API key en el botón *Configurar*.

4. **Agenda Personalizada de Cursadas:**
   * Selección de comisiones específicas (C1, C2, C3) del 2° cuatrimestre 2026.
   * Grilla semanal interactiva y vista diaria con **detector automático de solapamientos horarios**.

5. **Cartelera Virtual:**
   * Publicaciones categorizadas por asignatura con avisos de cátedra y posibilidad de redactar nuevas publicaciones con persistencia en el navegador (`localStorage`).

6. **Calendario Académico 2026:**
   * Cronograma oficial (**Res. CSDEyVE N° 038/2024 y Res. Rectoral N° 1500/2025**) con filtros por turnos de exámenes (Febrero, Mayo, Julio, Septiembre, Diciembre), recesos y feriados institucionales (Día del Docente, Día del Estudiante y Día del Nodocente).

---

## 🧩 Implementación de los 4 Paradigmas de Programación

La arquitectura del proyecto fue diseñada siguiendo los 4 paradigmas requeridos por la cátedra de **Programación III**:

* **Programación Orientada a Objetos (POO) (`src/models/`):**
  * Clases con encapsulamiento y métodos de negocio: `Materia.ts`, `Aula.ts`, `HorarioCursada.ts`, `EventoCalendario.ts`.
* **Programación Funcional (FP) (`src/functional/`):**
  * Funciones puras e inmutables que manipulan listas mediante `map`, `filter` y `reduce` en `academicSelectors.ts` para calcular promedios de avance, agrupar cronogramas y detectar choques de horarios.
* **Programación Declarativa (`src/views/` y `src/components/`):**
  * Desarrollo en React describiendo la interfaz en función del estado (`UI = f(state)`).
* **Programación Asincrónica y Basada en Eventos (`src/async/` y `src/services/`):**
  * Simulación de tiempo real reactivo mediante emisores de eventos en `timeSimulator.ts` y procesamiento asincrónico del chat en `aiKnowledgeEngine.ts`.

---

## 📂 Estructura del Código

```text
unrn-computacion-app/
├── public/                  # Íconos y logo oficial de la UNRN
├── src/
│   ├── assets/              # Recursos gráficos y branding
│   ├── async/               # Paradigma Asincrónico / Simulación de eventos en tiempo real
│   │   └── timeSimulator.ts
│   ├── components/          # Componentes reutilizables (Header, BottomNav, SimuladorModal)
│   ├── data/                # Datos maestros extraídos de las normativas oficiales
│   │   ├── calendarioData.ts
│   │   ├── carreraData.ts
│   │   ├── carteleraData.ts
│   │   └── horariosData.ts
│   ├── functional/          # Paradigma Funcional (transformaciones con map/filter/reduce)
│   │   └── academicSelectors.ts
│   ├── models/              # Paradigma Orientado a Objetos (Clases de dominio)
│   │   ├── Aula.ts
│   │   ├── EventoCalendario.ts
│   │   ├── HorarioCursada.ts
│   │   └── Materia.ts
│   ├── services/            # Motor de IA (RAG local + soporte Gemini API)
│   │   └── aiKnowledgeEngine.ts
│   ├── types/               # Definiciones e interfaces de TypeScript
│   ├── views/               # Vistas de la aplicación (Inicio, Aulas, Plan, Agenda, etc.)
│   ├── App.css              # Estilos del diseño móvil institucional
│   ├── App.tsx              # Componente principal y gestión del estado
│   ├── index.css            # Tokens CSS, temas y variables globales
│   └── main.tsx             # Punto de entrada de React
├── package.json             # Dependencias del proyecto
└── vite.config.ts           # Configuración de Vite
```

---

## 🛠️ Comandos Adicionales

* **Compilar para producción:**
  ```bash
  npm run build
  ```
* **Previsualizar la compilación de producción:**
  ```bash
  npm run preview
  ```

---

## 👥 Autor y Contacto
* **Desarrolladores:** Gonzalo Bravo, Maria de los Angeles Rodriguez, Lautaro Tummino
* **Carrera:** Ingeniería en Computación — UNRN Sede Andina
* **Materia:** Programación III (2026)
