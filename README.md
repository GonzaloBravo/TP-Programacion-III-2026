# App Móvil UNRN — Ingeniería en Computación
> **Trabajo Práctico para la Asignatura: Programación III (Ciclo Lectivo 2026)**  
> **Universidad Nacional de Río Negro (UNRN) — Sede Andina, San Carlos de Bariloche**  
> *Escuela de Producción, Tecnología y Medio Ambiente*

Prototipo de aplicación web progresiva (**PWA**) inspirada en plataformas universitarias de autogestión académica (como *infoUNLP*), diseñada específicamente para los estudiantes y docentes de la carrera de **Ingeniería en Computación**.

---

## 🚀 Guía de Instalación y Ejecución Rápida

Para clonar y poner en funcionamiento la aplicación en tu computadora local, seguí estos pasos:

### 1. Requisitos Previos
* **Node.js** (versión 18.0 o superior recomendada). Podés verificarlo con `node -v`.
* **Git** instalado. Podés verificarlo con `git -v`.
* Un navegador web moderno (Google Chrome, Firefox, Microsoft Edge, Brave o Safari).

---

### 2. Clonar el Repositorio
Abrí una terminal (PowerShell, Git Bash o CMD) y ejecutá:
```bash
git clone https://github.com/GonzaloBravo/TP-Programacion-III-2026.git
```

---

### 3. Ingresar a la Carpeta de la Aplicación
```bash
cd TP-Programacion-III-2026/unrn-computacion-app
```

---

### 4. Instalar Dependencias
Instalá las librerías necesarias del proyecto (`react`, `lucide-react`, `vite`, etc.):
```bash
npm install
```

---

### 5. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

La consola te indicará la URL local activa. Abrí tu navegador en:
👉 **[http://localhost:5173/](http://localhost:5173/)**

> **Tip de Visualización:** La app cuenta en la esquina superior derecha con un botón para alternar entre **marco de simulación móvil de smartphone** o **pantalla completa**, además de un conmutador de **modo claro / modo oscuro**.

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
* **Desarrolladores:** Gonzalo Bravo. Maria de los Angeles Rodriguez, Lautaro Tummino
* **Carrera:** Ingeniería en Computación — UNRN Sede Andina
* **Materia:** Programación III (2026)
