#!/usr/bin/env node
/**
 * Genera: Fundamentación Metodológica de Socrates (.docx)
 * Ejecutar: NODE_PATH="$(npm root -g)" node scripts/gen_fundamentacion.mjs
 */

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const docx = require('C:/Users/Alejandro Rudloff/AppData/Roaming/npm/node_modules/docx')
const {
  Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, convertInchesToTwip,
  Header, Footer, PageNumber, Packer
} = docx
import { writeFileSync } from 'node:fs'

// ============================================================
// Helpers
// ============================================================
const FONT = 'Calibri'
const FONT_SIZE = 22 // 11pt × 2

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 360, after: 120 },
    style: 'heading' + (level === HeadingLevel.HEADING_1 ? '1' : level === HeadingLevel.HEADING_2 ? '2' : '3'),
  })
}

function para(text, opts = {}) {
  const runs = []
  // Parse **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: FONT, size: FONT_SIZE }))
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true, font: FONT, size: FONT_SIZE }))
    } else {
      runs.push(new TextRun({ text: part, font: FONT, size: FONT_SIZE, ...opts }))
    }
  }
  return new Paragraph({
    children: runs,
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  })
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE })],
    bullet: { level: 0 },
    spacing: { after: 60 },
  })
}

function tableRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map(text => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text,
          font: FONT,
          size: 20,
          bold: isHeader,
        })],
        spacing: { after: 40 },
      })],
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
    })),
  })
}

function simpleTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow(headers, true),
      ...rows.map(r => tableRow(r)),
    ],
  })
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 } })
}

// ============================================================
// Document content
// ============================================================

