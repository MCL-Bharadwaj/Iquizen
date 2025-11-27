-- ============================================================================
-- Seed Data
-- ============================================================================
-- Purpose: Insert sample quizzes with all 7 question types
-- Author: Kids Quiz System
-- Date: 2025-11-08
-- Version: 003
-- ============================================================================

-- Register this migration
DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('003-seed-data', 'Seed data with sample quizzes and questions', '003_seed_data.sql');
END $$;

-- ============================================================================
-- SAMPLE i18n CONTENT
-- ============================================================================

INSERT INTO quiz.content (content_key, content_type, translations) VALUES
('app.ui', 'i18n', '{
    "en-US": {
        "app.title": "Kids Quiz App",
        "quiz.start": "Start Quiz",
        "quiz.continue": "Continue",
        "quiz.submit": "Submit Answer",
        "quiz.next": "Next Question",
        "quiz.finish": "Finish Quiz",
        "quiz.score": "Your Score",
        "feedback.correct": "Great job! 🎉",
        "feedback.incorrect": "Try again! 💪",
        "feedback.partial": "Good effort! Keep going! ⭐"
    },
    "es-ES": {
        "app.title": "Aplicación de Cuestionarios para Niños",
        "quiz.start": "Comenzar Cuestionario",
        "quiz.continue": "Continuar",
        "quiz.submit": "Enviar Respuesta",
        "quiz.next": "Siguiente Pregunta",
        "quiz.finish": "Finalizar Cuestionario",
        "quiz.score": "Tu Puntuación",
        "feedback.correct": "¡Excelente trabajo! 🎉",
        "feedback.incorrect": "¡Inténtalo de nuevo! 💪",
        "feedback.partial": "¡Buen esfuerzo! ¡Sigue adelante! ⭐"
    },
    "fr-FR": {
        "app.title": "Application de Quiz pour Enfants",
        "quiz.start": "Commencer le Quiz",
        "quiz.continue": "Continuer",
        "quiz.submit": "Soumettre la Réponse",
        "quiz.next": "Question Suivante",
        "quiz.finish": "Terminer le Quiz",
        "quiz.score": "Votre Score",
        "feedback.correct": "Excellent travail! 🎉",
        "feedback.incorrect": "Essayez encore! 💪",
        "feedback.partial": "Bon effort! Continuez! ⭐"
    }
}');

-- ============================================================================
-- SAMPLE QUIZZES
-- ============================================================================

-- Quiz 1: Math for Young Kids (Ages 5-7)
INSERT INTO quiz.quizzes (quiz_id, title, description, age_min, age_max, subject, difficulty, estimated_minutes, tags)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Fun with Numbers',
    'Basic math quiz for young learners covering counting, addition, and shapes',
    5, 7,
    'mathematics',
    'easy',
    10,
    ARRAY['math', 'counting', 'addition', 'shapes', 'beginner']
);

-- Quiz 2: Science Explorer (Ages 8-10)
INSERT INTO quiz.quizzes (quiz_id, title, description, age_min, age_max, subject, difficulty, estimated_minutes, tags)
VALUES 
(
    '22222222-2222-2222-2222-222222222222',
    'Science Explorer',
    'Explore the world of science with questions about animals, plants, and nature',
    8, 10,
    'science',
    'medium',
    15,
    ARRAY['science', 'nature', 'animals', 'plants']
);

-- Quiz 3: Coding Basics (Ages 10-13)
INSERT INTO quiz.quizzes (quiz_id, title, description, age_min, age_max, subject, difficulty, estimated_minutes, tags)
VALUES 
(
    '33333333-3333-3333-3333-333333333333',
    'Coding Basics',
    'Learn basic programming concepts with simple coding challenges',
    10, 13,
    'computer_science',
    'medium',
    20,
    ARRAY['coding', 'programming', 'python', 'logic']
);

-- ============================================================================
-- SAMPLE QUESTIONS - All 7 Types
-- ============================================================================

