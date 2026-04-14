/**
 * Test end-to-end del pipeline de ingestion.
 * Ejecutar: node scripts/test-pipeline.mjs
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Cargar env
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
for (const line of envFile.split('\n')) {
  if (line.startsWith('#') || !line.includes('=')) continue
  const eq = line.indexOf('=')
  env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const COURSE_ID = '2e44517d-6c56-4aa5-9bec-bf753e261c80'
const PDF_PATH = '514c3183-95aa-4545-9ac6-a8e9f898d782/2e44517d-6c56-4aa5-9bec-bf753e261c80/3cd564b9-37a6-4f2a-a3db-dab7db04a04a.pdf'
const PDF_ID = '3cd564b9-37a6-4f2a-a3db-dab7db04a04a'

async function step(name, fn) {
  console.log(`\n=== ${name} ===`)
  const start = Date.now()
  try {
    const result = await fn()
    console.log(`✓ ${name} OK (${((Date.now() - start) / 1000).toFixed(1)}s)`)
    return result
  } catch (error) {
    console.error(`✗ ${name} FAIL (${((Date.now() - start) / 1000).toFixed(1)}s)`)
    console.error('  Error:', error.message || error)
    if (error.status) console.error('  Status:', error.status)
    if (error.error) console.error('  Details:', JSON.stringify(error.error).slice(0, 300))
    throw error
  }
}

// === MAIN ===
try {
  // 1. Descargar PDF
  const pdfBuffer = await step('Descargar PDF', async () => {
    const { data, error } = await supabase.storage.from('pdfs').download(PDF_PATH)
    if (error) throw error
    const buf = Buffer.from(await data.arrayBuffer())
    console.log('  Tamaño:', buf.length, 'bytes')
    return buf
  })

  // 2. A1 - Extraer texto
  const fullText = await step('A1 - Extraer texto', async () => {
    const pdfBase64 = pdfBuffer.toString('base64')
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
          { type: 'text', text: 'Transcribe el contenido textual completo de este PDF academico. Copia cada parrafo separado por una linea en blanco. No resumas. No omitas. No agregues comentarios.' },
        ],
      }],
    })
    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    console.log('  Texto extraido:', text.length, 'caracteres')
    console.log('  Tokens:', response.usage.input_tokens, 'in /', response.usage.output_tokens, 'out')
    console.log('  Preview:', text.slice(0, 200).replace(/\n/g, ' '))
    return text
  })

  // 3. A2 - Analizar unidades de sentido (solo primeros 3000 chars para test rapido)
  const units = await step('A2 - Analizar unidades', async () => {
    const textSlice = fullText.slice(0, 6000)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', // Usamos Sonnet para test (mas barato que Opus)
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `Analiza este texto academico y descomponlo en unidades de sentido. Produce JSON:
{"units": [{"name": "nombre corto", "description": "que proposicion captura", "source_spans": [{"start_paragraph": 0, "end_paragraph": 1, "text_excerpt": "primeras 30 palabras..."}], "prerequisites": [], "glossary_weight": "critical|important|complementary"}], "paragraphs": [{"index": 0, "text": "primeras 50 palabras...", "is_substantive": true}]}

Texto:
${textSlice}`,
      }],
    })
    const content = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    console.log('  Tokens:', response.usage.input_tokens, 'in /', response.usage.output_tokens, 'out')

    // Parse JSON robusto
    let jsonStr = content.trim()
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match?.[1]) jsonStr = match[1].trim()
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()
    if (!jsonStr.startsWith('{')) {
      const i = jsonStr.indexOf('{')
      if (i >= 0) jsonStr = jsonStr.slice(i)
    }
    const lastBrace = jsonStr.lastIndexOf('}')
    if (lastBrace >= 0) jsonStr = jsonStr.slice(0, lastBrace + 1)

    const parsed = JSON.parse(jsonStr)
    console.log('  Unidades encontradas:', parsed.units?.length ?? 0)
    console.log('  Parrafos:', parsed.paragraphs?.length ?? 0)
    for (const u of (parsed.units ?? []).slice(0, 3)) {
      console.log(`    - ${u.name} [${u.glossary_weight}]`)
    }
    return parsed.units ?? []
  })

  console.log('\n========================================')
  console.log('PIPELINE TEST: PASS')
  console.log(`Texto: ${fullText.length} chars`)
  console.log(`Unidades: ${units.length}`)
  console.log('========================================')

} catch (error) {
  console.log('\n========================================')
  console.log('PIPELINE TEST: FAIL')
  console.log('Detenido en el paso que fallo.')
  console.log('========================================')
  process.exit(1)
}
