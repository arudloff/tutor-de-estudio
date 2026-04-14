/**
 * Script de test directo del A1 contra el PDF real.
 * Ejecutar: node scripts/test-a1.mjs
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

console.log('=== Test A1 directo ===')
console.log('Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30))

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Descargar PDF
const pdfPath = '514c3183-95aa-4545-9ac6-a8e9f898d782/2e44517d-6c56-4aa5-9bec-bf753e261c80/3cd564b9-37a6-4f2a-a3db-dab7db04a04a.pdf'
console.log('Descargando PDF...')
const { data: fileData, error: dlError } = await supabase.storage.from('pdfs').download(pdfPath)

if (dlError) {
  console.error('Download error:', dlError)
  process.exit(1)
}

const pdfBuffer = Buffer.from(await fileData.arrayBuffer())
console.log('PDF descargado:', pdfBuffer.length, 'bytes')

// Test con Anthropic - solo extraer primeras paginas como texto plano
const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
const pdfBase64 = pdfBuffer.toString('base64')

console.log('Base64 length:', pdfBase64.length)
console.log('Llamando a Claude Sonnet para extraer texto...')

try {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: 'Extrae los primeros 5 parrafos del texto de este PDF. Solo texto plano, sin formato, sin comentarios.',
          },
        ],
      },
    ],
  })

  console.log('\n=== RESPUESTA ===')
  console.log('Stop reason:', response.stop_reason)
  console.log('Input tokens:', response.usage.input_tokens)
  console.log('Output tokens:', response.usage.output_tokens)
  const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
  console.log('Texto (primeros 500 chars):')
  console.log(text.slice(0, 500))
  console.log('\n=== TEST PASS ===')
} catch (error) {
  console.error('\n=== TEST FAIL ===')
  console.error('Error:', error.message || error)
  if (error.status) console.error('Status:', error.status)
  if (error.error) console.error('Details:', JSON.stringify(error.error))
}
