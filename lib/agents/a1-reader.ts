/**
 * A1 — Lector (extraccion de texto de PDFs)
 *
 * Usa pdf2json para extraer texto localmente (sin API, sin costo, sin rate limit).
 * Produce texto completo + page count. El TOC se extrae opcionalmente con un
 * LLM barato si es necesario.
 *
 * Cambio 2026-04-13: eliminada dependencia de LLM para extraccion de texto.
 * Los LLMs resumen en vez de transcribir, lo que rompe el pipeline.
 * pdf2json opera localmente y extrae todo el texto fielmente.
 */

const PDFParser = require('pdf2json')

interface A1Result {
  fullText: string
  toc: { title: string; page: number }[]
  pageCount: number
  inputTokens: number
  outputTokens: number
}

export async function runA1(pdfBuffer: Buffer, _filename: string): Promise<A1Result> {
  const { fullText, pageCount } = await extractTextFromPdf(pdfBuffer)

  // TOC: heuristica simple — lineas cortas que parecen titulos (ALL CAPS o con numeros)
  const lines = fullText.split('\n')
  const toc: { title: string; page: number }[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      trimmed.length > 5 &&
      trimmed.length < 100 &&
      (trimmed === trimmed.toUpperCase() || /^\d+[\.\)]\s/.test(trimmed) || /^(Unidad|Capítulo|Lección|Tema|Sección)/i.test(trimmed))
    ) {
      toc.push({ title: trimmed, page: 0 })
    }
  }

  return {
    fullText,
    toc: toc.slice(0, 20), // Max 20 secciones
    pageCount,
    inputTokens: 0, // Local, sin API
    outputTokens: 0,
  }
}

function extractTextFromPdf(buffer: Buffer): Promise<{ fullText: string; pageCount: number }> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, true) // true = raw text mode

    parser.on('pdfParser_dataReady', (data: {
      Pages: Array<{
        Texts: Array<{
          R: Array<{ T: string }>
        }>
      }>
    }) => {
      const pages = data.Pages
      const fullText = pages
        .map((page) =>
          page.Texts.map((textItem) =>
            textItem.R.map((r) => decodeURIComponent(r.T)).join('')
          ).join(' ')
        )
        .join('\n\n')

      resolve({ fullText, pageCount: pages.length })
    })

    parser.on('pdfParser_dataError', (err: Error) => {
      reject(new Error(`PDF parse error: ${err.message ?? err}`))
    })

    parser.parseBuffer(buffer)
  })
}
