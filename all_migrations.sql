-- ============================================================================
-- Socrates — Migracion 0001: bootstrap inicial
-- Fecha: 2026-04-11
-- Sprint: S0
-- Cobertura: tablas base (invited_users, course) con RLS habilitada
--
-- Las tablas especificas del dominio (POA, pdf, sense_unit, learning_session,
-- etc.) se agregan en migraciones posteriores conforme los sprints las
-- necesiten. Ver docs/07_REQUISITOS.md seccion 4 para el esquema completo.
--
-- REGLA: toda tabla con datos de usuario debe tener RLS habilitada desde el
-- momento de su creacion. Sin excepciones. (D5 cerrada)
-- ============================================================================

-- Extension para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Trigger comun: auto-update de updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Tabla: invited_users
-- Purpose: whitelist de D6 (multi-usuario controlado desde dia uno).
-- Solo emails presentes en esta tabla pueden hacer sign-up.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invited_users (
  email         TEXT PRIMARY KEY,
  invited_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_up_at  TIMESTAMPTZ
);

COMMENT ON TABLE public.invited_users IS
  'Whitelist de emails preautorizados (D6). Verificado por el endpoint de signup.';

ALTER TABLE public.invited_users ENABLE ROW LEVEL SECURITY;

-- Policy: ningun usuario normal puede leer invited_users (ni el suyo).
-- La verificacion de whitelist se hace desde el backend con service_role.
-- Esta policy existe explicitamente para bloquear cualquier query anonima.
CREATE POLICY "invited_users_no_client_access"
  ON public.invited_users
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- Tabla: course
-- Purpose: objeto raiz del sistema. Un curso pertenece a un user.
-- Estado inicial: draft. El flujo del state machine se documenta en docs/06
-- seccion 4.1 y se refuerza con CHECK constraint.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.course (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  deadline    DATE NOT NULL,
  state       TEXT NOT NULL DEFAULT 'draft',
  mode        TEXT NOT NULL DEFAULT 'examen',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT course_name_length
    CHECK (char_length(name) BETWEEN 3 AND 200),

  CONSTRAINT course_deadline_future
    CHECK (deadline > CURRENT_DATE),

  CONSTRAINT course_state_valid
    CHECK (state IN (
      'draft',
      'poa_captured',
      'corpus_loaded',
      'ingestion_ready',
      'ingesting',
      'active',
      'fail_review',
      'paused',
      'completed',
      'archived'
    )),

  CONSTRAINT course_mode_valid
    CHECK (mode IN ('examen'))  -- MVP-1: solo modo examen (D11)
);

CREATE INDEX IF NOT EXISTS idx_course_user_id ON public.course(user_id);
CREATE INDEX IF NOT EXISTS idx_course_state ON public.course(state);
CREATE INDEX IF NOT EXISTS idx_course_deadline ON public.course(deadline);

COMMENT ON TABLE public.course IS
  'Curso doctoral. Objeto raiz del sistema. State machine definido en docs/06 seccion 4.1.';

