/** Responde consultas sobre la carrera usando los datos academicos cargados desde la base de datos. */
import type { MateriaRaw, HorarioCursadaRaw, AulaInfo, EventoCalendarioRaw } from '../types';

export interface ChatMessage {
  id: string;
  remitente: 'usuario' | 'ia';
  texto: string;
  timestamp: string;
  fuente?: string;
  sugerencias?: string[];
}

/**
 * Motor de Inteligencia Artificial para la App de Ingeniería en Computación - UNRN
 * Combina un procesador RAG local de alta fidelidad con respuestas exactas basadas
 * en la base de datos SQLite y soporte opcional para Gemini API.
 */
export class AIKnowledgeEngine {
  private geminiApiKey: string = '';

  private materias: MateriaRaw[] = [];
  private horarios: HorarioCursadaRaw[] = [];
  private aulas: AulaInfo[] = [];
  private calendario: EventoCalendarioRaw[] = [];
  private infoCarrera = {
    nombre: "Ingeniería en Computación",
    sede: "Sede Andina – San Carlos de Bariloche",
    escuela: "Escuela de Producción, Tecnología y Medio Ambiente",
    tituloGrado: "Ingeniero/a en Computación",
    duracionGrado: "5 Años (3816 Horas)",
    tituloIntermedio: "Técnico/a Universitario/a en Computación",
    duracionIntermedio: "3 Años (2272 Horas)",
    perfil: "Posee aptitudes científicas y tecnológicas para identificar, analizar, planear, diseñar, organizar, producir, operar y dar soporte a los sistemas electrónicos de procesamiento y transmisión de información.",
    enfoqueRegional: "Desarrollo de sistemas embebidos para satélites, aplicación de técnicas de IA e implementación de sistemas de tiempo real."
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.geminiApiKey = localStorage.getItem('unrn_gemini_api_key') || '';
    }
  }

  /** Permite actualizar dinamicamente la base de conocimiento con datos de SQLite */
  public actualizarConocimiento(datos: {
    materias?: MateriaRaw[];
    horarios?: HorarioCursadaRaw[];
    aulas?: AulaInfo[];
    calendario?: EventoCalendarioRaw[];
    infoCarrera?: any;
  }) {
    if (datos.materias) this.materias = datos.materias;
    if (datos.horarios) this.horarios = datos.horarios;
    if (datos.aulas) this.aulas = datos.aulas;
    if (datos.calendario) this.calendario = datos.calendario;
    if (datos.infoCarrera) this.infoCarrera = { ...this.infoCarrera, ...datos.infoCarrera };
  }

  public setApiKey(key: string) {
    this.geminiApiKey = key.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('unrn_gemini_api_key', this.geminiApiKey);
    }
  }

  public getApiKey(): string {
    return this.geminiApiKey;
  }

  /**
   * Procesa la consulta del estudiante de manera asincrónica
   */
  public async responderConsulta(pregunta: string): Promise<ChatMessage> {
    const ahora = new Date();
    const horaStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    // Si tiene API Key de Gemini, podemos intentar enriquecer con Gemini API (con fallback inmediato)
    if (this.geminiApiKey) {
      try {
        const respuestaGemini = await this.consultarGeminiApi(pregunta);
        if (respuestaGemini) {
          return {
            id: `msg-${Date.now()}`,
            remitente: 'ia',
            texto: respuestaGemini,
            timestamp: horaStr,
            fuente: 'Google Gemini Flash con Contexto UNRN'
          };
        }
      } catch (err) {
        console.warn('Fallo llamada a Gemini API, usando motor local RAG:', err);
      }
    }

    // Motor de inferencia local basado en el conocimiento de SQLite
    await new Promise(resolve => setTimeout(resolve, 600));

    const respuestaLocal = this.resolverConsultaLocal(pregunta);
    return {
      id: `msg-${Date.now()}`,
      remitente: 'ia',
      texto: respuestaLocal.texto,
      timestamp: horaStr,
      fuente: respuestaLocal.fuente,
      sugerencias: respuestaLocal.sugerencias
    };
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?¡!.,:;()"'`_/\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Busca de manera inteligente una materia por código, nombre completo o alias,
   * soportando números romanos (I, II, III), números arábigos (1, 2, 3) y abreviaciones comunes.
   */
  private buscarMateria(queryRaw: string): MateriaRaw | undefined {
    const queryNorm = this.normalizarTexto(queryRaw);
    let q = " " + queryNorm + " ";
    q = q
      .replace(/\b1\b/g, "i")
      .replace(/\b2\b/g, "ii")
      .replace(/\b3\b/g, "iii")
      .replace(/\b4\b/g, "iv")
      .replace(/\b5\b/g, "v")
      .replace(/\bprog\b/g, "programacion")
      .replace(/\bmat\b/g, "matematica")
      .replace(/\bfis\b/g, "fisica")
      .replace(/\barqui\b/g, "arquitectura")
      .replace(/\bso\b/g, "sistemas operativos")
      .replace(/\bbdd?\b/g, "bases de datos")
      .replace(/\bia\b/g, "inteligencia artificial")
      .replace(/\bilea\b/g, "lectura y escritura")
      .replace(/\bpps\b/g, "practica profesional")
      .replace(/\bpts\b/g, "trabajo social");
    q = q.trim();

    let mejor: MateriaRaw | undefined = undefined;
    let maxPuntos = 0;

    for (const m of this.materias) {
      const nomNorm = this.normalizarTexto(m.nombre);
      const codNorm = m.codigoGuarani.toLowerCase();
      let puntos = 0;

      // 1. Coincidencia exacta por código Guaraní
      if (q.includes(codNorm) || queryNorm.includes(codNorm)) {
        puntos = 1000;
      }
      // 2. Coincidencia exacta del nombre normalizado (con números romanos)
      else if (q.includes(nomNorm)) {
        puntos = nomNorm.length * 10;
      }
      // 3. Coincidencia en la consulta original
      else if (queryNorm.includes(nomNorm)) {
        puntos = nomNorm.length * 10;
      }
      // 4. Coincidencia por palabras clave y alias
      else {
        const palabrasClave = nomNorm.split(" ").filter(p => {
          if (p === "de" || p === "la" || p === "el" || p === "los" || p === "las" || p === "y" || p === "e") return false;
          return p.length > 2 || /^(i|ii|iii|iv|v)$/.test(p);
        });

        let coincidencias = 0;
        for (const p of palabrasClave) {
          const regex = new RegExp(`\\b${p}\\b`);
          if (regex.test(q) || regex.test(queryNorm)) {
            coincidencias++;
          }
        }

        if (coincidencias === palabrasClave.length && palabrasClave.length > 0) {
          puntos = nomNorm.length * 8;
        } else if (coincidencias > 0) {
          // Ponderar: si la materia tiene número romano y no coincide, penalizar
          const tieneRomano = palabrasClave.some(p => /^(i|ii|iii|iv|v)$/.test(p));
          const romanoCoincide = palabrasClave.some(p => /^(i|ii|iii|iv|v)$/.test(p) && new RegExp(`\\b${p}\\b`).test(q));
          if (tieneRomano && !romanoCoincide) {
            puntos = 10;
          } else {
            puntos = (coincidencias / palabrasClave.length) * 50 + coincidencias * 10;
          }
        }
      }

      if (puntos > maxPuntos) {
        maxPuntos = puntos;
        mejor = m;
      }
    }

    return maxPuntos >= 30 ? mejor : undefined;
  }

  private resolverConsultaLocal(queryRaw: string): { texto: string; fuente: string; sugerencias?: string[] } {
    const q = this.normalizarTexto(queryRaw);
    const materiaEncontrada = this.buscarMateria(queryRaw);

    // Intenciones del usuario
    const esConsultaCorrelativas =
      q.includes('correlativ') ||
      q.includes('necesito para cursar') ||
      q.includes('necesito tener aprobad') ||
      q.includes('materias correlativas') ||
      q.includes('para rendir') ||
      q.includes('puedo cursar') ||
      q.includes('requisito') ||
      q.includes('que me pide') ||
      q.includes('que necesito para') ||
      q.includes('materias necesarias') ||
      q.includes('para cursar') ||
      q.includes('para promocionar') ||
      q.includes('final de') ||
      q.includes('que tengo que tener');

    const esConsultaHorarioDocente =
      q.includes('aula') ||
      q.includes('horario') ||
      q.includes('donde se cursa') ||
      q.includes('donde y cuando') ||
      q.includes('donde') ||
      q.includes('cuando') ||
      q.includes('hora') ||
      q.includes('dias') ||
      q.includes('docente') ||
      q.includes('profesor') ||
      q.includes('profesora') ||
      q.includes('prof') ||
      q.includes('quien da') ||
      q.includes('quien dicta') ||
      q.includes('comision') ||
      q.includes('sede') ||
      q.includes('email') ||
      q.includes('correo');

    const esConsultaContenido =
      q.includes('contenido') ||
      q.includes('tema') ||
      q.includes('temas') ||
      q.includes('programa') ||
      q.includes('de que trata') ||
      q.includes('que se ve') ||
      q.includes('aprende') ||
      q.includes('objetivo') ||
      q.includes('objetivos');

    // 1. CONSULTA DE CORRELATIVIDADES CON MATERIA DETECTADA
    if (materiaEncontrada && esConsultaCorrelativas) {
      const regCursar = materiaEncontrada.regularizadaParaCursar.length > 0
        ? materiaEncontrada.regularizadaParaCursar.map(c => this.obtenerNombreMateria(c)).join(', ')
        : 'Ninguna (sin regularizadas previas requeridas)';

      const aprobCursar = materiaEncontrada.aprobadaParaCursar.length > 0
        ? materiaEncontrada.aprobadaParaCursar.map(c => this.obtenerNombreMateria(c)).join(', ')
        : 'Ninguna (sin materias aprobadas requeridas para cursar)';

      const aprobAprobar = materiaEncontrada.aprobadaParaAprobar.length > 0
        ? materiaEncontrada.aprobadaParaAprobar.map(c => this.obtenerNombreMateria(c)).join(', ')
        : 'Ninguna adicional';

      return {
        texto: `📚 **Correlatividades para ${materiaEncontrada.nombre} (${materiaEncontrada.codigoGuarani})**:

• **Para Cursar (Regularizada requerida):** ${regCursar}
• **Para Cursar (Aprobada requerida):** ${aprobCursar}
• **Para Rendir Examen Final (Aprobada requerida):** ${aprobAprobar}

*Plan de Estudios:* **${materiaEncontrada.anio}° Año** | **${materiaEncontrada.cuatrimestre}° Cuatrimestre** | **${materiaEncontrada.horasTotales} hs** totales (${materiaEncontrada.horasSemanales} hs/sem).`,
        fuente: 'Base de Datos SQLite - Plan de Estudios Oficial UNRN',
        sugerencias: [
          `¿En qué aula y horario se cursa ${materiaEncontrada.nombre}?`,
          `¿Qué contenidos se ven en ${materiaEncontrada.nombre}?`,
          `¿Qué materias componen el ${materiaEncontrada.anio}° año?`
        ]
      };
    }

    // 2. CONSULTAS SOBRE HORARIOS, AULAS O DOCENTES DE UNA MATERIA
    if (materiaEncontrada && esConsultaHorarioDocente) {
      const todasLasComisiones = this.horarios.filter(h =>
        h.codigoMateria === materiaEncontrada.codigoGuarani ||
        this.normalizarTexto(h.nombreMateria) === this.normalizarTexto(materiaEncontrada.nombre)
      );

      if (todasLasComisiones.length > 0) {
        let detalle = `🏛️ **Horarios y Aulas de ${materiaEncontrada.nombre} (2° Cuatrimestre 2026)**:\n\n`;
        todasLasComisiones.forEach(c => {
          detalle += `🔹 **Comisión ${c.comision}** (${c.tipoClase}):\n` +
            `  • Día: **${c.diaSemana.toUpperCase()}** de **${c.horaDesde} a ${c.horaHasta}** hs\n` +
            `  • Aula/Sede: **${c.aula}** (${c.lugar})\n` +
            `  • Docente: **${c.docente}** ${c.emailDocente ? `(\`${c.emailDocente}\`)` : ''}\n` +
            (c.auxiliar ? `  • Auxiliar: **${c.auxiliar}** ${c.emailAuxiliar ? `(\`${c.emailAuxiliar}\`)` : ''}\n` : '') +
            (c.observaciones ? `  • Nota: *${c.observaciones}*\n` : '') + `\n`;
        });

        return {
          texto: detalle.trim(),
          fuente: 'Base de Datos SQLite - Cronograma Semanal UNRN',
          sugerencias: [
            `¿Qué correlativas pide ${materiaEncontrada.nombre}?`,
            `¿Qué temas se ven en ${materiaEncontrada.nombre}?`,
            `¿Dónde queda ${todasLasComisiones[0]?.aula}?`
          ]
        };
      } else {
        return {
          texto: `🏛️ **${materiaEncontrada.nombre} (${materiaEncontrada.codigoGuarani})**: Corresponde al **${materiaEncontrada.cuatrimestre}° Cuatrimestre** del **${materiaEncontrada.anio}° Año**.

En este cuatrimestre no registra comisiones activas en el cronograma semanal del 2° cuatrimestre 2026 (o es una materia correspondiente al 1° cuatrimestre).`,
          fuente: 'Base de Datos SQLite - Cronograma UNRN',
          sugerencias: [
            `¿Qué correlativas tiene ${materiaEncontrada.nombre}?`,
            `¿Qué contenidos se ven en ${materiaEncontrada.nombre}?`,
            `¿Qué materias componen el ${materiaEncontrada.anio}° año?`
          ]
        };
      }
    }

    // 3. CONSULTA DE CONTENIDOS MÍNIMOS DE UNA ASIGNATURA
    if (materiaEncontrada && esConsultaContenido) {
      return {
        texto: `📖 **Contenidos Mínimos de ${materiaEncontrada.nombre} (${materiaEncontrada.codigoGuarani})**:

${materiaEncontrada.contenidosMinimos || 'Contenidos mínimos según resolución oficial de carrera.'}

🎯 **Objetivos Principales:**
${(materiaEncontrada.objetivos || []).map(o => `• ${o}`).join('\n') || '• Conforme a la ordenanza oficial de la carrera.'}`,
        fuente: 'Base de Datos SQLite - Contenidos Mínimos UNRN',
        sugerencias: [
          `¿Qué correlativas tiene ${materiaEncontrada.nombre}?`,
          `¿En qué horario se cursa ${materiaEncontrada.nombre}?`,
          `¿Qué materias componen el ${materiaEncontrada.anio}° año?`
        ]
      };
    }

    // 4. BÚSQUEDA POR DOCENTE EN EL CRONOGRAMA
    const docenteEncontrado = this.horarios.find(h => {
      const docNorm = this.normalizarTexto(h.docente);
      const auxNorm = h.auxiliar ? this.normalizarTexto(h.auxiliar) : '';
      const palabras = [...docNorm.split(' '), ...auxNorm.split(' ')].filter(p => p.length > 2);
      return palabras.some(p => q.includes(p));
    });

    if (docenteEncontrado && (q.includes('docente') || q.includes('profesor') || q.includes('da ') || q.includes('dicta') || q.includes('mail') || q.includes('email') || q.includes('quien'))) {
      const nombreDoc = docenteEncontrado.docente;
      const clasesDoc = this.horarios.filter(h => h.docente === nombreDoc);

      let respDoc = `👨‍🏫 **Docente: ${nombreDoc}**\n`;
      if (docenteEncontrado.emailDocente) {
        respDoc += `✉️ **Contacto:** \`${docenteEncontrado.emailDocente}\`\n\n`;
      }
      respDoc += `**Cátedras y comisiones a cargo (2° Cuatrimestre 2026):**\n`;
      clasesDoc.forEach(c => {
        respDoc += `• **${c.nombreMateria}** (${c.comision} - ${c.tipoClase}): ${c.diaSemana.toUpperCase()} ${c.horaDesde}-${c.horaHasta} hs en aula **${c.aula}** (${c.lugar})\n`;
      });

      return {
        texto: respDoc.trim(),
        fuente: 'Base de Datos SQLite - Cuerpo Docente UNRN',
        sugerencias: [
          `¿Qué correlativas pide ${clasesDoc[0]?.nombreMateria || 'Programación I'}?`,
          `¿Dónde queda el aula ${clasesDoc[0]?.aula || 'Tacuarí'}?`,
          'Ver calendario de exámenes 2026'
        ]
      };
    }

    // 5. BÚSQUEDA POR AULA ESPECÍFICA
    const aulaEncontrada = this.aulas.find(a => q.includes(a.id.toLowerCase()) || q.includes(this.normalizarTexto(a.nombre)));
    if (aulaEncontrada && (q.includes('aula') || q.includes('donde') || q.includes('sede') || q.includes('laboratorio'))) {
      const clasesEnAula = this.horarios.filter(h => h.aula.toLowerCase() === aulaEncontrada.id.toLowerCase());
      let textoAula = `📍 **${aulaEncontrada.nombre}**\n` +
        `• Sede: **${aulaEncontrada.sede}**\n` +
        `• Tipo: **${aulaEncontrada.tipo === 'laboratorio' ? 'Laboratorio de Computación/Electrónica' : 'Aula de Teoría/Práctica'}**\n\n` +
        `**Clases programadas en esta aula:**\n`;

      if (clasesEnAula.length === 0) {
        textoAula += `No hay clases regulares asignadas de Ingeniería en Computación en el 2° cuatrimestre.`;
      } else {
        clasesEnAula.forEach(cl => {
          textoAula += `• **${cl.diaSemana.toUpperCase()} ${cl.horaDesde}-${cl.horaHasta} hs**: ${cl.nombreMateria} (${cl.comision}) - Docente: ${cl.docente}\n`;
        });
      }

      return {
        texto: textoAula,
        fuente: 'Base de Datos SQLite - Distribución de Aulas Sede Andina',
        sugerencias: ['¿Dónde queda la sede Malvinas Argentinas?', 'Ver estado de aulas en tiempo real']
      };
    }

    // 6. CONSULTA DE MATERIAS POR AÑO (1° a 5° año)
    let anioBuscado: number | null = null;
    if (q.includes('primer ano') || q.includes('1 ano') || q.includes('1er ano') || q.includes('1ro') || q.includes('primer nivel')) anioBuscado = 1;
    else if (q.includes('segundo ano') || q.includes('2 ano') || q.includes('2do ano') || q.includes('segundo nivel')) anioBuscado = 2;
    else if (q.includes('tercer ano') || q.includes('3 ano') || q.includes('3er ano') || q.includes('tercer nivel')) anioBuscado = 3;
    else if (q.includes('cuarto ano') || q.includes('4 ano') || q.includes('4to ano') || q.includes('cuarto nivel')) anioBuscado = 4;
    else if (q.includes('quinto ano') || q.includes('5 ano') || q.includes('5to ano') || q.includes('quinto nivel')) anioBuscado = 5;

    if (anioBuscado && (q.includes('materia') || q.includes('materias') || q.includes('que hay') || q.includes('asignatura') || q.includes('plan') || q.includes('cursa'))) {
      const materiasDelAnio = this.materias.filter(m => m.anio === anioBuscado);
      const c1 = materiasDelAnio.filter(m => m.cuatrimestre === 1);
      const c2 = materiasDelAnio.filter(m => m.cuatrimestre === 2);

      let respAnio = `📚 **Plan de Estudios: Materias de ${anioBuscado}° Año**:\n\n`;
      respAnio += `🔹 **1° Cuatrimestre:**\n`;
      c1.forEach(m => {
        respAnio += `  • **${m.nombre}** (${m.codigoGuarani}) - ${m.horasTotales} hs\n`;
      });
      respAnio += `\n🔹 **2° Cuatrimestre:**\n`;
      c2.forEach(m => {
        respAnio += `  • **${m.nombre}** (${m.codigoGuarani}) - ${m.horasTotales} hs\n`;
      });

      return {
        texto: respAnio.trim(),
        fuente: 'Base de Datos SQLite - Plan de Estudios Oficial UNRN',
        sugerencias: [
          `¿Qué correlativas tiene ${materiasDelAnio[0]?.nombre}?`,
          `¿Qué materias componen el título intermedio?`,
          `¿Qué materias hay en ${anioBuscado === 5 ? 1 : anioBuscado + 1}° año?`
        ]
      };
    }

    // 7. CONSULTA POR MATERIA AISLADA (Ficha Completa si el usuario solo escribió el nombre de la materia)
    if (materiaEncontrada) {
      const regCursar = materiaEncontrada.regularizadaParaCursar.length > 0
        ? materiaEncontrada.regularizadaParaCursar.map(c => this.obtenerNombreMateria(c)).join(', ')
        : 'Ninguna';

      const aprobCursar = materiaEncontrada.aprobadaParaCursar.length > 0
        ? materiaEncontrada.aprobadaParaCursar.map(c => this.obtenerNombreMateria(c)).join(', ')
        : 'Ninguna';

      const todasLasComisiones = this.horarios.filter(h =>
        h.codigoMateria === materiaEncontrada.codigoGuarani ||
        this.normalizarTexto(h.nombreMateria) === this.normalizarTexto(materiaEncontrada.nombre)
      );

      let resumen = `📘 **${materiaEncontrada.nombre} (${materiaEncontrada.codigoGuarani})**\n` +
        `• **Año y Cuatrimestre:** ${materiaEncontrada.anio}° Año • ${materiaEncontrada.cuatrimestre}° Cuatrimestre\n` +
        `• **Carga Horaria:** ${materiaEncontrada.horasTotales} hs totales (${materiaEncontrada.horasSemanales} hs semanales)\n\n` +
        `**Correlativas para cursar:**\n` +
        `• Regularizada requerida: **${regCursar}**\n` +
        `• Aprobada requerida: **${aprobCursar}**\n`;

      if (todasLasComisiones.length > 0) {
        resumen += `\n**Horarios 2° Cuatrimestre 2026:**\n`;
        todasLasComisiones.forEach(c => {
          resumen += `• Com. ${c.comision}: ${c.diaSemana.toUpperCase()} ${c.horaDesde}-${c.horaHasta} hs (${c.aula}) - Docente: ${c.docente}\n`;
        });
      }

      return {
        texto: resumen.trim(),
        fuente: 'Base de Datos SQLite - Plan de Estudios UNRN',
        sugerencias: [
          `¿Qué contenidos se ven en ${materiaEncontrada.nombre}?`,
          `¿Qué materias componen el ${materiaEncontrada.anio}° año?`,
          'Ver fechas de exámenes 2026'
        ]
      };
    }

    // 8. CONSULTAS SOBRE CALENDARIO ACADÉMICO / EXÁMENES / RECESO / INSCRIPCIONES
    if (q.includes('examen') || q.includes('examenes') || q.includes('mesa') || q.includes('mesas') || q.includes('calendario') || q.includes('inscripci') || q.includes('receso') || q.includes('feriado') || q.includes('vacaciones') || q.includes('cuatrimestre')) {
      let eventosRelevantes = this.calendario;

      if (q.includes('febrero')) {
        eventosRelevantes = this.calendario.filter(e => e.titulo.toLowerCase().includes('febrero') || e.fechaTexto.includes('/02/'));
      } else if (q.includes('julio')) {
        eventosRelevantes = this.calendario.filter(e => e.titulo.toLowerCase().includes('julio') || e.fechaTexto.includes('/07/'));
      } else if (q.includes('diciembre')) {
        eventosRelevantes = this.calendario.filter(e => e.titulo.toLowerCase().includes('diciembre') || e.fechaTexto.includes('/12/'));
      } else if (q.includes('mayo')) {
        eventosRelevantes = this.calendario.filter(e => e.titulo.toLowerCase().includes('mayo') || e.fechaTexto.includes('/05/'));
      } else if (q.includes('septiembre')) {
        eventosRelevantes = this.calendario.filter(e => e.titulo.toLowerCase().includes('septiembre') || e.fechaTexto.includes('/09/'));
      } else if (q.includes('receso') || q.includes('vacaciones')) {
        eventosRelevantes = this.calendario.filter(e => e.categoria === 'receso');
      }

      let resp = `📅 **Fechas clave del Calendario Académico UNRN 2026**:\n\n`;
      (eventosRelevantes.length > 0 ? eventosRelevantes : this.calendario).slice(0, 6).forEach(ev => {
        resp += `• **${ev.fechaTexto}**: ${ev.titulo}\n`;
      });

      return {
        texto: resp,
        fuente: 'Base de Datos SQLite - Calendario Académico UNRN',
        sugerencias: [
          '¿Cuándo son los exámenes de Julio?',
          '¿Cuándo es el receso de invierno?',
          '¿Cuándo son los exámenes de Diciembre?'
        ]
      };
    }

    // 9. CONSULTAS SOBRE EL TÍTULO INTERMEDIO O DE GRADO
    if (q.includes('titulo intermedio') || q.includes('tecnico') || q.includes('tecnicatura') || q.includes('alcance') || q.includes('perfil') || q.includes('duracion') || q.includes('horas') || q.includes('grado')) {
      return {
        texto: `🎓 **Títulos de la Carrera de ${this.infoCarrera.nombre} (${this.infoCarrera.sede})**:

1. **Título de Grado: ${this.infoCarrera.tituloGrado}**
   - **Duración:** ${this.infoCarrera.duracionGrado}
   - **Perfil:** ${this.infoCarrera.perfil}
   - **Enfoque Regional:** ${this.infoCarrera.enfoqueRegional}

2. **Título Intermedio: ${this.infoCarrera.tituloIntermedio}**
   - **Duración:** ${this.infoCarrera.duracionIntermedio}
   - **Alcances:** Asistir técnicamente en software y hardware, sistemas embebidos, transmisión de señales y administración básica de redes.`,
        fuente: 'Base de Datos SQLite - Información Oficial de Carrera',
        sugerencias: [
          '¿Qué materias componen el 3° año?',
          '¿Qué correlativas pide Seguridad Ambiental?',
          'Ver mi progreso hacia el título intermedio'
        ]
      };
    }

    // 10. PREGUNTÓ POR CORRELATIVAS O HORARIOS SIN ESPECIFICAR LA MATERIA
    if (esConsultaCorrelativas) {
      return {
        texto: `📚 ¿Sobre qué materia te gustaría consultar las correlativas?

Podés escribirme el nombre o código de la asignatura, por ejemplo:
• *"¿Qué necesito para cursar Programación III?"*
• *"Correlativas de Inteligencia Artificial"*
• *"Requisitos para rendir Física General II"*`,
        fuente: 'Base de Datos SQLite - Plan de Estudios Oficial UNRN',
        sugerencias: [
          '¿Qué necesito para cursar Programación III?',
          '¿Qué necesito para cursar Inteligencia Artificial?',
          '¿Qué materias componen el 1° año?'
        ]
      };
    }

    if (esConsultaHorarioDocente) {
      return {
        texto: `🏛️ ¿De qué materia o docente te gustaría consultar aulas y horarios?

Podés consultar por asignatura, docente o aula, por ejemplo:
• *"¿Dónde y a qué hora se cursa Programación I?"*
• *"¿Qué materias da Walter Aguero?"*
• *"¿Dónde queda el aula B102?"*`,
        fuente: 'Base de Datos SQLite - Cronograma Semanal UNRN',
        sugerencias: [
          '¿Dónde y cuándo se cursa Programación I?',
          '¿Qué materias da Lucas Albornoz?',
          '¿Dónde se cursa Inteligencia Artificial?'
        ]
      };
    }

    // RESPUESTA GENERAL ASISTIDA
    return {
      texto: `Hola, soy el **Asistente Académico de Ingeniería en Computación (UNRN Sede Andina)**. 

Puedo ayudarte con información precisa sobre:
1. **Correlatividades**: ¿Qué materias necesitás para cursar o rendir final? *(Ej: "¿Qué necesito para cursar Programación III?")*
2. **Aulas y Horarios**: ¿Dónde, a qué hora y con qué docente se dicta una materia? *(Ej: "¿Dónde se cursa Programación I?")*
3. **Calendario 2026**: Fechas de exámenes, cuatrimestres, recesos y feriados. *(Ej: "¿Cuándo son las mesas de examen de Julio?")*
4. **Plan de Estudios**: Cargas horarias, título intermedio de Técnico Universitario y materias por año.

¿Sobre qué tema te gustaría consultar?`,
      fuente: 'Base de Datos SQLite - UNRN Sede Andina',
      sugerencias: [
        '¿Qué necesito para cursar Programación III?',
        '¿Dónde y cuándo se cursa Programación I?',
        '¿Cuándo son los exámenes de Julio 2026?',
        '¿Qué materias componen el 1° año?'
      ]
    };
  }

  private obtenerNombreMateria(codigo: string): string {
    const mat = this.materias.find(m => m.codigoGuarani === codigo || m.nombre.toLowerCase() === codigo.toLowerCase());
    return mat ? `${mat.nombre} (${mat.codigoGuarani})` : codigo;
  }

  /**
   * Llamada opcional a la API real de Google Gemini si el usuario proporcionó una clave
   */
  private async consultarGeminiApi(pregunta: string): Promise<string | null> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;

    const contextPrompt = `
Sos el Asistente Virtual Oficial de la carrera de Ingeniería en Computación de la Universidad Nacional de Río Negro (UNRN), Sede Andina (San Carlos de Bariloche).
Respondé de manera precisa, amigable y profesional basándote en los datos oficiales de la carrera (Resolución CSDEyVE 044/2019, Calendario Académico 2026, Cronograma de horarios 2° cuatrimestre 2026 en Sede Anasagasti 2 y Anasagasti 1).
Pregunta del estudiante: "${pregunta}"
`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: contextPrompt }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.2 }
      })
    });

    if (!res.ok) {
      throw new Error(`Error en API Gemini: ${res.statusText}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }
}

export const aiAssistant = new AIKnowledgeEngine();