-- Question 1: Multiple Choice Single (What color is the sky?)
INSERT INTO quiz.questions (
    question_id,
    question_type,
    question_text,
    age_min,
    age_max,
    difficulty,
    estimated_seconds,
    subject,
    locale,
    points,
    allow_partial_credit,
    supports_read_aloud,
    content
)
VALUES (
    'q1111111-1111-1111-1111-111111111111',
    'multiple_choice_single',
    'What color is the sky on a clear day?',
    5, 7,
    'easy',
    30,
    'science',
    'en-US',
    10.0,
    false,
    true,
    '{
        "options": [
            {"id": "a", "text": "Blue", "image": "/assets/colors/blue.jpg"},
            {"id": "b", "text": "Green", "image": "/assets/colors/green.jpg"},
            {"id": "c", "text": "Red", "image": "/assets/colors/red.jpg"},
            {"id": "d", "text": "Yellow", "image": "/assets/colors/yellow.jpg"}
        ],
        "correct_answer": "a",
        "shuffle_options": true,
        "media": {
            "question_image": {
                "url": "/assets/sky-clear.jpg",
                "alt_text": "Clear blue sky with white clouds",
                "width": 800,
                "height": 600
            },
            "question_audio": {
                "url": "/assets/audio/sky-question.mp3",
                "duration_seconds": 8
            }
        }
    }'::jsonb
);

-- Question 2: Multiple Choice Multi (Select all fruits)
INSERT INTO quiz.questions (
    question_id,
    question_type,
    question_text,
    age_min,
    age_max,
    difficulty,
    estimated_seconds,
    subject,
    locale,
    points,
    allow_partial_credit,
    supports_read_aloud,
    content
)
VALUES (
    'q2222222-2222-2222-2222-222222222222',
    'multiple_choice_multi',
    'Select all the items that are fruits:',
    5, 8,
    'easy',
    45,
    'science',
    'en-US',
    15.0,
    true,
    true,
    '{
        "options": [
            {"id": "a", "text": "Apple", "image": "/assets/food/apple.jpg"},
            {"id": "b", "text": "Banana", "image": "/assets/food/banana.jpg"},
            {"id": "c", "text": "Carrot", "image": "/assets/food/carrot.jpg"},
            {"id": "d", "text": "Orange", "image": "/assets/food/orange.jpg"},
            {"id": "e", "text": "Broccoli", "image": "/assets/food/broccoli.jpg"}
        ],
        "correct_answers": ["a", "b", "d"],
        "shuffle_options": true,
        "partial_credit_rule": "proportional",
        "media": {
            "question_image": {
                "url": "/assets/food/food-groups.jpg",
                "alt_text": "Various fruits and vegetables",
                "width": 800,
                "height": 600
            }
        }
    }'::jsonb
);

-- Question 3: Fill in the Blank (Complete the sentence)
INSERT INTO quiz.questions (
    question_id,
    question_type,
    question_text,
    age_min,
    age_max,
    difficulty,
    estimated_seconds,
    subject,
    locale,
    points,
    allow_partial_credit,
    supports_read_aloud,
    content
)
VALUES (
    'q3333333-3333-3333-3333-333333333333',
    'fill_in_blank',
    'Complete the sentence with the correct words:',
    6, 8,
    'easy',
    60,
    'language_arts',
    'en-US',
    10.0,
    true,
    true,
    '{
        "template": "The cat is ___ the mat. It has ___ legs and ___ tail.",
        "blanks": [
            {
                "position": 1,
                "accepted_answers": ["on", "upon", "sitting on"],
                "case_sensitive": false,
                "hint": "Where is the cat?"
            },
            {
                "position": 2,
                "accepted_answers": ["four", "4"],
                "case_sensitive": false,
                "hint": "Count the legs"
            },
            {
                "position": 3,
                "accepted_answers": ["one", "1", "a"],
                "case_sensitive": false,
                "hint": "How many tails?"
            }
        ],
        "media": {
            "hint_image": {
                "url": "/assets/animals/cat-on-mat.jpg",
                "alt_text": "Cute cat sitting on a colorful mat",
                "width": 600,
                "height": 400
            }
        }
    }'::jsonb
);

