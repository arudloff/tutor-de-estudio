#!/usr/bin/env node
/**
 * Genera: Resumen de Valor de Socrates (.docx)
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

const FONT = 'Calibri'
const SZ = 22

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 160 } })
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } })
}
function p(text) {
  const runs = []
  text.split(/(\*\*[^*]+\*\*)/g).forEach(part => {
    if (part.startsWith('**') && part.endsWith('**'))
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: FONT, size: SZ }))
    else
      runs.push(new TextRun({ text: part, font: FONT, size: SZ }))
  })
  return new Paragraph({ children: runs, spacing: { after: 120 }, alignment: AlignmentType.JUSTIFIED })
}
function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SZ })],
    bullet: { level: 0 }, spacing: { after: 60 },
  })
}
function quote(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 24, italics: true, color: '0f766e' })],
    spacing: { before: 200, after: 200 },
    alignment: AlignmentType.CENTER,
    indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) },
  })
}
function row(cells, bold = false) {
  return new TableRow({
    children: cells.map(t => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: t, font: FONT, size: 20, bold })], spacing: { after: 40 } })],
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
    })),
  })
}
function table(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [row(headers, true), ...rows.map(r => row(r))],
  })
}

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } },
    },
    children: [

      // PORTADA
      new Paragraph({ spacing: { before: 1500 } }),
      new Paragraph({
        children: [new TextRun({ text: 'SOCRATES', font: FONT, size: 52, bold: true, color: '1e293b' })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Propuesta de valor y fundamentos', font: FONT, size: 32, color: '0f766e' })],
        alignment: AlignmentType.CENTER, spacing: { after: 300 },
      }),
      quote('"Aprende con diálogo, no con resúmenes."'),
      new Paragraph({
        children: [new TextRun({ text: 'Alejandro Rudloff Muñoz — Doctorado en Management, Universidad de Talca', font: FONT, size: 20 })],
        alignment: AlignmentType.CENTER, spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Abril 2026', font: FONT, size: 20 })],
        alignment: AlignmentType.CENTER,
      }),

      // ========================================
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      h1('¿Qué es Socrates?'),

      p('Socrates es un tutor doctoral basado en inteligencia artificial que acelera el aprendizaje profundo sin generar deuda cognitiva. Recibe los textos académicos del aprendiz, los descompone en unidades de sentido, y conduce sesiones de aprendizaje donde cada concepto se construye mediante diálogo socrático — no mediante resúmenes ni respuestas entregadas.'),

      p('A diferencia de un chatbot que responde preguntas, Socrates **hace mejores preguntas**. A diferencia de un sistema de flashcards que optimiza reconocimiento, Socrates optimiza **comprensión transferible** — la que persiste cuando la herramienta no está disponible.'),

      // ========================================
      h1('¿Qué problema resuelve?'),

      p('El experimento de Bastani et al. (2025, PNAS) demostró que el mismo modelo de IA puede producir +127% de aprendizaje o -17% de daño cognitivo, dependiendo únicamente del marco pedagógico que lo gobierna. Sin guardrails pedagógicos, los estudiantes aprenden más rápido PERO retienen menos que el grupo control después de usar la herramienta.'),

      quote('"La tecnología no es la variable. La instrucción es la variable."'),

      p('Socrates es la respuesta a esta paradoja: un sistema donde cada decisión de diseño está respaldada por evidencia empírica de las ciencias del aprendizaje, y donde la calidad pedagógica se audita mecánicamente en cada paso.'),

      // ========================================
      h1('6 ideas fuerza'),

      h2('1. La IA que enseña preguntando'),
      p('No genera resúmenes ni respuestas. Te presenta un desafío antes de cualquier explicación (fallo productivo). Después dialoga contigo hasta que demuestres comprensión real, verificada contra una rúbrica de expectativas y un catálogo de misconcepciones. El cierre no es "¿entendiste?" sino evidencia trazable de dominio.'),

      h2('2. Calibrado a tu objetivo'),
      p('Antes de abrir un solo PDF, el agente A12 te entrevista para capturar tu Perfil de Objetivo del Aprendiz (POA): quién eres, para qué necesitas este aprendizaje, qué ya sabes. Cada problema, cada rúbrica, cada tarea generativa se calibra a tu contexto real. Fundamento: las 3 condiciones del aprendizaje significativo de Ausubel (1963).'),

      h2('3. Tu texto, tu diálogo'),
      p('Socrates no te entrega una versión resumida de tu material. A través de la Lectura Socrática (D20), el tutor introduce pasajes del texto del autor directamente en el diálogo — primero una oración, luego el párrafo, luego el argumento completo. El texto del autor se convierte en un tercer participante que confirma, desafía o matiza tus respuestas.'),

      h2('4. Comprensión que persiste sin la herramienta'),
      p('El criterio de éxito de Socrates no es "cuánto aprendiste mientras usabas la app" sino "cuánto retienes cuando no la tienes". Cada principio pedagógico (fallo productivo, diálogo socrático, producción generativa) está diseñado para construir comprensión transferible, no dependencia. Mini-tests verifican retención real.'),

      h2('5. Ves cómo piensas, no solo qué sabes'),
      p('El dashboard de metacognición integra 6 constructos pedagógicos: taxonomía SOLO (profundidad de comprensión), modelo de Toulmin (calidad argumentativa), Knowledge Tracing bayesiano (dominio probabilístico), Zona de Desarrollo Próximo (calibración de dificultad), Análisis Epistémico de Red (conexiones entre conceptos), y Aprendizaje Autorregulado (reflexión metacognitiva). Te muestra no solo tu progreso sino **cómo piensas** y cómo mejorar.'),

      h2('6. Respaldado por ciencia, no por marketing'),
      p('Cada decisión de diseño tiene referencia a evidencia empírica publicada. 6 principios pedagógicos derivados de meta-análisis y RCTs. 12 agentes de IA con responsabilidades separadas y verificables. Auditoría YUNQUE de 15 dimensiones de calidad. El sistema no afirma que funciona — lo demuestra con trazabilidad.'),

      // ========================================
      new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
      h1('¿Cómo funciona?'),

      p('El flujo de una sesión de aprendizaje en Socrates:'),

      bullet('1. Desafío: Socrates te presenta un problema que el concepto explica, sin darte la respuesta.'),
      bullet('2. Tu intento: escribes o dictas tu mejor respuesta con lo que ya sabes.'),
      bullet('3. Instrucción: ahora recibes la explicación del autor, condensada y calibrada a tu objetivo.'),
      bullet('4. Diálogo socrático: Socrates te hace preguntas abiertas que verifican si realmente entiendes.'),
      bullet('5. Lectura del texto: Socrates introduce pasajes del autor para profundizar y confrontar.'),
      bullet('6. Producción: cierras con una tarea generativa donde usas el concepto con tus propias palabras y citando al autor.'),
      bullet('7. Reflexión: ¿qué te sorprendió? ¿cambió algo de lo que pensabas?'),

      p('Todo con voz natural — puedes hablar con Socrates como en una llamada telefónica con tu tutor.'),

      // ========================================
      h1('¿Para quién es?'),

      bullet('Doctorandos que deben comprender cuerpos de literatura académica antes de una fecha límite.'),
      bullet('Estudiantes de máster y posgrado que preparan seminarios, exámenes o defensas.'),
      bullet('Profesionales que estudian mientras trabajan y necesitan maximizar cada minuto.'),
      bullet('Investigadores que procesan literatura fuera de su campo principal.'),

      // ========================================
      h1('Arquitectura y tecnología'),

      p('12 agentes de IA especializados, cada uno con responsabilidad delimitada:'),

      table(
        ['Agente', 'Función'],
        [
          ['A1 Lector', 'Extrae texto del PDF (local, sin API)'],
          ['A2 Analista', 'Descompone en unidades de sentido + grafo de prerequisitos'],
          ['A3 Diseñador', 'Genera fallo productivo + rúbrica + catálogo (calibrado al POA)'],
          ['A4 Evaluador', 'Conduce diálogo socrático + clasifica SOLO/Toulmin'],
          ['A7 Auditor', 'Verifica fidelidad de citas al 99%+'],
          ['A10 Verificador', 'Garantiza cobertura 100% del texto (adversarial)'],
          ['A12 Entrevistador', 'Captura el POA del aprendiz (Ausubel)'],
        ]
      ),

      new Paragraph({ spacing: { after: 120 } }),

      p('**Stack tecnológico:** Next.js 14 + TypeScript strict + Supabase (Postgres con RLS) + Claude Opus/Sonnet + OpenAI TTS/Whisper. Deploy en Vercel. Auditoría YUNQUE de 15 dimensiones con tests adversariales.'),

      // ========================================
      h1('Fundamento científico'),

      table(
        ['Constructo', 'Autor', 'Qué aporta a Socrates'],
        [
          ['Fallo productivo', 'Kapur (2024)', 'La lucha cognitiva antes de la instrucción produce comprensión más profunda'],
          ['Diálogo socrático', 'Graesser (AutoTutor)', 'Tamaño de efecto d=0.81 en comprensión vs instrucción pasiva'],
          ['Aprendizaje significativo', 'Ausubel (1963)', 'Las 3 condiciones que operacionaliza el POA'],
          ['SOLO Taxonomy', 'Biggs (1982)', 'Profundidad observable de comprensión en 5 niveles'],
          ['Modelo de Toulmin', 'Toulmin (1958)', 'Estructura de argumentación en 6 componentes'],
          ['ZDP', 'Vygotsky (1978)', 'Calibración de dificultad al nivel del aprendiz'],
          ['Knowledge Tracing', 'Corbett & Anderson (1995)', 'Dominio probabilístico que decae con el tiempo'],
          ['Aprendizaje generativo', 'Fiorella & Mayer (2016)', 'Producir es aprender más que recibir'],
        ]
      ),

      // ========================================
      new Paragraph({ spacing: { before: 400 } }),
      quote('"No es un chatbot con prompt pedagógico. Es un sistema multi-agente donde cada decisión de diseño tiene referencia a evidencia empírica publicada."'),

    ],
  }],
})

const buffer = await Packer.toBuffer(doc)
const outPath = 'C:/dev/socrates/Socrates_Resumen_Valor.docx'
writeFileSync(outPath, buffer)
console.log('Generado:', outPath, `(${(buffer.length / 1024).toFixed(0)} KB)`)
