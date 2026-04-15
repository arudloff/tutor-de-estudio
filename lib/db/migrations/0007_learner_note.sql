-- 0007_learner_note.sql — Sprint D6: Personal notes linked to units/passages/misconceptions
--
-- Learner notes are the student's personal reflections, linked to
-- specific units, passages (source_spans), or misconceptions.
-- Supports tags for categorization and pattern detection.

-- ============================================================
-- learner_note — personal notes with flexible linking
-- ============================================================
CREATE TABLE IF NOT EXISTS learner_note (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title           TEXT,
  content         TEXT NOT NULL CHECK (length(content) > 0),
  tags            TEXT[] NOT NULL DEFAULT '{}',

  -- Flexible linking (all nullable — note can be free-floating)
  unit_id         UUID REFERENCES sense_unit(id) ON DELETE SET NULL,
  misconception_id UUID REFERENCES misconception_catalog(id) ON DELETE SET NULL,
  session_id      UUID REFERENCES learning_session(id) ON DELETE SET NULL,

  -- Source passage reference (from PDF)
  source_pdf_id   UUID REFERENCES pdf(id) ON DELETE SET NULL,
  source_span     JSONB,  -- {from_paragraph: N, to_paragraph: M} or null

  -- Pattern detection tags (auto-detected)
  is_conceptual_change BOOLEAN NOT NULL DEFAULT FALSE,  -- #cambio_conceptual

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for search and filtering
CREATE INDEX idx_learner_note_course   ON learner_note(course_id);
CREATE INDEX idx_learner_note_user     ON learner_note(user_id);
CREATE INDEX idx_learner_note_unit     ON learner_note(unit_id);
CREATE INDEX idx_learner_note_tags     ON learner_note USING GIN(tags);
CREATE INDEX idx_learner_note_search   ON learner_note USING GIN(
  to_tsvector('spanish', coalesce(title, '') || ' ' || content)
);

-- Updated_at trigger
CREATE TRIGGER set_learner_note_updated_at
  BEFORE UPDATE ON learner_note
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS — users see only their own notes
-- ============================================================
ALTER TABLE learner_note ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notes"
  ON learner_note FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users create own notes"
  ON learner_note FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own notes"
  ON learner_note FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notes"
  ON learner_note FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- Migration tracking
-- ============================================================
INSERT INTO _migrations (name) VALUES ('0007_learner_note');
