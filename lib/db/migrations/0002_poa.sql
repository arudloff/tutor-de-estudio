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