-- Question 3b: Fill in the Blank with Drag & Drop (Ternary Operator)
INSERT INTO quiz.questions (
    question_id,
    question_type,
    question_text,
    age_min,
    age_max,
    difficulty,
    estimated_seconds,
    subject,
    locale,
    points,
    allow_partial_credit,
    supports_read_aloud,
    content
)
VALUES (
    'q3b33333-3b33-3b33-3b33-33333333333b',
    'fill_in_blank_drag_drop',
    'Complete the ternary operator by dragging the correct operators:',
    12, 18,
    'medium',
    90,
    'programming',
    'en-US',
    15.0,
    true,
    false,
    '{
        "template": "result = (score ___ 60) ___ ''Pass'' : ''Fail'';",
        "blanks": [
            {
                "position": 1,
                "accepted_answers": [">="],
                "hint": "comparison"
            },
            {
                "position": 2,
                "accepted_answers": ["?"],
                "hint": "ternary"
            }
        ],
        "word_bank": [
            {
                "id": "op1",
                "text": ">=",
                "category": "comparison"
            },
            {
                "id": "op2",
                "text": "<=",
                "category": "comparison"
            },
            {
                "id": "op3",
                "text": ">",
                "category": "comparison"
            },
            {
                "id": "op4",
                "text": "?",
                "category": "ternary"
            },
            {
                "id": "op5",
                "text": ":",
                "category": "ternary"
            },
            {
                "id": "op6",
                "text": "&&",
                "category": "logical"
            }
        ],
        "allow_reuse": false
    }'::jsonb
);

-- Question 4: Ordering (Order the life cycle)
INSERT INTO quiz.questions (
    question_id,
    question_type,
    question_text,
    age_min,
    age_max,
    difficulty,
    estimated_seconds,
    subject,
    locale,
    points,
    allow_partial_credit,
    supports_read_aloud,
    content
)
VALUES (
    'q4444444-4444-4444-4444-444444444444',
    'ordering',
    'Put the stages of a plant growing in the correct order:',
    7, 10,
    'medium',
    60,
    'science',
    'en-US',
    15.0,
    true,
    true,
    '{
        "items": [
            {"id": "a", "text": "Seed is planted", "image": "/assets/plants/seed.jpg"},
            {"id": "b", "text": "Sprout emerges", "image": "/assets/plants/sprout.jpg"},
            {"id": "c", "text": "Plant grows leaves", "image": "/assets/plants/leaves.jpg"},
            {"id": "d", "text": "Flower blooms", "image": "/assets/plants/flower.jpg"},
            {"id": "e", "text": "Plant produces new seeds", "image": "/assets/plants/seeds-new.jpg"}
        ],
        "correct_order": ["a", "b", "c", "d", "e"],
        "partial_credit_strategy": "adjacent_pairs",
        "media": {
            "tutorial_video": {
                "url": "/assets/videos/plant-lifecycle.mp4",
                "duration_seconds": 45,
                "thumbnail": "/assets/videos/plant-lifecycle-thumb.jpg"
            }
        }
    }'::jsonb
);

-- Question 5: Matching (Match animals to sounds)
INSERT INTO quiz.questions (
    question_id,
    question_type,
    question_text,
    age_min,
    age_max,
    difficulty,
    estimated_seconds,
    subject,
    locale,
    points,
    allow_partial_credit,
    supports_read_aloud,
    content
)
VALUES (
    'q5555555-5555-5555-5555-555555555555',
    'matching',
    'Match each animal to the sound it makes:',
    5, 8,
    'easy',
    60,
    'science',
    'en-US',
    15.0,
    true,
    true,
    '{
        "left_items": [
            {"id": "l1", "text": "Dog", "image": "/assets/animals/dog.jpg"},
            {"id": "l2", "text": "Cat", "image": "/assets/animals/cat.jpg"},
            {"id": "l3", "text": "Cow", "image": "/assets/animals/cow.jpg"},
            {"id": "l4", "text": "Duck", "image": "/assets/animals/duck.jpg"}
        ],
        "right_items": [
            {"id": "r1", "text": "Bark", "audio": "/assets/sounds/bark.mp3"},
            {"id": "r2", "text": "Meow", "audio": "/assets/sounds/meow.mp3"},
            {"id": "r3", "text": "Moo", "audio": "/assets/sounds/moo.mp3"},
            {"id": "r4", "text": "Quack", "audio": "/assets/sounds/quack.mp3"}
        ],
        "correct_pairs": [
            {"left": "l1", "right": "r1"},
            {"left": "l2", "right": "r2"},
            {"left": "l3", "right": "r3"},
            {"left": "l4", "right": "r4"}
        ],
        "partial_credit_strategy": "per_pair",
        "shuffle_items": true
    }'::jsonb
);

