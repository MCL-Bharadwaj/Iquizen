# Kids Quiz System - Database Scripts

## Overview

This folder contains PostgreSQL database scripts for the **Kids Quiz System** - an end-to-end quiz feature designed specifically for children with multiple question types, accessibility features, and extensible architecture.

## 📋 Database Architecture

### Design Principles
- **Minimal Footprint**: 7 core tables with smart use of JSONB for flexibility
- **Hybrid Model**: Structured columns for queryable data + JSONB for type-specific content
- **Explicit Naming**: Primary keys use `tablename_id` pattern (e.g., `quiz_id`, `question_id`)
- **Type Discriminator**: `question_type` column + JSONB `content` for extensibility
- **Combined Responses + Scores**: Single table for atomic answer submission and grading

### Core Tables

| Table | Primary Key | Purpose |
|-------|-------------|---------|
| `quizzes` | `quiz_id` | Quiz metadata (title, age range, difficulty, subject) |
| `questions` | `question_id` | Question definitions with type discriminator + JSONB content |
| `quiz_questions` | Composite PK | Junction table linking quizzes to questions with ordering |
| `attempts` | `attempt_id` | User quiz attempts with aggregate scoring |
| `responses` | `response_id` | User answers + calculated scores (combined table) |
| `content` | `content_id` | i18n translations and localized content |
| `audit_log` | `log_id` | Audit trail for all operations |

## 🗂️ Script Files

### Execution Order

Run scripts in numerical order:

```bash
psql -U postgres -d quiz_db -f 000_migration_setup.sql
psql -U postgres -d quiz_db -f 001_core_schema.sql
psql -U postgres -d quiz_db -f 002_indexes_constraints.sql
psql -U postgres -d quiz_db -f 003_seed_data.sql
```

### Script Descriptions

#### `000_migration_setup.sql`
- **Purpose**: Migration tracking and versioning system
- **Creates**:
  - `schema_versions` table
  - `migration_log` table
  - Helper functions for migration management
- **Extensions**: `uuid-ossp`, `pgcrypto`

#### `001_core_schema.sql`
- **Purpose**: Core 7-table structure
- **Creates**:
  - All 7 core tables with constraints
  - `updated_at` triggers for timestamp management
  - Comprehensive column comments
- **Features**:
  - UUID primary keys with `tablename_id` naming
  - CHECK constraints for data validation
  - Soft delete support (`deleted_at` columns)
  - JSONB columns for flexible content

#### `002_indexes_constraints.sql`
- **Purpose**: Performance optimization and validation
- **Creates**:
  - 35+ indexes including GIN indexes for JSONB
  - Full-text search index on `question_text`
  - Additional CHECK constraints
  - JSONB validation functions for each question type
- **Optimizes**:
  - Age range filtering
  - Subject/difficulty searches
  - Tag-based queries
  - Attempt history lookups
  - JSONB content queries

#### `003_seed_data.sql`
- **Purpose**: Sample data for testing and development
- **Creates**:
  - 3 sample quizzes (ages 5-7, 8-10, 10-13)
  - 7 questions (one for each type)
  - i18n content (English, Spanish, French)
  - Sample attempt with responses
  - Audit log entries
- **Question Types Covered**:
  1. Multiple Choice Single
  2. Multiple Choice Multi
  3. Fill in the Blank
  4. Ordering
  5. Matching
  6. Program Submission
  7. Short Answer

## 🎯 Question Types

### 1. Multiple Choice Single
- **One correct answer**
- JSONB structure:
  ```json
  {
    "options": [{"id": "a", "text": "...", "image": "..."}],
    "correct_answer": "a",
    "shuffle_options": true,
    "media": {...}
  }
  ```

### 2. Multiple Choice Multi
- **Multiple correct answers**
- Supports partial credit
- JSONB structure:
  ```json
  {
    "options": [...],
    "correct_answers": ["a", "b", "d"],
    "partial_credit_rule": "proportional"
  }
  ```

### 3. Fill in the Blank
- **Multiple blanks with flexible matching**
- Supports regex, case-insensitive, synonyms
- JSONB structure:
  ```json
  {
    "template": "The cat is ___ the mat.",
    "blanks": [
      {
        "position": 1,
        "accepted_answers": ["on", "upon"],
        "case_sensitive": false
      }
    ]
  }
  ```

### 4. Ordering
- **Order items in correct sequence**
- Partial credit for adjacent pairs
- JSONB structure:
  ```json
  {
    "items": [{"id": "a", "text": "...", "image": "..."}],
    "correct_order": ["a", "b", "c"],
    "partial_credit_strategy": "adjacent_pairs"
  }
  ```

### 5. Matching
- **Match pairs of items**
- Partial credit per correct pair
- JSONB structure:
  ```json
  {
    "left_items": [...],
    "right_items": [...],
    "correct_pairs": [{"left": "l1", "right": "r1"}],
    "partial_credit_strategy": "per_pair"
  }
  ```

### 6. Program Submission
- **Code challenges with test cases**
- Sandboxed execution
- JSONB structure:
  ```json
  {
    "prompt": "...",
    "starter_code": "def add(a, b):\n    pass",
    "language": "python",
    "test_cases": [
      {
        "input": "add(2, 3)",
        "expected": "5",
        "weight": 0.5,
        "visible": true
      }
    ],
    "time_limit_ms": 1000,
    "memory_limit_mb": 64
  }
  ```

