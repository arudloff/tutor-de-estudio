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