-- Question 6: Program Submission (Write a function)
INSERT INTO quiz.questions (
    question_id,
    question_type,
    question_text,
    age_min,
    age_max,
    difficulty,
    estimated_seconds,
    subject,
    locale,
    points,
    allow_partial_credit,
    supports_read_aloud,
    content
)
VALUES (
    'q6666666-6666-6666-6666-666666666666',
    'program_submission',
    'Write a Python function that adds two numbers together:',
    10, 13,
    'medium',
    300,
    'computer_science',
    'en-US',
    25.0,
    true,
    true,
    '{
        "prompt": "Complete the function `add_numbers(a, b)` that takes two numbers and returns their sum.",
        "starter_code": "def add_numbers(a, b):\\n    # Write your code here\\n    pass",
        "language": "python",
        "test_cases": [
            {
                "input": "add_numbers(2, 3)",
                "expected": "5",
                "weight": 0.2,
                "visible": true,
                "description": "Basic addition"
            },
            {
                "input": "add_numbers(-1, 1)",
                "expected": "0",
                "weight": 0.2,
                "visible": true,
                "description": "Adding negative number"
            },
            {
                "input": "add_numbers(0, 0)",
                "expected": "0",
                "weight": 0.2,
                "visible": false,
                "description": "Adding zeros"
            },
            {
                "input": "add_numbers(100, 200)",
                "expected": "300",
                "weight": 0.2,
                "visible": false,
                "description": "Large numbers"
            },
            {
                "input": "add_numbers(-5, -10)",
                "expected": "-15",
                "weight": 0.2,
                "visible": false,
                "description": "Two negative numbers"
            }
        ],
        "time_limit_ms": 1000,
        "memory_limit_mb": 64,
        "allowed_imports": ["math"],
        "media": {
            "tutorial_video": {
                "url": "/assets/videos/python-functions.mp4",
                "duration_seconds": 120,
                "thumbnail": "/assets/videos/python-thumb.jpg"
            },
            "hint_image": {
                "url": "/assets/coding/addition-hint.jpg",
                "alt_text": "Visual representation of addition"
            }
        }
    }'::jsonb
);

-- Question 7: Short Answer (Explain photosynthesis)
INSERT INTO quiz.questions (
    question_id,
    question_type,
    question_text,
    age_min,
    age_max,
    difficulty,
    estimated_seconds,
    subject,
    locale,
    points,
    allow_partial_credit,
    supports_read_aloud,
    content
)
VALUES (
    'q7777777-7777-7777-7777-777777777777',
    'short_answer',
    'In your own words, explain how plants make their own food:',
    9, 12,
    'medium',
    180,
    'science',
    'en-US',
    20.0,
    true,
    true,
    '{
        "max_length": 500,
        "min_length": 50,
        "keywords": [
            {"word": "photosynthesis", "weight": 0.25, "required": false, "synonyms": ["photo synthesis"]},
            {"word": "sunlight", "weight": 0.25, "required": true, "synonyms": ["sun", "light", "solar"]},
            {"word": "water", "weight": 0.15, "required": true, "synonyms": ["h2o"]},
            {"word": "carbon dioxide", "weight": 0.15, "required": false, "synonyms": ["co2", "carbon"]},
            {"word": "oxygen", "weight": 0.1, "required": false, "synonyms": ["o2"]},
            {"word": "glucose", "weight": 0.1, "required": false, "synonyms": ["sugar", "food", "energy"]}
        ],
        "min_score_threshold": 0.5,
        "rubric_description": "Answer should mention sunlight, water, and the process of making food. Bonus points for mentioning carbon dioxide, oxygen, or glucose.",
        "media": {
            "reference_image": {
                "url": "/assets/science/photosynthesis-diagram.jpg",
                "alt_text": "Diagram showing photosynthesis process",
                "width": 800,
                "height": 600
            },
            "question_audio": {
                "url": "/assets/audio/photosynthesis-question.mp3",
                "duration_seconds": 15
            }
        }
    }'::jsonb
);

