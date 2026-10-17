import type { NovedadPost } from '../types';

export const NOVEDADES_INICIALES: NovedadPost[] = [
  {
    id: "nov-1",
    titulo: "Bienvenida al 2° Cuatrimestre 2026 - Aulas y Distribución",
    contenido: "Estimados/as estudiantes: Recordamos que las clases presenciales se desarrollan en Anasagasti 2 (Malvinas Argentinas) y los laboratorios en Anasagasti 1 (Héroes de Malvinas). Por favor verifiquen el cronograma semanal en la sección de Aulas.",
    autor: "Dirección de Carrera - Ing. en Computación",
    rolAutor: "Dirección de Carrera",
    fecha: "2026-08-03",
    hora: "09:00",
    importante: true,
    likes: 34
  },
  {
    id: "nov-2",
    titulo: "Programación I: Entrega del Trabajo Práctico N° 1 de Punteros",
    contenido: "Comisiones C1 y C2: La primera entrega sobre estructuras de control y punteros en C se realizará por el campus virtual antes del próximo jueves a las 23:59 hs.",
    autor: "Ing. Martín Vilugrón",
    rolAutor: "Docente",
    codigoMateria: "B6003",
    nombreMateria: "Programación I",
    fecha: "2026-08-10",
    hora: "14:30",
    importante: true,
    likes: 19
  },
  {
    id: "nov-3",
    titulo: "Redes: Modalidad de cursada lunes y miércoles",
    contenido: "Recordatorio importante: La clase de los lunes de 15:00 a 18:00 hs se dicta de forma 100% remota (Aula Virtual). La clase de los miércoles de 15:00 a 18:00 hs es presencial en Aula B101 de Anasagasti 2.",
    autor: "Ing. Juan Cruz Martínez Luque",
    rolAutor: "Docente",
    codigoMateria: "B6020",
    nombreMateria: "Redes de Área Local y Extendida",
    fecha: "2026-08-12",
    hora: "11:15",
    importante: false,
    likes: 27
  },
  {
    id: "nov-4",
    titulo: "Laboratorio de Microprocesadores y FPGA: Guía 1 disponible",
    contenido: "Ya se encuentra disponible en el entorno la guía de diseño en VHDL sobre placas Cyclone IV para las prácticas de los lunes y viernes en Lab-105.",
    autor: "Ing. Daniel Neuman",
    rolAutor: "Docente",
    codigoMateria: "B5610",
    nombreMateria: "Optativa - Lab. Microprocesadores y FPGA",
    fecha: "2026-08-15",
    hora: "16:00",
    importante: false,
    likes: 15
  },
  {
    id: "nov-5",
    titulo: "Inteligencia Artificial: Clases virtuales y dataset del proyecto",
    contenido: "Las clases de los días lunes y miércoles se realizan de 15 a 18 hs vía plataforma virtual. Durante esta semana analizaremos agentes racionales y ambientes PEAS.",
    autor: "Lic. Walter Agüero",
    rolAutor: "Docente",
    codigoMateria: "B6025",
    nombreMateria: "Inteligencia Artificial",
    fecha: "2026-08-18",
    hora: "10:00",
    importante: false,
    likes: 22
  },
  {
    id: "nov-6",
    titulo: "Sistemas Operativos I: Prácticas de Bash y Kernel Linux",
    contenido: "Recuerden traer sus laptops con entorno Linux configurado para la clase de los martes en B101. Los jueves continuamos de forma sincrónica virtual.",
    autor: "Ing. Carlos Tejero",
    rolAutor: "Docente",
    codigoMateria: "B6018",
    nombreMateria: "Sistemas Operativos I",
    fecha: "2026-08-20",
    hora: "18:20",
    importante: false,
    likes: 18
  }
];
