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
