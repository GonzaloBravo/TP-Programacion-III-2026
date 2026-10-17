import type { MateriaRaw } from '../types';

export const INFO_CARRERA = {
  nombre: "Ingeniería en Computación",
  sede: "Sede Andina – San Carlos de Bariloche",
  escuela: "Escuela de Producción, Tecnología y Medio Ambiente",
  tituloGrado: "Ingeniero/a en Computación",
  duracionGrado: "5 Años (3816 Horas)",
  tituloIntermedio: "Técnico/a Universitario/a en Computación",
  duracionIntermedio: "3 Años (2272 Horas)",
  normativas: [
    "Resolución CSDEyVE N° 044/2019",
    "Resolución CSDEyVE N° 012/2020",
    "Resolución Ministerial N° 762/2021",
    "Resolución Ministerial N° 886/2021",
    "Resolución ME N° 1254/2018 Anexo XXXI (Actividades Reservadas)"
  ],
  perfil: "Posee aptitudes científicas y tecnológicas para identificar, analizar, planear, diseñar, organizar, producir, operar y dar soporte a los sistemas electrónicos de procesamiento y transmisión de información, sistemas de programación básicos y de aplicación, sistemas de comunicación y seguridad, bases de datos, sistemas inteligentes y sistemas de computación de alto rendimiento.",
  enfoqueRegional: "Desarrollo de sistemas embebidos para satélites, aplicación de técnicas de IA al procesamiento masivo de datos e implementación de sistemas de tiempo real."
};

