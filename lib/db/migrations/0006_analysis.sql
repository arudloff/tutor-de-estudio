-- 0006_analysis.sql — Sprint D1: SOLO + Toulmin classification per dialogue turn
--
-- Stores A4's per-turn analysis: SOLO taxonomy level (Biggs 1982) and
-- Toulmin argumentation model (1958) component detection.
-- One row per A4 turn (linked to message_log).

-- ============================================================
-- turn_analysis — per-turn SOLO + Toulmin classification
-- ============================================================
CREATE TABLE IF NOT EXISTS turn_analysis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL REFERENCES learning_session(id) ON DELETE CASCADE,
  message_id  UUID NOT NULL REFERENCES message_log(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES sense_unit(id) ON DELETE CASCADE,
  turn_number INT  NOT NULL CHECK (turn_number >= 1),

  -- SOLO Taxonomy (Biggs 1982): 5 levels
  -- 1=prestructural, 2=unistructural, 3=multistructural, 4=relational, 5=extended_abstract
  solo_level  INT NOT NULL CHECK (solo_level BETWEEN 1 AND 5),
  solo_label  TEXT NOT NULL CHECK (solo_label IN (
    'prestructural', 'unistructural', 'multistructural', 'relational', 'extended_abstract'
  )),
  solo_evidence TEXT NOT NULL,  -- brief justification from A4

  -- Toulmin Model (1958): 6 boolean components
  toulmin_claim     BOOLEAN NOT NULL DEFAULT FALSE,
  toulmin_data      BOOLEAN NOT NULL DEFAULT FALSE,
  toulmin_warrant   BOOLEAN NOT NULL DEFAULT FALSE,
  toulmin_backing   BOOLEAN NOT NULL DEFAULT FALSE,
  toulmin_qualifier BOOLEAN NOT NULL DEFAULT FALSE,
  toulmin_rebuttal  BOOLEAN NOT NULL DEFAULT FALSE,
  toulmin_summary   TEXT,  -- brief description of argumentation quality

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_turn_analysis_session ON turn_analysis(session_id);
CREATE INDEX idx_turn_analysis_course  ON turn_analysis(course_id);
CREATE INDEX idx_turn_analysis_unit    ON turn_analysis(unit_id);

-- ============================================================
-- RLS — users see only their own course data
-- ============================================================
ALTER TABLE turn_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own turn_analysis"
  ON turn_analysis FOR SELECT
  USING (course_id IN (SELECT id FROM course WHERE user_id = auth.uid()));

CREATE POLICY "Service inserts turn_analysis"
  ON turn_analysis FOR INSERT
  WITH CHECK (TRUE);

-- No UPDATE/DELETE by users — analysis is immutable once written

-- ============================================================
-- Migration tracking
-- ============================================================
INSERT INTO _migrations (id, name) VALUES (6, '0006_analysis')
ON CONFLICT (id) DO NOTHING;
