/**
 * Pipeline de ingestion: A1 → A2 → A10 → A3 → A7
 *
 * Orquesta la secuencia completa de procesamiento de un PDF:
 * 1. A1 extrae texto
 * 2. A2 descompone en unidades de sentido
 * 3. A10 verifica cobertura 100% (loop max 3 iter)
 * 4. A3 disena pedagogia con POA en contexto (D19)
 * 5. A7 audita fidelidad de citas y misconcepciones
 *
 * En MVP-1 este pipeline corre como job sincrono en un API route.
 * En sprints futuros se migrara a Trigger.dev/Inngest para jobs largos.
 */

import { runA1 } from '@/lib/agents/a1-reader'
import { runA2, type SenseUnit, type A2Result } from '@/lib/agents/a2-analyst'
import { runA10, type CoverageResult } from '@/lib/agents/a10-coverage'
import { runA3 } from '@/lib/agents/a3-designer'
import { runA7 } from '@/lib/agents/a7-auditor'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/types'

const MAX_COVERAGE_ITERATIONS = 3

export interface IngestProgress {
  step: 'a1' | 'a2' | 'a10' | 'a2_retry' | 'a3' | 'a7' | 'done' | 'fail_review'
  iteration: number
  coveragePct?: number
  message: string
}

type AdminClient = SupabaseClient<Database>

interface PoaContext {
  learner_role: string | null
  discipline: string | null
  research_field: string | null
  target_challenge: string | null
  target_capability: string | null
  success_signal: string | null
  known_authors: string[] | null
  theoretical_traditions: string[] | null
}

