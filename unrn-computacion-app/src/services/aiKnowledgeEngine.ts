import { MATERIAS_DATA, INFO_CARRERA } from '../data/carreraData';
import { HORARIOS_DATA, AULAS_DATA } from '../data/horariosData';
import { CALENDARIO_DATA } from '../data/calendarioData';

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
 * Combina un procesador RAG local de alta fidelidad con todas las respuestas
 * exactas basadas en la documentación oficial, y soporte opcional para Gemini API.
 */
export class AIKnowledgeEngine {
  private geminiApiKey: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.geminiApiKey = localStorage.getItem('unrn_gemini_api_key') || '';
    }
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

    // Motor de inferencia local basado en el conocimiento oficial de los 4 PDFs
    // Simula una breve latencia de razonamiento asincrónico para mejorar la experiencia de usuario
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

  private resolverConsultaLocal(queryRaw: string): { texto: string; fuente: string; sugerencias?: string[] } {
    const q = queryRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 1. CONSULTA DE CORRELATIVIDADES
    if (q.includes('correlativ') || q.includes('necesito para cursar') || q.includes('para rendir') || q.includes('puedo cursar')) {
      // Buscar qué materia menciona
      const materiaEncontrada = MATERIAS_DATA.find(m => {
        const nom = m.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cod = m.codigoGuarani.toLowerCase();
        return q.includes(nom) || q.includes(cod);
      });

      if (materiaEncontrada) {
        const regCursar = materiaEncontrada.regularizadaParaCursar.length > 0
          ? materiaEncontrada.regularizadaParaCursar.map(c => this.obtenerNombreMateria(c)).join(', ')
          : 'Ninguna (sin correlativas para cursar)';

        const aprobCursar = materiaEncontrada.aprobadaParaCursar.length > 0
          ? materiaEncontrada.aprobadaParaCursar.map(c => this.obtenerNombreMateria(c)).join(', ')
          : 'Ninguna';

        const aprobAprobar = materiaEncontrada.aprobadaParaAprobar.length > 0
          ? materiaEncontrada.aprobadaParaAprobar.map(c => this.obtenerNombreMateria(c)).join(', ')
          : 'Ninguna adicional';

        return {
          texto: `📚 **Correlativas para ${materiaEncontrada.nombre} (${materiaEncontrada.codigoGuarani})**:

- **Para Cursar (Regularizada requerida):** ${regCursar}
- **Para Cursar (Aprobada requerida):** ${aprobCursar}
- **Para Rendir Examen Final (Aprobada requerida):** ${aprobAprobar}

*Año:* ${materiaEncontrada.anio}° Año | *Cuatrimestre:* ${materiaEncontrada.cuatrimestre}° | *Carga horaria:* ${materiaEncontrada.horasTotales} hs.`,
          fuente: 'Plan de Estudios Oficial - Res. CSDEyVE 044/2019',
          sugerencias: [
            `¿Qué contenidos tiene ${materiaEncontrada.nombre}?`,
            `¿En qué aula y horario se cursa?`,
            `¿Qué necesito para cursar Inteligencia Artificial?`
          ]
        };
      }
    }

    // 2. CONSULTAS SOBRE HORARIOS, AULAS O DOCENTES
    if (q.includes('aula') || q.includes('horario') || q.includes('donde se cursa') || q.includes('docente') || q.includes('quien da') || q.includes('profesor') || q.includes('email')) {
      const materiaEncontrada = HORARIOS_DATA.find(h => {
        const nom = h.nombreMateria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cod = h.codigoMateria.toLowerCase();
        return q.includes(nom) || q.includes(cod);
      });

      if (materiaEncontrada) {
        const todasLasComisiones = HORARIOS_DATA.filter(h => h.codigoMateria === materiaEncontrada.codigoMateria);
        let detalle = `🏛️ **Horarios y Aulas de ${materiaEncontrada.nombreMateria} (2° Cuatrimestre 2026)**:\n\n`;

        todasLasComisiones.forEach(c => {
          detalle += `🔹 **Comisión ${c.comision}** (${c.tipoClase}):\n` +
            `  • Día: **${c.diaSemana.toUpperCase()}** de **${c.horaDesde} a ${c.horaHasta}** hs\n` +
            `  • Aula/Sede: **${c.aula}** (${c.lugar})\n` +
            `  • Docente: **${c.docente}** ${c.emailDocente ? `(\`${c.emailDocente}\`)` : ''}\n` +
            (c.auxiliar ? `  • Auxiliar: **${c.auxiliar}** ${c.emailAuxiliar ? `(\`${c.emailAuxiliar}\`)` : ''}\n` : '') +
            (c.observaciones ? `  • Nota: *${c.observaciones}*\n` : '') + `\n`;
        });

        return {
          texto: detalle,
          fuente: 'Cronograma Semanal 2° Cuatrimestre 2026 - UNRN Bariloche',
          sugerencias: [
            `¿Qué correlativas pide esta materia?`,
            `¿Qué aulas tiene la sede Anasagasti 2?`,
            `¿Dónde se cursa Redes de Área Local?`
          ]
        };
      }

      // Si consulta sobre un aula específica
      const aulaEncontrada = AULAS_DATA.find(a => q.includes(a.id.toLowerCase()) || q.includes(a.nombre.toLowerCase()));
      if (aulaEncontrada) {
        const clasesEnAula = HORARIOS_DATA.filter(h => h.aula.toLowerCase() === aulaEncontrada.id.toLowerCase());
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
          fuente: 'Distribución de Aulas Sede Andina 2026',
          sugerencias: ['¿Dónde queda la sede Malvinas Argentinas?', 'Ver estado de aulas en tiempo real']
        };
      }
    }

    // 3. CONSULTAS SOBRE CALENDARIO ACADÉMICO / EXÁMENES / RECESO / INSCRIPCIONES
    if (q.includes('examen') || q.includes('mesa') || q.includes('calendario') || q.includes('inscripci') || q.includes('receso') || q.includes('feriado') || q.includes('cuatrimestre')) {
      let eventosRelevantes = CALENDARIO_DATA;

      if (q.includes('febrero')) {
        eventosRelevantes = CALENDARIO_DATA.filter(e => e.titulo.toLowerCase().includes('febrero') || e.fechaTexto.includes('/02/'));
      } else if (q.includes('julio')) {
        eventosRelevantes = CALENDARIO_DATA.filter(e => e.titulo.toLowerCase().includes('julio') || e.fechaTexto.includes('/07/'));
      } else if (q.includes('diciembre')) {
        eventosRelevantes = CALENDARIO_DATA.filter(e => e.titulo.toLowerCase().includes('diciembre') || e.fechaTexto.includes('/12/'));
      } else if (q.includes('receso') || q.includes('vacaciones')) {
        eventosRelevantes = CALENDARIO_DATA.filter(e => e.categoria === 'receso');
      }

      let resp = `📅 **Fechas clave del Calendario Académico UNRN 2026**:\n\n`;
      eventosRelevantes.slice(0, 6).forEach(ev => {
        resp += `• **${ev.fechaTexto}**: ${ev.titulo}\n`;
      });

      return {
        texto: resp,
        fuente: 'Resolución CSDEyVE N° 038/2024 - Calendario Académico UNRN',
        sugerencias: [
          '¿Cuándo son los exámenes de Julio?',
          '¿Cuándo es el receso de invierno?',
          '¿Cuándo son los exámenes de Diciembre?'
        ]
      };
    }

    // 4. CONSULTAS SOBRE EL TÍTULO INTERMEDIO O DE GRADO
    if (q.includes('titulo intermedio') || q.includes('tecnico') || q.includes('alcance') || q.includes('perfil') || q.includes('duracion') || q.includes('horas')) {
      return {
        texto: `🎓 **Títulos de la Carrera de ${INFO_CARRERA.nombre} (${INFO_CARRERA.sede})**:

1. **Título de Grado: ${INFO_CARRERA.tituloGrado}**
   - **Duración:** ${INFO_CARRERA.duracionGrado}
   - **Perfil:** ${INFO_CARRERA.perfil}
   - **Enfoque Regional:** ${INFO_CARRERA.enfoqueRegional}

2. **Título Intermedio: ${INFO_CARRERA.tituloIntermedio}**
   - **Duración:** ${INFO_CARRERA.duracionIntermedio}
   - **Alcances:** Asistir técnicamente en software y hardware, sistemas embebidos, transmisión de señales y administración básica de redes.`,
        fuente: 'Ficha de Carrera UNRN - Res. Ministerial N° 762/2021',
        sugerencias: [
          '¿Qué materias componen el 3° año?',
          '¿Qué correlativas pide Seguridad Ambiental?',
          'Ver mi progreso hacia el título intermedio'
        ]
      };
    }

    // 5. CONSULTA DE CONTENIDOS MÍNIMOS DE UNA ASIGNATURA
    if (q.includes('contenido') || q.includes('temas') || q.includes('programa') || q.includes('de que trata') || q.includes('aprende')) {
      const mat = MATERIAS_DATA.find(m => {
        const nom = m.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return q.includes(nom);
      });

      if (mat && mat.contenidosMinimos) {
        return {
          texto: `📖 **Contenidos Mínimos de ${mat.nombre} (${mat.codigoGuarani})**:

${mat.contenidosMinimos}

🎯 **Objetivos Principales:**
${(mat.objetivos || []).map(o => `• ${o}`).join('\n')}`,
          fuente: 'Plan de Estudios Oficial UNRN - Contenidos Mínimos',
          sugerencias: [
            `¿Qué correlativas tiene ${mat.nombre}?`,
            `¿En qué horario se dicta?`
          ]
        };
      }
    }

    // RESPUESTA GENERAL ASISTIDA
    return {
      texto: `Hola, soy el **Asistente Académico de Ingeniería en Computación (UNRN Sede Andina)**. 

Puedo ayudarte con información precisa sobre:
1. **Correlatividades**: ¿Qué materias necesitás para cursar o rendir final? *(Ej: "¿Qué necesito para cursar Inteligencia Artificial?")*
2. **Aulas y Horarios**: ¿Dónde, a qué hora y con qué docente se dicta una materia? *(Ej: "¿Dónde se cursa Programación I?")*
3. **Calendario 2026**: Fechas de exámenes, cuatrimestres, recesos y feriados. *(Ej: "¿Cuándo son las mesas de examen de Julio?")*
4. **Plan de Estudios**: Cargas horarias, título intermedio de Técnico Universitario y contenidos mínimos.

¿Sobre qué tema te gustaría consultar?`,
      fuente: 'Base de Conocimiento Oficial UNRN Sede Andina',
      sugerencias: [
        '¿Qué necesito para cursar Inteligencia Artificial?',
        '¿Dónde y cuándo se cursa Programación I?',
        '¿Cuándo son los exámenes de Julio 2026?',
        '¿Qué materias integran el título de Técnico Universitario?'
      ]
    };
  }

  private obtenerNombreMateria(codigo: string): string {
    const mat = MATERIAS_DATA.find(m => m.codigoGuarani === codigo || m.nombre.toLowerCase() === codigo.toLowerCase());
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