-- ============================================================================
-- LINK QUESTIONS TO QUIZZES
-- ============================================================================

-- Quiz 1: Fun with Numbers (Multiple Choice Single, Fill in Blank)
INSERT INTO quiz.quiz_questions (quiz_id, question_id, position) VALUES
('11111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', 1),
('11111111-1111-1111-1111-111111111111', 'q2222222-2222-2222-2222-222222222222', 2),
('11111111-1111-1111-1111-111111111111', 'q3333333-3333-3333-3333-333333333333', 3);

-- Quiz 2: Science Explorer (Ordering, Matching, Short Answer)
INSERT INTO quiz.quiz_questions (quiz_id, question_id, position) VALUES
('22222222-2222-2222-2222-222222222222', 'q4444444-4444-4444-4444-444444444444', 1),
('22222222-2222-2222-2222-222222222222', 'q5555555-5555-5555-5555-555555555555', 2),
('22222222-2222-2222-2222-222222222222', 'q7777777-7777-7777-7777-777777777777', 3);

-- Quiz 3: Coding Basics (Program Submission)
INSERT INTO quiz.quiz_questions (quiz_id, question_id, position) VALUES
('33333333-3333-3333-3333-333333333333', 'q6666666-6666-6666-6666-666666666666', 1);

-- ============================================================================
-- SAMPLE ATTEMPT AND RESPONSES (Demo Data)
-- ============================================================================

-- Sample Attempt 1: User takes "Fun with Numbers" quiz
INSERT INTO quiz.attempts (
    attempt_id,
    quiz_id,
    user_id,
    status,
    started_at,
    completed_at,
    total_score,
    max_possible_score,
    metadata
)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'user_12345',
    'completed',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '50 minutes',
    32.5,
    35.0,
    '{
        "device": "tablet",
        "browser": "Safari",
        "screen_size": "1024x768",
        "accessibility_mode": "read_aloud_enabled"
    }'::jsonb
);

-- Response 1: Multiple Choice Single (Correct)
INSERT INTO quiz.responses (
    response_id,
    attempt_id,
    question_id,
    answer_payload,
    submitted_at,
    points_earned,
    points_possible,
    is_correct,
    grading_details,
    graded_at
)
VALUES (
    'r1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'q1111111-1111-1111-1111-111111111111',
    '{"selected_option": "a"}'::jsonb,
    NOW() - INTERVAL '59 minutes',
    10.0,
    10.0,
    true,
    '{
        "auto_graded": true,
        "feedback": "Great job! 🎉",
        "time_taken_seconds": 25
    }'::jsonb,
    NOW() - INTERVAL '59 minutes'
);

-- Response 2: Multiple Choice Multi (Partial Credit)
INSERT INTO quiz.responses (
    response_id,
    attempt_id,
    question_id,
    answer_payload,
    submitted_at,
    points_earned,
    points_possible,
    is_correct,
    grading_details,
    graded_at
)
VALUES (
    'r2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'q2222222-2222-2222-2222-222222222222',
    '{"selected_options": ["a", "b"]}'::jsonb,
    NOW() - INTERVAL '57 minutes',
    10.0,
    15.0,
    false,
    '{
        "auto_graded": true,
        "feedback": "Good effort! You got 2 out of 3 correct. ⭐",
        "correct_selections": 2,
        "total_correct": 3,
        "incorrect_selections": 0,
        "partial_credit_applied": true,
        "time_taken_seconds": 42
    }'::jsonb,
    NOW() - INTERVAL '57 minutes'
);

