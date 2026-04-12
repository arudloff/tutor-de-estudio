-- ============================================================================
-- Socrates — Migracion 0003: tablas de ingestion (PDF, sense_unit, coverage)
-- Fecha: 2026-04-12
-- Sprint: S3
-- Decisiones: D13 (multi-PDF first-class), D14 (roles de PDFs)
-- ============================================================================

-- ============================================================================
-- Tabla: pdf
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pdf (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES public.course(id) ON DELETE CASCADE,
  filename        TEXT NOT NULL,
  size_bytes      BIGINT NOT NULL,
  mime_type       TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path    TEXT NOT NULL UNIQUE,
  role            TEXT NOT NULL DEFAULT 'principal',
  state           TEXT NOT NULL DEFAULT 'uploaded',
  full_text       TEXT,
  toc             JSONB,
  length_pp       INT,
  ingestion_iter  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pdf_size_limit CHECK (size_bytes > 0 AND size_bytes <= 52428800),
  CONSTRAINT pdf_mime CHECK (mime_type = 'application/pdf'),
  CONSTRAINT pdf_role_valid CHECK (role IN ('principal','equivalente','complementario','referencial','contrapunto')),
  CONSTRAINT pdf_state_valid CHECK (state IN (
    'uploaded','structure_known','role_assigned','ready_to_ingest',
    'text_extracted','analyzed','coverage_ok','coverage_fail',
    'ready','fail_review'
  )),
  CONSTRAINT pdf_iter_limit CHECK (ingestion_iter <= 3)
);

CREATE INDEX IF NOT EXISTS idx_pdf_course_id ON public.pdf(course_id);
CREATE INDEX IF NOT EXISTS idx_pdf_state ON public.pdf(state);

DROP TRIGGER IF EXISTS pdf_set_updated_at ON public.pdf;
CREATE TRIGGER pdf_set_updated_at
  BEFORE UPDATE ON public.pdf
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pdf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pdf_select_own" ON public.pdf FOR SELECT TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "pdf_insert_own" ON public.pdf FOR INSERT TO authenticated
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "pdf_update_own" ON public.pdf FOR UPDATE TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "pdf_delete_own" ON public.pdf FOR DELETE TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

-- ============================================================================
-- Tabla: sense_unit
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sense_unit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES public.course(id) ON DELETE CASCADE,
  pdf_id          UUID NOT NULL REFERENCES public.pdf(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  unit_type       TEXT NOT NULL DEFAULT 'mono_source',
  source_spans    JSONB NOT NULL,
  state           TEXT NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unit_type_valid CHECK (unit_type IN ('mono_source','multi_source_convergent','multi_source_tension','integration')),
  CONSTRAINT unit_state_valid CHECK (state IN ('draft','analyzed','designed','audited_ok','audited_fail','available','in_session','mastered','needs_review')),
  CONSTRAINT unit_spans_nonempty CHECK (jsonb_array_length(source_spans) > 0)
);

CREATE INDEX IF NOT EXISTS idx_unit_course_id ON public.sense_unit(course_id);
CREATE INDEX IF NOT EXISTS idx_unit_pdf_id ON public.sense_unit(pdf_id);
CREATE INDEX IF NOT EXISTS idx_unit_state ON public.sense_unit(state);

DROP TRIGGER IF EXISTS unit_set_updated_at ON public.sense_unit;
CREATE TRIGGER unit_set_updated_at
  BEFORE UPDATE ON public.sense_unit
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sense_unit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_select_own" ON public.sense_unit FOR SELECT TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "unit_insert_own" ON public.sense_unit FOR INSERT TO authenticated
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "unit_update_own" ON public.sense_unit FOR UPDATE TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

-- ============================================================================
-- Tabla: prerequisite_edge (grafo de prerequisitos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prerequisite_edge (
  from_unit UUID NOT NULL REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  to_unit   UUID NOT NULL REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  PRIMARY KEY (from_unit, to_unit),
  CONSTRAINT no_self_loop CHECK (from_unit <> to_unit)
);

ALTER TABLE public.prerequisite_edge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edge_select_own" ON public.prerequisite_edge FOR SELECT TO authenticated
  USING (from_unit IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "edge_insert_own" ON public.prerequisite_edge FOR INSERT TO authenticated
  WITH CHECK (from_unit IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

-- ============================================================================
-- Tabla: coverage_report (A10)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coverage_report (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id            UUID NOT NULL REFERENCES public.pdf(id) ON DELETE CASCADE,
  iter              INT NOT NULL DEFAULT 1,
  coverage_pct      NUMERIC(5,2) NOT NULL,
  orphan_count      INT NOT NULL,
  orphan_paragraphs JSONB NOT NULL DEFAULT '[]',
  non_coverable     JSONB NOT NULL DEFAULT '[]',
  pass              BOOLEAN NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coverage_report ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coverage_select_own" ON public.coverage_report FOR SELECT TO authenticated
  USING (pdf_id IN (SELECT id FROM public.pdf WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "coverage_insert_own" ON public.coverage_report FOR INSERT TO authenticated
  WITH CHECK (pdf_id IN (SELECT id FROM public.pdf WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

-- ============================================================================
-- Tabla: ingestion_job
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ingestion_job (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES public.course(id) ON DELETE CASCADE,
  state         TEXT NOT NULL DEFAULT 'queued',
  current_step  TEXT,
  progress_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
  error_msg     TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT job_state_valid CHECK (state IN ('queued','running','completed','failed','fail_review'))
);

ALTER TABLE public.ingestion_job ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_select_own" ON public.ingestion_job FOR SELECT TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "job_insert_own" ON public.ingestion_job FOR INSERT TO authenticated
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

-- ============================================================================
INSERT INTO public._migrations (id, name)
VALUES (3, '0003_ingestion')
ON CONFLICT (id) DO NOTHING;