export const MATERIAS_DATA: MateriaRaw[] = [
  // 1° AÑO - PRIMER CUATRIMESTRE
  {
    codigoGuarani: "B6000",
    nroOrden: "1.1",
    nombre: "Matemática I",
    anio: 1,
    cuatrimestre: 1,
    horasSemanales: 8,
    horasTotales: 128,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    objetivos: [
      "Desarrollar conocimientos y habilidades de pre-cálculo para análisis matemático, álgebra y física.",
      "Ofrecer mediaciones pedagógicas para favorecer conceptos matemáticos básicos.",
      "Nivelación y aprendizaje de los ingresantes."
    ],
    contenidosMinimos: "Conjuntos numéricos. Operaciones y propiedades. Polinomios. Expresiones algebraicas. Ecuaciones de 1er y 2do grado. Funciones (inecuaciones y otros). Trigonometría. Sistemas de representación numérica. Lógica proposicional. Números complejos."
  },
  {
    codigoGuarani: "B6001",
    nroOrden: "1.2",
    nombre: "Introducción a Ingeniería en Computación",
    anio: 1,
    cuatrimestre: 1,
    horasSemanales: 8,
    horasTotales: 128,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    objetivos: [
      "Comprender e introducirse en campos generales de la ingeniería en computación.",
      "Explorar de forma práctica electrónica digital y programación.",
      "Laboratorios y problemas simples con hardware y software."
    ],
    contenidosMinimos: "Historia de la evolución tecnológica y su impacto social. Componentes de una computadora. Introducción a la resolución de problemas, tipos de datos simples, operadores lógicos, estructuras de control, funciones y punteros. Circuitos digitales FPGA, desarrollo en placas de hardware interactivo. Autómatas finitos y CAD."
  },
  {
    codigoGuarani: "T0002",
    nroOrden: "1.3",
    nombre: "Introducción a la Lectura y Escritura Académica",
    anio: 1,
    cuatrimestre: 1,
    horasSemanales: 4,
    horasTotales: 64,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    objetivos: [
      "Adquirir habilidades para localizar y procesar información documental y bibliográfica.",
      "Reconocer y conceptualizar géneros discursivos académicos.",
      "Desarrollar habilidades prácticas de lectura y escritura académica."
    ],
    contenidosMinimos: "Géneros y textos. La explicación. La argumentación. La puesta en diálogo de fuentes. El informe de lectura y la monografía. Interpretación y producción de discursos escritos académicos. Escritura de textos complejos."
  },

  // 1° AÑO - SEGUNDO CUATRIMESTRE
  {
    codigoGuarani: "B6002",
    nroOrden: "2.1",
    nombre: "Física General I",
    anio: 1,
    cuatrimestre: 2,
    horasSemanales: 8,
    horasTotales: 128,
    regularizadaParaCursar: ["B6000"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6000"],
    objetivos: [
      "Laboratorios enfocados en la energía y sus manifestaciones.",
      "Razonamiento científico y modelado de fenómenos físicos.",
      "Mecánica newtoniana, oscilaciones y fluidos."
    ],
    contenidosMinimos: "Magnitudes fundamentales y errores de medición. Energía cinética, potencial y mecánica. Leyes de conservación. Mecánica newtoniana, elasticidad, movimiento oscilatorio, ondas mecánicas. Hidrostática e hidrodinámica. Termometría, calorimetría y termodinámica. Laboratorios experimentales."
  },
  {
    codigoGuarani: "B6003",
    nroOrden: "2.2",
    nombre: "Programación I",
    anio: 1,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6001"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6001"],
    objetivos: [
      "Habilidades teóricas y prácticas en programación estructurada.",
      "Estructuras de datos en memoria estática y dinámica.",
      "Análisis de complejidad y diseño de algoritmos de búsqueda y ordenación."
    ],
    contenidosMinimos: "Estructuras de control, iteradores, funciones, parámetros y prototipos. Datos definidos por el usuario: registros, vectores, matrices, arreglos n-dimensionales. Punteros y referencias. Memoria dinámica. Recursión. Algoritmos de búsqueda y ordenamiento iterativo y recursivo. Complejidad asintótica (Big O)."
  },
  {
    codigoGuarani: "B6004",
    nroOrden: "2.3",
    nombre: "Electrónica Digital",
    anio: 1,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    objetivos: [
      "Estudio de base formativa en sistemas digitales secuenciales y combinacionales.",
      "Lenguajes de descripción de hardware (HDL) y prototipado rápido.",
      "Práctica experimental en laboratorio."
    ],
    contenidosMinimos: "Sistemas de representación. Álgebra de Boole. Circuitos combinacionales. Flip-Flops, contadores, registros de desplazamiento. Circuitos integrados y familias lógicas. Circuitos lógicos secuenciales y reconfigurables. Circuitos aritméticos. HDL y nociones de microprocesadores y memoria."
  },
  {
    codigoGuarani: "B6005",
    nroOrden: "2.4",
    nombre: "Química",
    anio: 1,
    cuatrimestre: 2,
    horasSemanales: 4,
    horasTotales: 64,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    objetivos: [
      "Propiedades de materiales, deterioro y conservación aplicados a ingeniería.",
      "Cinética química, soluciones y electroquímica."
    ],
    contenidosMinimos: "Estructura de la materia. Propiedades periódicas, metales y no metales. Nomenclatura. Enlaces químicos. Estados de agregación. Estequiometría. Soluciones. Cinética y equilibrio químico. Nociones de electroquímica."
  },

  // 2° AÑO - PRIMER CUATRIMESTRE
  {
    codigoGuarani: "B6006",
    nroOrden: "3.1",
    nombre: "Matemática II",
    anio: 2,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6000"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6000"],
    objetivos: [
      "Límite, continuidad y derivabilidad en una y varias variables.",
      "Cálculo integral y métodos numéricos para ecuaciones diferenciales."
    ],
    contenidosMinimos: "Sucesiones, series y límites. Cálculo diferencial e integral en una y varias variables. Métodos numéricos: diferencias finitas, integración de Simpson/trapecios, reglas gaussianas. Resolución numérica de ODEs: Euler, Runge-Kutta, predictor-corrector."
  },
  {
    codigoGuarani: "B6007",
    nroOrden: "3.2",
    nombre: "Álgebra y Geometría",
    anio: 2,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6000"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6000"],
    objetivos: [
      "Álgebra lineal profunda y análisis geométrico.",
      "Métodos numéricos de álgebra lineal y aplicaciones reales."
    ],
    contenidosMinimos: "Matrices y determinantes. Espacios vectoriales y transformaciones lineales. Autovalores y autovectores. Geometría analítica de la recta, plano y cónicas. Métodos numéricos: eliminación gaussiana, Jacobi, Gauss-Seidel, Newton-Raphson."
  },
  {
    codigoGuarani: "B6008",
    nroOrden: "3.3",
    nombre: "Programación II",
    anio: 2,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6003"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6003"],
    objetivos: [
      "Tipos Abstractos de Datos (TADs) y estructuras avanzadas.",
      "Memoria dinámica, archivos de acceso aleatorio y depuración profesional."
    ],
    contenidosMinimos: "Archivos binarios y de acceso directo. Memoria dinámica y punteros a función. Tipos Abstractos de Datos (TADs): listas enlazadas, pilas, colas, árboles binarios y balanceados, colas de prioridad, tablas hash y grafos. Análisis de algoritmos."
  },
  {
    codigoGuarani: "B6009",
    nroOrden: "3.4",
    nombre: "Arquitectura de Computadoras I",
    anio: 2,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6004"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6004"],
    objetivos: [
      "Organización y funcionalidad de computadoras y procesadores.",
      "Conjunto de instrucciones, buses y sistemas embebidos."
    ],
    contenidosMinimos: "Diseño de CPU, memoria, jerarquías de cache, buses y controladores de E/S. Set de instrucciones (ISA). Subrutinas. Arquitecturas paralelas (Flynn), SIMD/MIMD. Modelo de procesos, bloqueos mutuos y seguridad en sistemas embebidos."
  },

  // 2° AÑO - SEGUNDO CUATRIMESTRE
  {
    codigoGuarani: "B6010",
    nroOrden: "4.1",
    nombre: "Matemática III",
    anio: 2,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6006"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6006"],
    objetivos: [
      "Cálculo vectorial avanzado y teoremas integrales de campo.",
      "Ecuaciones diferenciales lineales aplicadas a sistemas electrónicos."
    ],
    contenidosMinimos: "Curvas y superficies. Integrales de línea y superficie. Teorema de Green, Stokes y Gauss. Ecuaciones diferenciales ordinarias de 1° y 2° orden. Integrales impropias. Ecuaciones diferenciales lineales aplicadas al modelado físico."
  },
  {
    codigoGuarani: "B6011",
    nroOrden: "4.2",
    nombre: "Física General II",
    anio: 2,
    cuatrimestre: 2,
    horasSemanales: 8,
    horasTotales: 128,
    regularizadaParaCursar: ["B6002"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6002"],
    objetivos: [
      "Electromagnetismo, ecuaciones de Maxwell y circuitos de corriente alterna.",
      "Óptica geométrica y física y fenómenos fotovoltaicos."
    ],
    contenidosMinimos: "Electrostática, Ley de Coulomb, campo eléctrico, capacitores y dieléctricos. Ley de Ohm y circuitos. Leyes de Kirchhoff. Magnetismo e inducción electromagnética. Ecuaciones de Maxwell. Ondas electromagnéticas. Óptica geométrica y física. Corriente alterna."
  },
  {
    codigoGuarani: "B6012",
    nroOrden: "4.3",
    nombre: "Análisis de Circuitos",
    anio: 2,
    cuatrimestre: 2,
    horasSemanales: 8,
    horasTotales: 128,
    regularizadaParaCursar: ["B6002"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6002"],
    objetivos: [
      "Solvencia teórica y práctica en análisis estacionario y transitorio de circuitos pasivos y activos.",
      "Uso de instrumental de laboratorio y amplificadores operacionales."
    ],
    contenidosMinimos: "Modelo circuital. Leyes de Ohm y Kirchhoff. Teoremas de Thevenin y Norton. Capacitores e inductores. Transitorios y régimen permanente de CA. Fasores, potencia activa y reactiva. Resonancia. Filtros y cuadripolos. Amplificadores operacionales."
  },
  {
    codigoGuarani: "B5638",
    nroOrden: "4.4",
    nombre: "Inglés Técnico",
    anio: 2,
    cuatrimestre: 2,
    horasSemanales: 4,
    horasTotales: 64,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    objetivos: [
      "Lecto-comprensión ágil y autónoma de literatura científica y técnica en inglés.",
      "Técnicas de scanning, skimming y elaboración de resúmenes técnicos."
    ],
    contenidosMinimos: "Género académico en inglés. Estrategias de lectura (skimming, scanning, lectura minuciosa). Frase nominal y verbal, voz pasiva, afijos, falsos cognados. Terminología y glosarios informáticos y de ingeniería."
  },

  // 3° AÑO - PRIMER CUATRIMESTRE
  {
    codigoGuarani: "B6013",
    nroOrden: "5.1",
    nombre: "Bases de Datos",
    anio: 3,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6000"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6000"],
    objetivos: [
      "Diseñar, implementar y administrar sistemas de bases de datos relacionales y concurrentes."
    ],
    contenidosMinimos: "Diseño conceptual, lógico y físico. Modelo Entidad-Relación y Modelo Relacional. Normalización. Lenguaje SQL completo. Concurrencia, transacciones ACID, recuperación ante fallos y seguridad en SGBDs."
  },
  {
    codigoGuarani: "B6014",
    nroOrden: "5.2",
    nombre: "Introducción a los Sistemas Distribuidos y Paralelos",
    anio: 3,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6009", "B6003"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6009", "B6003"],
    objetivos: [
      "Arquitecturas de alto rendimiento paralelas y distribuidas.",
      "Programación concurrente y paralela con memoria compartida y pasaje de mensajes."
    ],
    contenidosMinimos: "Sistemas multiprocesador, clusters y arquitecturas SMP. Concurrencia: secciones críticas, semáforos, barreras y monitores. Pthreads y OpenMP. Programación distribuida: paso de mensajes, RPC y MPI."
  },
  {
    codigoGuarani: "B6015",
    nroOrden: "5.3",
    nombre: "Programación III",
    anio: 3,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6000"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6000"],
    objetivos: [
      "Fundamentos de múltiples paradigmas de programación (Funcional, Lógica y Objetos).",
      "Modelado declarativo y comparación de paradigmas."
    ],
    contenidosMinimos: "Lógica proposicional y de predicados. Programación Funcional: funciones de orden superior, evaluación perezosa, inmutabilidad. Programación Lógica: cláusulas de Horn, resolución SLD, unificación, Prolog. Programación Orientada a Objetos: componentes y diseño integrado."
  },
  {
    codigoGuarani: "B6016",
    nroOrden: "5.4",
    nombre: "Laboratorio de Sistemas Embebidos",
    anio: 3,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6009"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6009"],
    objetivos: [
      "Diseño, simulación y montaje de sistemas embebidos de hardware y software.",
      "Adquisición de datos y automatización en laboratorio."
    ],
    contenidosMinimos: "Definición de requerimientos de sistemas embebidos. Selección de microcontroladores y sensores. Simulación computacional de circuitos y puesta en marcha. Firmware en C/C++, medición de parámetros y documentación técnica."
  },

  // 3° AÑO - SEGUNDO CUATRIMESTRE
  {
    codigoGuarani: "B6017",
    nroOrden: "6.1",
    nombre: "Seguridad Ambiental y Laboral",
    anio: 3,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B5638"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B5638"],
    objetivos: [
      "Marcos regulatorios, ética profesional, propiedad intelectual, patentes y licencias.",
      "Higiene, seguridad en el trabajo y protección ambiental en ingeniería."
    ],
    contenidosMinimos: "Legislación laboral y comercial. Propiedad intelectual, patentes de software y hardware. Pericias técnicas. Ergonomía y siniestros laborales. Conservación ambiental y manejo de residuos tecnológicos."
  },
  {
    codigoGuarani: "B6018",
    nroOrden: "6.2",
    nombre: "Sistemas Operativos I",
    anio: 3,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6009"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6009"],
    objetivos: [
      "Conceptos fundamentales y administración de procesos y memoria en Linux.",
      "Programación multithreaded y sincronización en lenguaje C."
    ],
    contenidosMinimos: "Concepto de proceso y ciclo de vida. Planificación de CPU. Gestión de memoria real y virtual. Concurrencia, exclusión mutua, sincronización y deadlocks. Threads y programación en C bajo Linux. Seguridad y permisos de sistemas de archivos."
  },
  {
    codigoGuarani: "B6019",
    nroOrden: "6.3",
    nombre: "Señales y Sistemas",
    anio: 3,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6006", "B6012"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6006", "B6012"],
    objetivos: [
      "Procesamiento analógico y digital de señales en sistemas electrónicos.",
      "Transformadas de Fourier, Laplace y Z aplicadas a filtros y DSP."
    ],
    contenidosMinimos: "Señales continuas y discretas. Sistemas lineales invariantes en el tiempo (LTI). Convolución. Series y Transformadas de Fourier, Laplace y Z. Muestreo y teorema de Nyquist. Filtros analógicos y digitales con dispositivos DSP."
  },
  {
    codigoGuarani: "B6020",
    nroOrden: "6.4",
    nombre: "Redes de Área Local y Extendida",
    anio: 3,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6009"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6009"],
    objetivos: [
      "Modelos OSI y TCP/IP, direccionamiento, protocolos de ruteo y conmutación.",
      "Laboratorios de configuración y administración segura de redes."
    ],
    contenidosMinimos: "Modelos y protocolos de red. Modelo IEEE 802, Ethernet, switches L2/L3, ARP. Direccionamiento IPv4 e IPv6, subredes, CIDR, ICMP y algoritmos de ruteo. WAN, conmutación por paquetes. Criptografía, SSL/TLS y seguridad de red."
  },

  // 4° AÑO - PRIMER CUATRIMESTRE
  {
    codigoGuarani: "B6021",
    nroOrden: "7.1",
    nombre: "Ingeniería de Software I",
    anio: 4,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6001", "B6008"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6001", "B6008"],
    objetivos: [
      "Metodologías de desarrollo ágiles y tradicionales.",
      "Ingeniería de requerimientos, diseño arquitectónico y aseguramiento de calidad (QA)."
    ],
    contenidosMinimos: "Ciclos de vida del software. Metodologías ágiles (Scrum, Kanban) y tradicionales. Requerimientos funcionales y no funcionales. Arquitecturas y patrones de software. Pruebas unitarias e integración. Gestión de proyectos y estimaciones."
  },
  {
    codigoGuarani: "B6022",
    nroOrden: "7.2",
    nombre: "Probabilidad, Estadística y Procesos Aleatorios",
    anio: 4,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6006"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6006"],
    objetivos: [
      "Modelado probabilístico, variables aleatorias multivariadas y procesos estocásticos.",
      "Inferencia estadística, pruebas de hipótesis y regresión."
    ],
    contenidosMinimos: "Espacios de probabilidad y variables aleatorias discretas y continuas. Distribuciones usuales. Variables aleatorias multidimensionales. Procesos estocásticos y densidad espectral de potencia. Estimación puntual, intervalos de confianza y tests de hipótesis."
  },
  {
    codigoGuarani: "B6023",
    nroOrden: "7.3",
    nombre: "Electrónica Analógica",
    anio: 4,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6012"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6012"],
    objetivos: [
      "Circuitos activos con semiconductores (BJT, MOSFET, OpAmps).",
      "Simulación computacional de etapas de amplificación y circuitos optoelectrónicos."
    ],
    contenidosMinimos: "Modelado de semiconductores. Amplificadores diferenciales y etapas en cascada. Respuesta en frecuencia y realimentación negativa. Ruido en circuitos electrónicos. Dispositivos optoelectrónicos y simulación en SPICE."
  },
  {
    codigoGuarani: "B6024",
    nroOrden: "7.4",
    nombre: "Arquitectura de Computadora II",
    anio: 4,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6009"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6009"],
    objetivos: [
      "Microarquitecturas avanzadas: superescalares, multithreading, GPUs y Network-on-Chip.",
      "Coherencia y consistencia de memoria en sistemas multicore de alta velocidad."
    ],
    contenidosMinimos: "Pipeline avanzado y predicción de saltos. Procesadores fuera de orden (OoO). SIMD, VLIW y computación en GPU. Protocolos de coherencia de cache (MESI/MOESI). Network on Chip, virtualización y computación de bajo consumo en Datacenters."
  },

  // 4° AÑO - SEGUNDO CUATRIMESTRE
  {
    codigoGuarani: "B6025",
    nroOrden: "8.1",
    nombre: "Inteligencia Artificial",
    anio: 4,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6015", "B6021"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6015", "B6021"],
    objetivos: [
      "Metodologías para diseño y desarrollo de sistemas inteligentes.",
      "Machine learning, redes neuronales, lógica difusa y visión computacional."
    ],
    contenidosMinimos: "Agentes inteligentes y ambientes PEAS. Redes bayesianas e inferencia probabilística. Aprendizaje automático supervisado y no supervisado. Redes neuronales artificiales y Deep Learning. Algoritmos genéticos y visión por computadora."
  },
  {
    codigoGuarani: "B6026",
    nroOrden: "8.2",
    nombre: "Optativa I",
    anio: 4,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    esOptativa: true,
    objetivos: ["Especialización temática elegida por el estudiante (ej. Ciencia de Datos Aplicada V1275 o Microprocesadores y FPGA B5610)."],
    contenidosMinimos: "Contenidos específicos según la oferta académica de la carrera."
  },
  {
    codigoGuarani: "B6027",
    nroOrden: "8.3",
    nombre: "Compiladores e Intérpretes",
    anio: 4,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6008", "B6009"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6008", "B6009"],
    objetivos: [
      "Fases del compilador: análisis léxico, sintáctico, semántico y generación de código.",
      "Máquinas virtuales y técnicas de optimización de código para procesadores modernos."
    ],
    contenidosMinimos: "Arquitectura de compiladores e intérpretes. Analizadores léxicos (Lex) y sintácticos (Yacc/Bison). Gramáticas libres de contexto y árboles sintácticos. Verificación de tipos y análisis semántico. Generación de código intermedio y optimización."
  },
  {
    codigoGuarani: "B6028",
    nroOrden: "8.4",
    nombre: "Sistemas Operativos II",
    anio: 4,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6014", "B6018"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6014", "B6018"],
    objetivos: [
      "Profundización en drivers de entrada/salida, sistemas de archivos avanzados y virtualización.",
      "Estudio del kernel de Linux, Android y Windows."
    ],
    contenidosMinimos: "Sistemas de archivos distribuidos y en disco. Planificación de operaciones de disco y SSDs. Seguridad avanzada en kernels. Casos de estudio en código abierto de Linux y Android. Laboratorios de modificación y prueba de módulos de kernel."
  },

  // 5° AÑO - PRIMER CUATRIMESTRE
  {
    codigoGuarani: "B6038",
    nroOrden: "9.1",
    nombre: "Economía y Organización Industrial",
    anio: 5,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["T0002"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["T0002"],
    objetivos: [
      "Matemática financiera, micro y macroeconomía y formulación de proyectos tecnológicos.",
      "Organización y administración de empresas de base tecnológica."
    ],
    contenidosMinimos: "Análisis de costos y rentabilidad. Evaluación financiera de proyectos de inversión (VAN, TIR). Estructura de empresas y sociedades. Gestión de recursos humanos y calidad. Legislación laboral y contratación pública."
  },
  {
    codigoGuarani: "B6029",
    nroOrden: "9.2",
    nombre: "Optativa II",
    anio: 5,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    esOptativa: true,
    objetivos: ["Profundización temática optativa."],
    contenidosMinimos: "Dictado según oferta académica anual."
  },
  {
    codigoGuarani: "B5672",
    nroOrden: "9.3",
    nombre: "Comunicaciones Analógicas y Digitales",
    anio: 5,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6019", "B6022"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6019", "B6022"],
    objetivos: [
      "Capa física de comunicaciones, modulación analógica y digital (QAM, PSK, FSK).",
      "Teoría de la información y códigos de detección y corrección de errores."
    ],
    contenidosMinimos: "Transmisión en presencia de ruido. Modulaciones digitales: ASK, FSK, PSK, DPSK. Probabilidad de error y relación señal a ruido (SNR). Sincronización y detección óptima. Teoría de información de Shannon y códigos convolucionales."
  },
  {
    codigoGuarani: "B6035",
    nroOrden: "9.4",
    nombre: "Programa de Trabajo Social",
    anio: 5,
    cuatrimestre: 1,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    objetivos: [
      "Intervención comunitaria y transferencia tecnológica para resolver problemáticas sociales de la región."
    ],
    contenidosMinimos: "Identificación de necesidades comunitarias. Diseño e implementación de soluciones tecnológicas con impacto social. Trabajo de campo y evaluación de resultados."
  },

  // 5° AÑO - SEGUNDO CUATRIMESTRE
  {
    codigoGuarani: "B6031",
    nroOrden: "10.1",
    nombre: "Optativa III",
    anio: 5,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    esOptativa: true,
    objetivos: ["Profundización temática optativa de último año."],
    contenidosMinimos: "Dictado según oferta académica anual."
  },
  {
    codigoGuarani: "B6032",
    nroOrden: "10.2",
    nombre: "Seguridad Informática",
    anio: 5,
    cuatrimestre: 2,
    horasSemanales: 6,
    horasTotales: 96,
    regularizadaParaCursar: ["B6020", "B6018"],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: ["B6020", "B6018"],
    objetivos: [
      "Gestión de riesgos, seguridad ofensiva y defensiva, auditoría y peritaje informático.",
      "Criptografía aplicada y seguridad en redes y sistemas operativos."
    ],
    contenidosMinimos: "Esquemas de gestión de riesgos e ISO 27001. Criptografía simétrica y asimétrica. Seguridad en redes, firewalls, IDS/IPS y VPNs. Seguridad en sistemas operativos y bases de datos. Aspectos legales y peritaje informático forense."
  },
  {
    codigoGuarani: "B6034",
    nroOrden: "10.3",
    nombre: "Práctica Profesional Supervisada",
    anio: 5,
    cuatrimestre: 2,
    horasSemanales: 12.5,
    horasTotales: 200,
    regularizadaParaCursar: [],
    aprobadaParaCursar: [],
    aprobadaParaAprobar: [],
    objetivos: [
      "Inserción en un ámbito profesional real (empresa, institución o centro de investigación).",
      "Síntesis e integración de las competencias de la carrera."
    ],
    contenidosMinimos: "Desarrollo de un proyecto de ingeniería en un ámbito profesional. Relevamiento, diseño, implementación y pruebas de campo. Elaboración de memoria técnica y defensa final."
  }
];
