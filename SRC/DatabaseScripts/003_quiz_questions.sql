-- ============================================================================
-- 003_quiz_questions.sql
-- Create `quiz_questions` junction table and related indexes
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('003-quiz-questions', 'Create quiz_questions junction table and indexes', '003_quiz_questions.sql');
END $$;

-- TABLE: quiz_questions
CREATE TABLE IF NOT EXISTS quiz.quiz_questions (
    quiz_id UUID NOT NULL REFERENCES quiz.quizzes(quiz_id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz.questions(question_id) ON DELETE CASCADE,
    position INT NOT NULL CHECK (position > 0),
    PRIMARY KEY (quiz_id, question_id),
    CONSTRAINT unique_position_per_quiz UNIQUE (quiz_id, position)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_position ON quiz.quiz_questions(quiz_id, position);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_question_id ON quiz.quiz_questions(question_id);

-- Complete migration
DO $$
DECLARE
    v_version_id INT;
BEGIN
    SELECT version_id INTO v_version_id FROM quiz.schema_versions WHERE version_number = '003-quiz-questions';
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 'quiz_questions table created');
END $$;