### 7. Short Answer
- **Free-text with keyword scoring**
- Rubric-based grading
- JSONB structure:
  ```json
  {
    "max_length": 500,
    "keywords": [
      {
        "word": "photosynthesis",
        "weight": 0.25,
        "required": true,
        "synonyms": ["photo synthesis"]
      }
    ],
    "min_score_threshold": 0.5
  }
  ```

## 🔍 Common Queries

### Get Quiz with Questions
```sql
SELECT 
    q.quiz_id,
    q.title,
    q.difficulty,
    json_agg(
        json_build_object(
            'question_id', qu.question_id,
            'question_text', qu.question_text,
            'question_type', qu.question_type,
            'content', qu.content,
            'points', qu.points
        ) ORDER BY qq.position
    ) as questions
FROM quizzes q
JOIN quiz_questions qq ON q.quiz_id = qq.quiz_id
JOIN questions qu ON qq.question_id = qu.question_id
WHERE q.quiz_id = '11111111-1111-1111-1111-111111111111'
GROUP BY q.quiz_id;
```

### Get User Attempt History
```sql
SELECT 
    a.attempt_id,
    q.title as quiz_title,
    a.total_score,
    a.max_possible_score,
    ROUND((a.total_score / a.max_possible_score * 100)::numeric, 2) as percentage,
    a.completed_at
FROM attempts a
JOIN quizzes q ON a.quiz_id = q.quiz_id
WHERE a.user_id = 'user_12345'
    AND a.status = 'completed'
ORDER BY a.completed_at DESC;
```

### Get Question by Type
```sql
SELECT 
    question_id,
    question_text,
    difficulty,
    points,
    content
FROM questions
WHERE question_type = 'multiple_choice_single'
    AND age_min >= 5
    AND age_max <= 10
    AND deleted_at IS NULL;
```

### Search Questions by Content
```sql
-- Find questions with images
SELECT question_id, question_text
FROM questions
WHERE content @> '{"media": {"question_image": {}}}'::jsonb;

-- Find multiple choice questions with specific option count
SELECT question_id, question_text
FROM questions
WHERE question_type = 'multiple_choice_single'
    AND jsonb_array_length(content->'options') = 4;
```

## 🛡️ Security Features

### Row-Level Security (RLS)
Schema includes RLS-ready structure. To enable:

```sql
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own attempts
CREATE POLICY user_attempts ON attempts
    FOR SELECT
    USING (user_id = current_setting('app.user_id'));
```

### Soft Deletes
Tables use `deleted_at` timestamp for soft deletes:

```sql
-- Soft delete a quiz
UPDATE quizzes 
SET deleted_at = NOW() 
WHERE quiz_id = '...';

-- Queries automatically filter soft-deleted records via indexes
```

## 📊 Performance Considerations

### Indexes
- **35+ indexes** created for common query patterns
- **GIN indexes** on all JSONB columns for fast content queries
- **Full-text search** index on `question_text`
- **Composite indexes** for multi-column filters

### JSONB Best Practices
```sql
-- Use containment operator for fast queries
WHERE content @> '{"shuffle_options": true}'

-- Use path operators for nested data
WHERE content->'media'->'question_image' IS NOT NULL

-- Use jsonb_array_length for array operations
WHERE jsonb_array_length(content->'options') > 2
```

## 🌍 Internationalization

### Content Table Structure
```sql
SELECT * FROM content WHERE locale = 'en-US';

-- Result:
{
  "app.title": "Kids Quiz App",
  "quiz.start": "Start Quiz",
  "feedback.correct": "Great job! 🎉"
}
```

### Adding New Locale
```sql
INSERT INTO content (locale, translations) VALUES
('de-DE', '{
    "app.title": "Kinder-Quiz-App",
    "quiz.start": "Quiz starten"
}'::jsonb);
```

## 🔧 Maintenance

### View Migration History
```sql
SELECT 
    version_number,
    description,
    status,
    applied_at,
    execution_time_ms
FROM schema_versions
ORDER BY version_id;
```

### Vacuum and Analyze
```sql
-- Regular maintenance
VACUUM ANALYZE quizzes;
VACUUM ANALYZE questions;
VACUUM ANALYZE attempts;
VACUUM ANALYZE responses;
```

### Check Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## 🚀 Next Steps

After running these scripts:

1. **Connect to Azure**
   - Deploy to Azure Database for PostgreSQL
   - Configure connection strings
   - Set up SSL/TLS

2. **Implement API Layer**
   - Azure Functions for CRUD operations
   - Scoring engine for each question type
   - Program submission sandbox

3. **Build Frontend**
   - React application
   - Accessible quiz player
   - Kid-friendly UI/UX

## 📝 Notes

- **Postgres Version**: Requires PostgreSQL 14+ for JSONB features
- **Extensions**: Requires `uuid-ossp` and `pgcrypto`
- **Backup**: Regular backups recommended due to JSONB content
- **Versioning**: Questions are immutable (create new version on edit)

## 📧 Support

For issues or questions about the database schema, refer to the inline comments in each SQL file.

---

**Generated**: 2025-11-08  
**Version**: 1.0.0  
**Schema Version**: 003