export async function runIngestionPipeline(
  admin: AdminClient,
  courseId: string,
  pdfId: string,
  pdfBase64: string,
  pdfFilename: string,
  jobId: string,
  poa: PoaContext,
  onProgress?: (p: IngestProgress) => void
): Promise<{ success: boolean; unitCount: number }> {
  const report = (p: IngestProgress) => onProgress?.(p)

  // --- Paso 1: A1 extrae texto ---
  report({ step: 'a1', iteration: 0, message: 'Extrayendo texto del PDF...' })

  await admin.from('ingestion_job').update({ current_step: 'a1', progress_pct: 10 }).eq('id', jobId)

  const a1Result = await runA1(pdfBase64, pdfFilename)

  await admin
    .from('pdf')
    .update({
      full_text: a1Result.fullText,
      toc: a1Result.toc as unknown as Database['public']['Tables']['pdf']['Update']['toc'],
      length_pp: a1Result.pageCount,
      state: 'text_extracted',
    })
    .eq('id', pdfId)

  await admin.from('ingestion_job').update({ progress_pct: 25 }).eq('id', jobId)

  // --- Paso 2: A2 → A10 loop ---
  let iteration = 0
  let a2Result: A2Result | null = null
  let coverageResult: CoverageResult | null = null
  let orphanFeedback: string | undefined

  while (iteration < MAX_COVERAGE_ITERATIONS) {
    iteration++

    // A2
    const stepLabel = iteration === 1 ? 'a2' : 'a2_retry'
    report({ step: stepLabel, iteration, message: `Analizando contenido (iteracion ${iteration})...` })
    await admin.from('ingestion_job').update({ current_step: stepLabel, progress_pct: 25 + iteration * 15 }).eq('id', jobId)

    a2Result = await runA2(a1Result.fullText, pdfFilename, orphanFeedback)

    await admin.from('pdf').update({ state: 'analyzed' }).eq('id', pdfId)

    // A10
    report({ step: 'a10', iteration, message: 'Verificando cobertura...' })
    await admin.from('ingestion_job').update({ current_step: 'a10', progress_pct: 25 + iteration * 15 + 10 }).eq('id', jobId)

    coverageResult = await runA10(a2Result.paragraphs, a2Result.units)

    // Persistir coverage report
    await admin.from('coverage_report').insert({
      pdf_id: pdfId,
      iter: iteration,
      coverage_pct: coverageResult.coveragePct,
      orphan_count: coverageResult.orphanCount,
      orphan_paragraphs: coverageResult.orphanParagraphs as unknown as Database['public']['Tables']['coverage_report']['Insert']['orphan_paragraphs'],
      non_coverable: coverageResult.nonCoverable as unknown as Database['public']['Tables']['coverage_report']['Insert']['non_coverable'],
      pass: coverageResult.pass,
    })

    if (coverageResult.pass) {
      await admin.from('pdf').update({ state: 'coverage_ok', ingestion_iter: iteration }).eq('id', pdfId)
      report({ step: 'a10', iteration, coveragePct: coverageResult.coveragePct, message: 'Cobertura 100% verificada.' })
      break
    }

    // Preparar feedback de huerfanos para la proxima iteracion del A2
    orphanFeedback = coverageResult.orphanParagraphs
      .map((o) => `Parrafo ${o.index}: "${o.text}" — Razon: ${o.reason}`)
      .join('\n')

    report({
      step: 'a10',
      iteration,
      coveragePct: coverageResult.coveragePct,
      message: `Cobertura ${coverageResult.coveragePct}% — ${coverageResult.orphanCount} parrafos huerfanos. Reintentando...`,
    })
  }

  // Despues del loop
  if (!coverageResult?.pass) {
    // FAIL_REVIEW despues de 3 iteraciones
    await admin.from('pdf').update({ state: 'fail_review', ingestion_iter: iteration }).eq('id', pdfId)
    await admin.from('ingestion_job').update({ state: 'fail_review', current_step: 'fail_review', progress_pct: 100 }).eq('id', jobId)
    await admin.from('course').update({ state: 'fail_review' }).eq('id', courseId)

    report({ step: 'fail_review', iteration, message: 'Cobertura insuficiente despues de 3 iteraciones. Revision manual requerida.' })
    return { success: false, unitCount: a2Result?.units.length ?? 0 }
  }

  // --- Paso 3: Persistir unidades de sentido ---
  if (a2Result) {
    for (const unit of a2Result.units) {
      await admin.from('sense_unit').insert({
        course_id: courseId,
        pdf_id: pdfId,
        name: unit.name,
        description: unit.description,
        source_spans: unit.source_spans as unknown as Database['public']['Tables']['sense_unit']['Insert']['source_spans'],
        unit_type: 'mono_source',
        state: 'analyzed',
      })
    }

    // Persistir prerequisite edges
    const unitNames = new Map<string, string>() // name → id (necesitamos IDs)
    const { data: insertedUnits } = await admin
      .from('sense_unit')
      .select('id, name')
      .eq('pdf_id', pdfId)

    if (insertedUnits) {
      for (const u of insertedUnits) {
        unitNames.set(u.name, u.id)
      }

      for (const unit of a2Result.units) {
        const toId = unitNames.get(unit.name)
        if (!toId) continue
        for (const prereqName of unit.prerequisites) {
          const fromId = unitNames.get(prereqName)
          if (fromId && fromId !== toId) {
            await admin.from('prerequisite_edge').insert({
              from_unit: fromId,
              to_unit: toId,
            }).then(() => {}) // ignore duplicate key errors
          }
        }
      }
    }
  }

  // --- Paso 4: A3 disena pedagogia con POA + A7 audita (HU-7) ---
  if (a2Result) {
    report({ step: 'a3', iteration: 0, message: 'Disenando lecciones calibradas al POA...' })
    await admin.from('ingestion_job').update({ current_step: 'a3', progress_pct: 80 }).eq('id', jobId)

    const { data: persistedUnits } = await admin
      .from('sense_unit')
      .select('id, name, description, source_spans')
      .eq('pdf_id', pdfId)

    for (const unit of persistedUnits ?? []) {
      // Extraer texto fuente de los spans
      const sourceText = a1Result.fullText.slice(0, 3000) // simplified for MVP-1

      const a3Result = await runA3(
        { name: unit.name, description: unit.description, sourceText },
        poa
      )

      // Persistir los 5 artefactos del A3
      await admin.from('productive_failure_problem').insert({
        unit_id: unit.id,
        content: a3Result.productiveFailureProblem,
      })
      await admin.from('canonical_instruction').insert({
        unit_id: unit.id,
        content: a3Result.canonicalInstruction,
        cited_spans: a3Result.citedSpans as unknown as Database['public']['Tables']['canonical_instruction']['Insert']['cited_spans'],
      })
      await admin.from('rubric').insert({
        unit_id: unit.id,
        items: a3Result.rubricItems as unknown as Database['public']['Tables']['rubric']['Insert']['items'],
      })
      await admin.from('misconception_catalog').insert({
        unit_id: unit.id,
        items: a3Result.misconceptions as unknown as Database['public']['Tables']['misconception_catalog']['Insert']['items'],
      })
      await admin.from('generative_task').insert({
        unit_id: unit.id,
        tier: a3Result.generativeTask.tier,
        format: a3Result.generativeTask.format,
        prompt: a3Result.generativeTask.prompt,
        max_words: a3Result.generativeTask.maxWords,
      })

      // A7 audita fidelidad de citas
      report({ step: 'a7', iteration: 0, message: `Auditando fidelidad: ${unit.name}...` })
      await admin.from('ingestion_job').update({ current_step: 'a7', progress_pct: 90 }).eq('id', jobId)

      const a7Result = await runA7({
        unitName: unit.name,
        canonicalInstruction: a3Result.canonicalInstruction,
        citedSpans: a3Result.citedSpans,
        misconceptions: a3Result.misconceptions,
        sourceText,
      })

      await admin.from('audit_report').insert({
        unit_id: unit.id,
        agent: 'a7',
        cite_results: a7Result.citeResults as unknown as Database['public']['Tables']['audit_report']['Insert']['cite_results'],
        pass: a7Result.pass,
      })

      // Actualizar estado de la unidad
      await admin
        .from('sense_unit')
        .update({ state: a7Result.pass ? 'available' : 'audited_fail' })
        .eq('id', unit.id)
    }
  }

  // Marcar PDF como ready y job como completed
  await admin.from('pdf').update({ state: 'ready' }).eq('id', pdfId)
  await admin.from('ingestion_job').update({
    state: 'completed',
    current_step: 'done',
    progress_pct: 100,
    completed_at: new Date().toISOString(),
  }).eq('id', jobId)

  report({ step: 'done', iteration, message: `Ingestion completa. ${a2Result?.units.length ?? 0} unidades de sentido creadas.` })

  return { success: true, unitCount: a2Result?.units.length ?? 0 }
}