-- Trigger de updated_at
DROP TRIGGER IF EXISTS course_set_updated_at ON public.course;
CREATE TRIGGER course_set_updated_at
  BEFORE UPDATE ON public.course
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS: aprendiz solo ve y manipula sus propios cursos
ALTER TABLE public.course ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_select_own"
  ON public.course
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "course_insert_own"
  ON public.course
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "course_update_own"
  ON public.course
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "course_delete_own"
  ON public.course
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- Metadata de la migracion
-- ============================================================================
CREATE TABLE IF NOT EXISTS public._migrations (
  id          INT PRIMARY KEY,
  name        TEXT NOT NULL,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public._migrations (id, name)
VALUES (1, '0001_init')
ON CONFLICT (id) DO NOTHING;
-- ============================================================================
-- Socrates — Migracion 0002: Perfil de Objetivo del Aprendiz (POA)
-- Fecha: 2026-04-12
-- Sprint: S2
-- Decision: D17 (POA obligatorio), D18 (A12 separado), D19 (propagacion)
-- Anclaje teorico: Ausubel estricto (3 condiciones del aprendizaje significativo)
-- ============================================================================

-- ============================================================================
-- Tabla: learner_objective_profile (POA)
-- Un POA por curso. Captura quien es el aprendiz, que quiere lograr, y que ya sabe.
-- State machine: empty → in_interview → captured → confirmed_by_learner → updating
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.learner_objective_profile (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id                UUID NOT NULL UNIQUE REFERENCES public.course(id) ON DELETE CASCADE,
  state                    TEXT NOT NULL DEFAULT 'empty',

  -- Componente 1: contexto del aprendiz
  learner_role             TEXT,
  discipline               TEXT,
  program                  TEXT,
  phase                    TEXT,
  research_field           TEXT,

  -- Componente 2: objetivo del curso
  target_challenge         TEXT,
  target_capability        TEXT,
  success_signal           TEXT,
  target_deadline          DATE,

  -- Componente 3: conocimientos previos relevantes (anclajes de Ausubel)
  known_authors            TEXT[],
  prior_readings           TEXT[],
  prior_ideas              TEXT,
  theoretical_traditions   TEXT[],

  -- Meta
  confirmed_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT poa_state_valid
    CHECK (state IN (
      'empty',
      'in_interview',
      'captured',
      'confirmed_by_learner',
      'updating'
    )),

  CONSTRAINT poa_phase_valid
    CHECK (phase IS NULL OR phase IN ('starting', 'middle', 'closing', 'postdoctoral'))
);

CREATE INDEX IF NOT EXISTS idx_poa_course_id ON public.learner_objective_profile(course_id);

COMMENT ON TABLE public.learner_objective_profile IS
  'Perfil de Objetivo del Aprendiz (D17). Anclaje: Ausubel estricto. Capturado por A12 (D18).';

-- Trigger de updated_at
DROP TRIGGER IF EXISTS poa_set_updated_at ON public.learner_objective_profile;
CREATE TRIGGER poa_set_updated_at
  BEFORE UPDATE ON public.learner_objective_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS: aprendiz solo ve el POA de sus propios cursos
ALTER TABLE public.learner_objective_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poa_select_own"
  ON public.learner_objective_profile
  FOR SELECT
  TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

CREATE POLICY "poa_insert_own"
  ON public.learner_objective_profile
  FOR INSERT
  TO authenticated
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

CREATE POLICY "poa_update_own"
  ON public.learner_objective_profile
  FOR UPDATE
  TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

CREATE POLICY "poa_delete_own"
  ON public.learner_objective_profile
  FOR DELETE
  TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

-- ============================================================================
-- Tabla: message_log (mensajes de la entrevista del A12 y futuros dialogos del A4)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES public.course(id) ON DELETE CASCADE,
  session_id  UUID,  -- NULL para entrevista POA del A12 (no hay session aun)
  agent       TEXT NOT NULL,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  tokens      INT,
  latency_ms  INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT message_agent_valid
    CHECK (agent IN ('a4', 'a12', 'a11', 'learner')),

  CONSTRAINT message_role_valid
    CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_message_log_course ON public.message_log(course_id, created_at);

ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_log_select_own"
  ON public.message_log
  FOR SELECT
  TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

CREATE POLICY "message_log_insert_own"
  ON public.message_log
  FOR INSERT
  TO authenticated
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

-- ============================================================================
INSERT INTO public._migrations (id, name)
VALUES (2, '0002_poa')
ON CONFLICT (id) DO NOTHING;
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
-- ============================================================================
-- Socrates — Migracion 0004: artefactos pedagogicos (A3) + auditoria (A7)
-- Sprint: S4
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.productive_failure_problem (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.productive_failure_problem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pfp_select_own" ON public.productive_failure_problem FOR SELECT TO authenticated
  USING (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "pfp_insert_own" ON public.productive_failure_problem FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.canonical_instruction (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  cited_spans JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.canonical_instruction ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ci_select_own" ON public.canonical_instruction FOR SELECT TO authenticated
  USING (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "ci_insert_own" ON public.canonical_instruction FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.rubric (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  items       JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rubric_min_items CHECK (jsonb_array_length(items) >= 3)
);
ALTER TABLE public.rubric ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rub_select_own" ON public.rubric FOR SELECT TO authenticated
  USING (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "rub_insert_own" ON public.rubric FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.misconception_catalog (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  items       JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mc_min_items CHECK (jsonb_array_length(items) >= 3)
);
ALTER TABLE public.misconception_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_select_own" ON public.misconception_catalog FOR SELECT TO authenticated
  USING (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "mc_insert_own" ON public.misconception_catalog FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.generative_task (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  tier        INT NOT NULL CHECK (tier IN (1,2,3)),
  format      TEXT NOT NULL,
  prompt      TEXT NOT NULL,
  max_words   INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generative_task ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gt_select_own" ON public.generative_task FOR SELECT TO authenticated
  USING (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "gt_insert_own" ON public.generative_task FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.audit_report (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id       UUID NOT NULL REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  agent         TEXT NOT NULL CHECK (agent IN ('a7')),
  iter          INT NOT NULL DEFAULT 1,
  cite_results  JSONB NOT NULL,
  pass          BOOLEAN NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_report ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar_select_own" ON public.audit_report FOR SELECT TO authenticated
  USING (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "ar_insert_own" ON public.audit_report FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

INSERT INTO public._migrations (id, name)
VALUES (4, '0004_design')
ON CONFLICT (id) DO NOTHING;
-- ============================================================================
-- Socrates — Migracion 0005: sesion de aprendizaje, acreditacion, artifacts
-- Sprint: S5
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learning_session (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES public.course(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  state       TEXT NOT NULL DEFAULT 'scheduled',
  started_at  TIMESTAMPTZ,
  closed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT session_state_valid CHECK (state IN (
    'scheduled','started','in_progress','evaluated','closed','abandoned','crashed'
  ))
);

CREATE INDEX IF NOT EXISTS idx_session_course ON public.learning_session(course_id);
CREATE INDEX IF NOT EXISTS idx_session_unit ON public.learning_session(unit_id);

DROP TRIGGER IF EXISTS session_set_updated_at ON public.learning_session;
CREATE TRIGGER session_set_updated_at
  BEFORE UPDATE ON public.learning_session
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.learning_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_select_own" ON public.learning_session FOR SELECT TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "session_insert_own" ON public.learning_session FOR INSERT TO authenticated
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "session_update_own" ON public.learning_session FOR UPDATE TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

-- Agregar session_id FK a message_log (nullable, ya existe la tabla)
-- En MVP-1 hacemos esto con ALTER TABLE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='message_log' AND column_name='session_id') THEN
    -- ya existe, noop
    NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.attempt (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.learning_session(id) ON DELETE CASCADE,
  attempt_type  TEXT NOT NULL,
  content       TEXT NOT NULL,
  evaluation    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT attempt_type_valid CHECK (attempt_type IN ('productive_failure','dialog_turn'))
);

CREATE INDEX IF NOT EXISTS idx_attempt_session ON public.attempt(session_id, created_at);

ALTER TABLE public.attempt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempt_select_own" ON public.attempt FOR SELECT TO authenticated
  USING (session_id IN (SELECT id FROM public.learning_session WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "attempt_insert_own" ON public.attempt FOR INSERT TO authenticated
  WITH CHECK (session_id IN (SELECT id FROM public.learning_session WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.hito_accreditation (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL REFERENCES public.learning_session(id) ON DELETE CASCADE,
  result      TEXT NOT NULL CHECK (result IN ('PASS','FAIL')),
  evidence    JSONB NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accred_unit ON public.hito_accreditation(unit_id);

ALTER TABLE public.hito_accreditation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accred_select_own" ON public.hito_accreditation FOR SELECT TO authenticated
  USING (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "accred_insert_own" ON public.hito_accreditation FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.artifact (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL REFERENCES public.sense_unit(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL REFERENCES public.learning_session(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES public.generative_task(id),
  format      TEXT NOT NULL,
  content     TEXT NOT NULL,
  word_count  INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.artifact ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artifact_select_own" ON public.artifact FOR SELECT TO authenticated
  USING (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));
CREATE POLICY "artifact_insert_own" ON public.artifact FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT id FROM public.sense_unit WHERE course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid())));

-- Plan adaptativo (A5)
CREATE TABLE IF NOT EXISTS public.learning_plan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL UNIQUE REFERENCES public.course(id) ON DELETE CASCADE,
  next_unit_id    UUID REFERENCES public.sense_unit(id),
  progress_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  projected_finish DATE,
  at_risk         BOOLEAN NOT NULL DEFAULT false,
  gap_days        INT,
  recalculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_select_own" ON public.learning_plan FOR SELECT TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "plan_insert_own" ON public.learning_plan FOR INSERT TO authenticated
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));
CREATE POLICY "plan_update_own" ON public.learning_plan FOR UPDATE TO authenticated
  USING (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.course WHERE user_id = auth.uid()));

INSERT INTO public._migrations (id, name)
VALUES (5, '0005_session')
ON CONFLICT (id) DO NOTHING;