-- Response 3: Fill in Blank (Partial Credit)
INSERT INTO quiz.responses (
    response_id,
    attempt_id,
    question_id,
    answer_payload,
    submitted_at,
    points_earned,
    points_possible,
    is_correct,
    grading_details,
    graded_at
)
VALUES (
    'r3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'q3333333-3333-3333-3333-333333333333',
    '{"blanks": [{"position": 1, "answer": "on"}, {"position": 2, "answer": "four"}, {"position": 3, "answer": "two"}]}'::jsonb,
    NOW() - INTERVAL '52 minutes',
    7.5,
    10.0,
    false,
    '{
        "auto_graded": true,
        "feedback": "Almost there! 2 out of 3 blanks correct. 💪",
        "blank_results": [
            {"position": 1, "correct": true, "submitted": "on", "accepted": ["on", "upon", "sitting on"]},
            {"position": 2, "correct": true, "submitted": "four", "accepted": ["four", "4"]},
            {"position": 3, "correct": false, "submitted": "two", "accepted": ["one", "1", "a"]}
        ],
        "partial_credit_applied": true,
        "time_taken_seconds": 68
    }'::jsonb,
    NOW() - INTERVAL '52 minutes'
);

-- ============================================================================
-- AUDIT LOG ENTRIES (Demo Data)
-- ============================================================================

INSERT INTO quiz.audit_log (entity_type, entity_id, action, actor_id, changes) VALUES
('quiz', '11111111-1111-1111-1111-111111111111', 'create', 'admin_user', '{"created": "Quiz: Fun with Numbers"}'::jsonb),
('question', 'q1111111-1111-1111-1111-111111111111', 'create', 'admin_user', '{"created": "Question: What color is the sky?"}'::jsonb),
('attempt', 'a1111111-1111-1111-1111-111111111111', 'start', 'user_12345', '{"quiz_id": "11111111-1111-1111-1111-111111111111"}'::jsonb),
('response', 'r1111111-1111-1111-1111-111111111111', 'submit', 'user_12345', '{"question_id": "q1111111-1111-1111-1111-111111111111", "correct": true}'::jsonb),
('attempt', 'a1111111-1111-1111-1111-111111111111', 'complete', 'user_12345', '{"total_score": 32.5, "max_score": 35.0, "percentage": 92.86}'::jsonb);

-- ============================================================================
-- Complete migration
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
    v_quiz_count INT;
    v_question_count INT;
BEGIN
    SELECT COUNT(*) INTO v_quiz_count FROM quizzes;
    SELECT COUNT(*) INTO v_question_count FROM questions;
    
    SELECT version_id INTO v_version_id FROM schema_versions WHERE version_number = '003';
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 
        v_quiz_count || ' quizzes and ' || v_question_count || ' questions inserted');
END $$;

-- ============================================================================
-- Display seeded data summary
-- ============================================================================

SELECT 
    'Quizzes' as entity,
    COUNT(*) as count
FROM quizzes
UNION ALL
SELECT 
    'Questions' as entity,
    COUNT(*) as count
FROM questions
UNION ALL
SELECT 
    'Quiz-Question Links' as entity,
    COUNT(*) as count
FROM quiz_questions
UNION ALL
SELECT 
    'Content Locales' as entity,
    COUNT(*) as count
FROM content
UNION ALL
SELECT 
    'Sample Attempts' as entity,
    COUNT(*) as count
FROM attempts
UNION ALL
SELECT 
    'Sample Responses' as entity,
    COUNT(*) as count
FROM responses
UNION ALL
SELECT 
    'Audit Log Entries' as entity,
    COUNT(*) as count
FROM audit_log;

-- Display quiz details
SELECT 
    title,
    age_min || '-' || age_max as age_range,
    difficulty,
    (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.quiz_id) as question_count,
    estimated_minutes || ' min' as estimated_time
FROM quizzes q
ORDER BY age_min;

-- Display question types distribution
SELECT 
    question_type,
    COUNT(*) as count,
    AVG(points)::DECIMAL(10,1) as avg_points
FROM questions
GROUP BY question_type
ORDER BY count DESC;
