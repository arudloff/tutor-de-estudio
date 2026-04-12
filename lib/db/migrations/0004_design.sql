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