const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: 'heading1',
        name: 'Heading 1',
        run: { font: FONT, size: 32, bold: true, color: '1e293b' },
        paragraph: { spacing: { before: 480, after: 160 } },
      },
      {
        id: 'heading2',
        name: 'Heading 2',
        run: { font: FONT, size: 28, bold: true, color: '0f766e' },
        paragraph: { spacing: { before: 360, after: 120 } },
      },
      {
        id: 'heading3',
        name: 'Heading 3',
        run: { font: FONT, size: 24, bold: true, color: '334155' },
        paragraph: { spacing: { before: 240, after: 80 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Socrates — Fundamentación Metodológica', font: FONT, size: 16, color: '999999', italics: true })],
          alignment: AlignmentType.RIGHT,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Página ', font: FONT, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16 })],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children: [

      // ====== PORTADA ======
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({
        children: [new TextRun({ text: 'SOCRATES', font: FONT, size: 56, bold: true, color: '1e293b' })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Fundamentación Metodológica', font: FONT, size: 36, color: '0f766e' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Tutor doctoral basado en inteligencia artificial que acelera el aprendizaje sin generar deuda cognitiva', font: FONT, size: 24, italics: true, color: '666666' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Alejandro Rudloff Muñoz', font: FONT, size: 24, bold: true })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Doctorado en Management — Universidad de Talca', font: FONT, size: 22 })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Abril 2026', font: FONT, size: 22 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Operacionalización del artículo A9 del cluster doctoral "Coexistir con lo que nos excede"', font: FONT, size: 20, color: '888888' })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: false }),

      // ====== 1. EL PROBLEMA ======
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      heading('1. El problema que Socrates resuelve'),

      para('El estudiante doctoral típico desperdicia entre 40% y 60% de su tiempo de estudio en estrategias inefectivas: re-leer, subrayar, tomar notas sin síntesis, repasar lo que ya domina. La oferta tecnológica reciente —tutores basados en modelos de lenguaje— promete resolver esto, pero la evidencia empírica muestra que mal diseñados producen el efecto opuesto: aprendizaje aparente con atrofia real.'),

      heading('1.1 La paradoja de Bastani', HeadingLevel.HEADING_2),

      para('El experimento de Bastani et al. (2025, *PNAS*) demostró empíricamente que el mismo modelo de IA (GPT-4) puede producir aprendizaje real o atrofia cognitiva según el marco pedagógico que gobierna su comportamiento. Sin guardrails pedagógicos, los estudiantes terminaron 17% peor que el grupo control después de usar la herramienta (+48% durante el uso, -17% sin la herramienta). Con guardrails socráticos, la mejora fue del 127% sin daño residual.'),

      para('**La tecnología no es la variable. La instrucción es la variable.** Socrates es la operacionalización doctoral de esa lección.'),

      heading('1.2 Deuda cognitiva', HeadingLevel.HEADING_2),

      para('La deuda cognitiva es el costo diferido del aprendizaje superficial: el aprendiz acumula sensación de progreso (páginas leídas, resúmenes generados, quiz aprobados) sin construir comprensión transferible. Cuando enfrenta una situación sin la herramienta —un seminario, una defensa, una discusión con el asesor—, descubre que no sabe lo que creía saber. El artículo A9 del cluster doctoral identifica esta deuda como el riesgo central de los sistemas tutores basados en IA.'),

      heading('1.3 La pregunta de diseño', HeadingLevel.HEADING_2),

      para('¿Cómo construir un sistema basado en IA que acelere el aprendizaje doctoral sin generar deuda cognitiva? La respuesta de Socrates: aplicar seis principios pedagógicos derivados de la evidencia empírica de los últimos 30 años de ciencias del aprendizaje, anclados en la teoría del aprendizaje significativo de Ausubel (1963), y operacionalizados mediante una arquitectura multi-agente donde cada agente tiene una responsabilidad pedagógica delimitada y verificable.'),

      // ====== 2. LOS 6 PRINCIPIOS ======
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      heading('2. Los seis principios pedagógicos'),

      para('Cada principio es un criterio verificable de diseño derivado del artículo A9 del cluster doctoral *Coexistir con lo que nos excede*. No son sugerencias — son restricciones no negociables que determinan el comportamiento de cada agente del sistema.'),

      heading('2.1 Fallo productivo (Kapur, 2024)', HeadingLevel.HEADING_2),
      para('La lucha cognitiva precede a la instrucción. El aprendiz que intenta resolver un problema antes de recibir la explicación activa su procesador inconsciente, recupera conocimiento previo e intenta analogías. Cuando la explicación llega, aterriza en una estructura mental ya activada. Evidencia: meta-análisis de Sinha y Kapur (2021) con tamaños de efecto d = 0.36 a 0.58.'),
      para('**Implementación:** toda micro-lección comienza con un desafío, no con una explicación. El sistema registra los intentos del aprendiz antes de entregar la instrucción canónica.'),

      heading('2.2 Grafo de prerequisitos y frontera de aprendibilidad (Falmagne & Doignon, 1985)', HeadingLevel.HEADING_2),
      para('El conocimiento de un dominio es un orden parcial, no una lista lineal. El sistema opera siempre en la frontera de aprendibilidad: conceptos cuyos prerequisitos están satisfechos pero el aprendiz aún no domina. Operacionalizado en ALEKS desde los años 90 con resultados consistentes.'),
      para('**Implementación:** el agente A2 construye un grafo dirigido de prerequisitos a partir del texto. El agente A5 selecciona la próxima unidad de la frontera.'),

      heading('2.3 Diálogo socrático estructurado (Graesser, AutoTutor)', HeadingLevel.HEADING_2),
      para('El diálogo dirigido por expectativas y misconcepciones pre-identificadas produce tamaños de efecto medios de d = 0.81 (Graesser et al., 2014). Para cada concepto, el sistema tiene una rúbrica de expectativas y un catálogo de misconcepciones que guían el diálogo.'),
      para('**Implementación:** el agente A3 genera rúbrica + catálogo. El agente A4 conduce el diálogo verificando evidencia de dominio contra la rúbrica.'),

      heading('2.4 Aprendizaje cognitivo y protégé inverso (Collins et al., 1989)', HeadingLevel.HEADING_2),
      para('El modelado experto verbaliza el proceso de razonamiento, no solo la respuesta. La inversión de rol (el aprendiz enseña al sistema) produce procesamiento más profundo que el estudio para sí mismo (Chase et al., 2009, Betty\'s Brain).'),

      heading('2.5 Detección afectiva e intervención calibrada', HeadingLevel.HEADING_2),
      para('El mismo aprendiz requiere intervenciones distintas según su estado afectivo. Un aprendiz frustrado necesita reconocimiento; uno aburrido necesita más desafío; uno en flujo necesita que no se le interrumpa. El agente A9 clasifica el estado por señales conductuales.'),

      heading('2.6 Salida generativa estructurada (Wittrock, 1974; Fiorella & Mayer, 2016)', HeadingLevel.HEADING_2),
      para('Toda interacción termina con producción del aprendiz, no con recepción pasiva. Tamaños de efecto d = 0.40 a 0.77. Las producciones se organizan en tres niveles: Tier 1 (síntesis breve), Tier 2 (respuesta crítica), Tier 3 (análisis doctoral).'),

      // ====== 3. AUSUBEL Y EL POA ======
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      heading('3. Anclaje teórico: Ausubel estricto y el Perfil de Objetivo del Aprendiz'),

      para('Socrates no es un sistema que aplica técnicas pedagógicas encima de entrega de contenido. Es un diseñador de experiencias de **aprendizaje significativo** en el sentido de David Ausubel (1963, 1968). Ausubel distingue dos modos de aprendizaje: significativo (el material nuevo se conecta de modo no arbitrario con la estructura cognitiva del aprendiz) y mecánico (el material se incorpora aislado, por repetición).'),

      para('Para que el aprendizaje sea significativo, tres condiciones deben cumplirse simultáneamente:'),

      simpleTable(
        ['Condición de Ausubel', 'Operacionalización en Socrates'],
        [
          ['1. Material potencialmente significativo', 'Corpus + curaduría del A11 + roles de PDFs (D14)'],
          ['2. Estructura cognitiva previa relevante', 'Componente 3 del POA: conocimientos previos (A12)'],
          ['3. Disposición del aprendiz', 'Componente 2 del POA: objetivo y desafío concreto (A12)'],
        ]
      ),

      spacer(),

      para('El **Perfil de Objetivo del Aprendiz (POA)** es la operacionalización pragmática de las 3 condiciones de Ausubel. El agente A12 (Entrevistador de objetivos) captura los 3 componentes del POA en una entrevista conversacional de 5-8 minutos al crear cada curso: contexto del aprendiz (13 campos), objetivo del curso, y conocimientos previos relevantes. El POA se propaga al A3 (diseño pedagógico) y al A4 (diálogo socrático) en cada llamada, calibrando el fallo productivo, la rúbrica, el catálogo de misconcepciones y la tarea generativa al objetivo real del aprendiz.'),

      // ====== 4. ARQUITECTURA MULTI-AGENTE ======
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      heading('4. Arquitectura multi-agente'),

      para('Socrates opera con **12 agentes especializados**, cada uno con responsabilidad delimitada. La separación de roles permite auditar: si el diseñador de lecciones y el evaluador de calidad son agentes diferentes, uno puede verificar al otro. Esta es la traducción interna del principio IV&V (IEEE 1012) del estándar de desarrollo.'),

      simpleTable(
        ['ID', 'Agente', 'Responsabilidad', 'MVP'],
        [
          ['A1', 'Lector', 'Extracción de texto de PDFs (pdf2json local)', '1'],
          ['A2', 'Analista semántico', 'Descomposición en unidades de sentido + grafo de prerequisitos', '1'],
          ['A3', 'Diseñador instruccional', 'Fallo productivo + rúbrica + catálogo + tarea generativa (con POA)', '1'],
          ['A4', 'Evaluador socrático', 'Diálogo + acreditación trazable (con POA) + SOLO + Toulmin', '1'],
          ['A5', 'Adaptador', 'Plan adaptativo, frontera de aprendibilidad', '1'],
          ['A6', 'Productor visual', 'Mapas conceptuales, diagramas', '2'],
          ['A7', 'Auditor de fidelidad', 'Verifica citas verbatim al 99%+', '1'],
          ['A8', 'Coach metacognitivo', 'Debrief semanal con progreso vs POA', '2'],
          ['A9', 'Detector afectivo', 'Clasificación de estado emocional', '2'],
          ['A10', 'Verificador de cobertura', 'Garantiza 100% del texto sustantivo cubierto (adversarial)', '1'],
          ['A11', 'Curador de corpus', 'Conversación de curaduría para libros >80pp', '2'],
          ['A12', 'Entrevistador de objetivos', 'Captura del POA (Ausubel)', '1'],
        ]
      ),

      spacer(),

      para('El pipeline de ingestión sigue la secuencia A1 → A2 → A10 → A3 → A7, donde el A10 verifica cobertura del 100% del texto sustantivo en un loop adversarial con el A2 (máximo 3 iteraciones). Solo después de que A10 aprueba, el A3 diseña la pedagogía con el POA en contexto, y el A7 audita la fidelidad de las citas.'),

      // ====== 5. LECTURA SOCRÁTICA (D20) ======
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      heading('5. Lectura Socrática: el texto del autor como tercer participante (D20)'),

      para('En el diseño original, el aprendiz nunca ve el texto del autor — solo la mediación condensada del A3. La comprensión que construye es de segundo orden: entiende lo que el A3 dice que el autor dice, no lo que el autor dice. La Lectura Socrática resuelve este gap.'),

      heading('5.1 Concepto', HeadingLevel.HEADING_2),
      para('La Lectura Socrática es un modo pedagógico donde el texto del autor es un tercer participante del diálogo. El A4 pregunta, el aprendiz responde, y el texto del autor confirma, desafía o matiza la respuesta. No existe en ningún tutor de IA actual.'),

      heading('5.2 Flujo pedagógico en 5 fases', HeadingLevel.HEADING_2),

      bullet('Fase 1 — Fallo productivo: el aprendiz lucha con un problema sin texto ni instrucción.'),
      bullet('Fase 2 — Instrucción canónica: el aprendiz recibe la explicación condensada del A3.'),
      bullet('Fase 3 — Diálogo conceptual (turnos 1-3): el A4 verifica comprensión base contra la rúbrica.'),
      bullet('Fase 4 — Lectura Socrática (turnos 4-6+): el A4 introduce pasajes del texto fuente en capas progresivas (oración → párrafo → argumento). Confrontación textual. Comparación inter-textual en multi-PDF.'),
      bullet('Fase 5 — Producción anclada al texto: tarea generativa con cita obligatoria del autor.'),

      heading('5.3 Capacidades', HeadingLevel.HEADING_2),
      bullet('Exposición en capas: oración → párrafo → argumento completo, cada nivel con pregunta de profundidad distinta.'),
      bullet('Confrontación textual: el A4 muestra un pasaje que contradice o matiza la respuesta del aprendiz.'),
      bullet('Lectura comparativa: en multi-PDF, pasajes de 2+ autores sobre el mismo concepto.'),
      bullet('Mapa de pasajes visitados: el aprendiz ve qué porcentaje del texto ha dialogado.'),

      // ====== 6. DASHBOARD DE METACOGNICIÓN (D21) ======
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      heading('6. Dashboard de metacognición: 6 constructos pedagógicos integrados (D21)'),

      para('El dashboard no es gamificación (XP, streaks, leaderboards — explícitamente descartados). Es un instrumento de **metacognición**: el aprendiz ve su proceso de comprensión como un mapa, no como un puntaje. Responde a la pregunta: "¿Estoy realmente aprendiendo, o solo pasando unidades?"'),

      heading('6.1 Constructos pedagógicos integrados', HeadingLevel.HEADING_2),

      simpleTable(
        ['Constructo', 'Origen', 'Qué mide en Socrates', 'Indicador'],
        [
          ['SOLO Taxonomy', 'Biggs, 1982', 'Profundidad observable de comprensión', '5 niveles: pre-estructural → abstracto extendido'],
          ['Modelo de Toulmin', 'Toulmin, 1958', 'Estructura argumentativa', '6 componentes: claim, data, warrant, backing, qualifier, rebuttal'],
          ['Bayesian Knowledge Tracing', 'Corbett & Anderson, 1995', 'Dominio probabilístico', 'Probabilidad 0-100% por concepto (no binario)'],
          ['Zona de Desarrollo Próximo', 'Vygotsky, 1978', 'Calibración de dificultad', 'Proxy: turnos para acreditación'],
          ['Epistemic Network Analysis', 'Shaffer, 2017', 'Conexiones entre conceptos', 'Grafo del aprendiz vs grafo experto'],
          ['Self-Regulated Learning', 'Zimmerman, 2000', 'Metacognición operacionalizada', 'Debrief activo al cierre de sesión'],
        ]
      ),

      spacer(),

      heading('6.2 Las 10 secciones del dashboard', HeadingLevel.HEADING_2),

      bullet('1. Progreso vs deadline: velocidad observada, proyección, alerta at_risk.'),
      bullet('2. Perfil de aprendiz (IBC): Índice de Brecha Cognitiva, escala 0-1 con categorías Experto/Competente/En desarrollo/Brecha.'),
      bullet('3. Profundidad SOLO: distribución de niveles por turno, tendencia, nivel dominante.'),
      bullet('4. Argumentación Toulmin: distribución de 6 componentes, recomendación personalizada.'),
      bullet('5. Convergencia + ZDP: turnos por sesión, tendencia, calibración de dificultad.'),
      bullet('6. Red de conceptos (ENA): grafo de conexiones del aprendiz vs grafo experto.'),
      bullet('7. Cobertura textual: pasajes discutidos, citas propias, confrontaciones.'),
      bullet('8. Inventario de conceptos: recuerdo espaciado con diálogo socrático de repaso.'),
      bullet('9. Notas personales: vinculadas a unidades, pasajes y misconcepciones.'),
      bullet('10. Mini-test: diagnóstico + checkpoint + simulacro de control.'),

      heading('6.3 Índice de Brecha Cognitiva (IBC)', HeadingLevel.HEADING_2),

      para('El IBC es un indicador compuesto que resume el estado del aprendiz en una escala 0-1:'),
      para('IBC = f(turnos promedio para acreditación, misconcepciones activas, patrón argumentativo, tendencia de convergencia)'),

      simpleTable(
        ['IBC', 'Categoría', 'Interpretación', 'Acción del sistema'],
        [
          ['0.0 – 0.3', 'Experto', 'Converge rápido, argumenta con evidencia y condiciones', 'Skip a evaluación de hito, Bloom L4-L6'],
          ['0.3 – 0.6', 'Competente', 'Converge en tiempo medio, argumenta con ejemplos', 'Flujo normal, empujar hacia argumentación evidencial'],
          ['0.6 – 0.8', 'En desarrollo', 'Converge lento, misconcepciones frecuentes', 'Más scaffolding, sugerir prerequisitos'],
          ['0.8 – 1.0', 'Brecha significativa', 'No converge, misconcepciones persistentes', 'Material preparatorio, ajustar plan adaptativo'],
        ]
      ),

      // ====== 7. HERRAMIENTAS DEL APRENDIZ ======
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      heading('7. Herramientas del aprendiz'),

      heading('7.1 Inventario de conceptos con recuerdo espaciado', HeadingLevel.HEADING_2),
      para('Cada concepto dominado se agrega a un inventario personal con la definición del autor (cita verbatim), la nota personal del aprendiz, el nivel SOLO alcanzado y la fecha del último repaso. El algoritmo FSRS calcula el intervalo óptimo de repaso. A diferencia de Anki, el repaso no es autoreporte subjetivo ("¿te acordaste?") sino un **mini-diálogo socrático de 2-3 turnos** que verifica si la comprensión persiste.'),

      heading('7.2 Notas personales', HeadingLevel.HEADING_2),
      para('Notas libres vinculadas a unidades, pasajes del texto y misconcepciones. Las notas con etiqueta #cambio_conceptual documentan cuándo y por qué el aprendiz cambió de opinión — evidencia directa de aprendizaje significativo (Ausubel). El sistema detecta patrones: "Has escrito 3 notas que conectan economía con tu experiencia profesional — podrías usarlo como ejemplo contextualizado."'),

      heading('7.3 Mini-test diagnóstico', HeadingLevel.HEADING_2),
      para('Tres momentos: diagnóstico (al inicio, calibra IBC), checkpoint (a mitad, verifica retención), simulacro (antes del deadline, simula condiciones reales). Separación de roles obligatoria: el generador de preguntas NO es el evaluador (IV&V). 5 tipos de preguntas: reconocimiento, comprensión, aplicación, conexión, confrontación. El resultado actualiza el IBC y reprograma repasos en el FSRS.'),

      // ====== 8. VALIDACIÓN ======
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      heading('8. Validación empírica'),

      para('El MVP-1 de Socrates fue validado por el investigador en un curso real de Tópicos de Economía (25 unidades de sentido, 50 páginas de material) durante abril de 2026. El pipeline completo (A1→A2→A10→A3→A7→A4) procesó el material y produjo sesiones socrátias funcionales con diálogo adaptativo, voz natural (OpenAI TTS) y dictado por voz (Whisper).'),

      para('La auditoría YUNQUE de Nivel 2 (agente independiente aplicando la regla IV&V del IEEE 1012) evaluó las 15 dimensiones de calidad del estándar de desarrollo: **PASS en 15/15 dimensiones, 0 FAILs**. Las fortalezas principales identificadas fueron: seguridad de datos excepcional (RLS + defense-in-depth en todas las tablas), modelo de datos robusto (5 migraciones con state machines y CHECK constraints), y tests adversariales para código de enforcement.'),

      para('El feedback cualitativo del primer usuario (el propio investigador): *"funciona muy bien, es muy entretenido estudiar así"* — validación inicial de que los principios pedagógicos producen una experiencia de aprendizaje cualitativamente distinta a la lectura pasiva o al chatbot sin estructura.'),

      // ====== 9. REFERENCIAS ======
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      heading('9. Referencias'),

      para('Ausubel, D.P. (1963). *The psychology of meaningful verbal learning*. Grune & Stratton.'),
      para('Ausubel, D.P. (1968). *Educational psychology: A cognitive view*. Holt, Rinehart and Winston.'),
      para('Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025). Generative AI can harm learning. *Proceedings of the National Academy of Sciences*.'),
      para('Biggs, J.B. & Collis, K.F. (1982). *Evaluating the quality of learning: The SOLO taxonomy*. Academic Press.'),
      para('Chase, C.C., Chin, D.B., Oppezzo, M.A., & Schwartz, D.L. (2009). Teachable agents and the protégé effect. *Science Education*, 93(4), 674-696.'),
      para('Collins, A., Brown, J.S., & Newman, S.E. (1989). Cognitive apprenticeship: Teaching the crafts of reading, writing, and mathematics. In L.B. Resnick (Ed.), *Knowing, learning, and instruction* (pp. 453-494).'),
      para('Corbett, A.T. & Anderson, J.R. (1995). Knowledge tracing: Modeling the acquisition of procedural knowledge. *User Modeling and User-Adapted Interaction*, 4, 253-278.'),
      para('Falmagne, J.-C. & Doignon, J.-P. (1985). Spaces for the assessment of knowledge. *International Journal of Man-Machine Studies*, 23, 175-196.'),
      para('Fiorella, L. & Mayer, R.E. (2016). Eight ways to promote generative learning. *Educational Psychology Review*, 28(4), 717-741.'),
      para('Graesser, A.C., Hu, X., Nye, B.D., & Sottilare, R.A. (2014). Intelligent tutoring systems, serious games, and the Generalized Intelligent Framework for Tutoring (GIFT). In *Design Recommendations for Intelligent Tutoring Systems*.'),
      para('Kapur, M. (2024). *Productive failure: Unlocking deeper learning through the science of failing*. Corwin.'),
      para('Shaffer, D.W. (2017). *Quantitative ethnography*. Cathcart Press.'),
      para('Sinha, T. & Kapur, M. (2021). When problem solving followed by instruction works: Evidence for productive failure. *Review of Educational Research*, 91(5), 823-861.'),
      para('Toulmin, S. (1958). *The uses of argument*. Cambridge University Press.'),
      para('Vygotsky, L.S. (1978). *Mind in society: The development of higher psychological processes*. Harvard University Press.'),
      para('Wittrock, M.C. (1974). Learning as a generative process. *Educational Psychologist*, 11(2), 87-95.'),
      para('Zimmerman, B.J. (2000). Attaining self-regulation: A social cognitive perspective. In M. Boekaerts et al. (Eds.), *Handbook of self-regulation* (pp. 13-39).'),

    ],
  }],
})

// ============================================================
// Generate
// ============================================================
const buffer = await Packer.toBuffer(doc)
const outPath = 'C:/dev/socrates/Socrates_Fundamentacion_Metodologica.docx'
writeFileSync(outPath, buffer)
console.log('Documento generado:', outPath, `(${(buffer.length / 1024).toFixed(0)} KB)`)
