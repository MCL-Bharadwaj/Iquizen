# AI Question Generation Guide for Kids Quiz System

## System Overview
This guide provides structured formats for generating quiz questions compatible with the Kids Quiz System database. Use this as a prompt template for LLM-based question generation.

---

## Database Schema Requirements

### Question Base Properties (Required for ALL types)
```json
{
  "question_id": "UUID (v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)",
  "question_type": "string (see supported types below)",
  "question_text": "string (1-1000 characters, clear and age-appropriate)",
  "age_min": "integer (5-18, minimum age)",
  "age_max": "integer (5-18, maximum age, must be >= age_min)",
  "difficulty": "enum: 'easy' | 'medium' | 'hard'",
  "estimated_seconds": "integer (15-600, time to complete)",
  "subject": "string (e.g., 'mathematics', 'science', 'language_arts', 'programming')",
  "locale": "string (e.g., 'en-US', 'es-ES', 'fr-FR')",
  "points": "decimal (1.0-100.0, points for correct answer)",
  "allow_partial_credit": "boolean (true/false)",
  "supports_read_aloud": "boolean (true/false, audio/TTS support)",
  "content": "JSONB object (type-specific structure, see below)"
}
```

---

## Supported Question Types (8 Types)

### 1. Multiple Choice Single Answer (`multiple_choice_single`)

**Description:** Student selects ONE correct answer from multiple options.

**Content Structure:**
```json
{
  "options": [
    {
      "id": "string (a, b, c, d, etc.)",
      "text": "string (option text)",
      "image": "string (optional, relative URL)"
    }
  ],
  "correct_answer": "string (id of correct option)",
  "shuffle_options": "boolean (randomize display order)",
  "media": {
    "question_image": {
      "url": "string (relative path)",
      "alt_text": "string (accessibility)",
      "width": "integer (pixels)",
      "height": "integer (pixels)"
    },
    "question_audio": {
      "url": "string (relative path)",
      "duration_seconds": "integer"
    }
  }
}
```

**Generation Rules:**
- Minimum 2 options, maximum 6 options
- Exactly ONE correct answer
- All option IDs must be unique
- Distractors (wrong answers) should be plausible but clearly incorrect
- Options should be similar in length and complexity

**Example:**
```json
{
  "question_type": "multiple_choice_single",
  "question_text": "What is the capital of France?",
  "age_min": 10,
  "age_max": 14,
  "difficulty": "easy",
  "estimated_seconds": 30,
  "subject": "geography",
  "locale": "en-US",
  "points": 10.0,
  "allow_partial_credit": false,
  "supports_read_aloud": true,
  "content": {
    "options": [
      {"id": "a", "text": "Paris"},
      {"id": "b", "text": "London"},
      {"id": "c", "text": "Berlin"},
      {"id": "d", "text": "Madrid"}
    ],
    "correct_answer": "a",
    "shuffle_options": true
  }
}
```

---

### 2. Multiple Choice Multiple Answers (`multiple_choice_multi`)

**Description:** Student selects ALL correct answers (2 or more).

**Content Structure:**
```json
{
  "options": [
    {
      "id": "string (a, b, c, d, etc.)",
      "text": "string (option text)",
      "image": "string (optional, relative URL)"
    }
  ],
  "correct_answers": ["array of correct option IDs"],
  "shuffle_options": "boolean",
  "partial_credit_rule": "string ('proportional' | 'all_or_nothing')",
  "media": { /* same as single choice */ }
}
```

**Generation Rules:**
- Minimum 3 options total
- At least 2 correct answers required
- At least 1 wrong answer required (distractor)
- Use `proportional` for partial credit (recommended)
- Clear instruction: "Select ALL that apply"

**Example:**
```json
{
  "question_type": "multiple_choice_multi",
  "question_text": "Which of these are prime numbers?",
  "content": {
    "options": [
      {"id": "a", "text": "2"},
      {"id": "b", "text": "3"},
      {"id": "c", "text": "4"},
      {"id": "d", "text": "5"},
      {"id": "e", "text": "6"}
    ],
    "correct_answers": ["a", "b", "d"],
    "shuffle_options": true,
    "partial_credit_rule": "proportional"
  }
}
```

---

### 3. Fill in the Blank (`fill_in_blank`)

**Description:** Student types text to fill in missing words/phrases.

**Content Structure:**
```json
{
  "template": "string (use ___ for blank placeholders)",
  "blanks": [
    {
      "position": "integer (1-based index)",
      "accepted_answers": ["array of valid answers"],
      "case_sensitive": "boolean",
      "hint": "string (optional hint text)",
      "regex_pattern": "string (optional regex for validation)"
    }
  ],
  "media": { /* optional */ }
}
```

**Generation Rules:**
- Use exactly 3 underscores `___` for each blank in template
- Number of blanks in template must match array length
- Provide multiple accepted answers (synonyms, variations)
- Use `case_sensitive: false` for most cases
- Position starts at 1 (not 0)
- Hints should guide without revealing answer

**Example:**
```json
{
  "question_type": "fill_in_blank",
  "question_text": "Complete the sentence:",
  "content": {
    "template": "The ___ is the largest planet in our ___ system.",
    "blanks": [
      {
        "position": 1,
        "accepted_answers": ["Jupiter", "jupiter"],
        "case_sensitive": false,
        "hint": "Starts with J"
      },
      {
        "position": 2,
        "accepted_answers": ["solar", "Solar"],
        "case_sensitive": false,
        "hint": "Rhymes with 'polar'"
      }
    ]
  }
}
```

---

### 4. Fill in Blank with Drag & Drop (`fill_in_blank_drag_drop`)

**Description:** Student drags words from a word bank into blank spaces.

**Content Structure:**
```json
{
  "template": "string (use ___ for blank placeholders)",
  "blanks": [
    {
      "position": "integer (1-based)",
      "accepted_answers": ["array of word_bank item IDs"],
      "hint": "string (optional)"
    }
  ],
  "word_bank": [
    {
      "id": "string (unique identifier)",
      "text": "string (displayed word/phrase)",
      "category": "string (optional, for color coding)"
    }
  ],
  "allow_reuse": "boolean (can same word be used multiple times?)"
}
```

**Generation Rules:**
- Each blank accepts word IDs (not text)
- Word bank must have MORE items than blanks (include distractors)
- Set `allow_reuse: false` for most cases
- Categories help organize word bank visually
- IDs should be short and meaningful (e.g., "op1", "verb1")
- Word bank should contain 3-5 distractor words

**Example:**
```json
{
  "question_type": "fill_in_blank_drag_drop",
  "question_text": "Complete the JavaScript conditional:",
  "content": {
    "template": "if (age ___ 18) ___ console.log('Adult');",
    "blanks": [
      {
        "position": 1,
        "accepted_answers": [">="],
        "hint": "comparison"
      },
      {
        "position": 2,
        "accepted_answers": ["{"],
        "hint": "opens block"
      }
    ],
    "word_bank": [
      {"id": ">=", "text": ">=", "category": "operator"},
      {"id": "<=", "text": "<=", "category": "operator"},
      {"id": "{", "text": "{", "category": "syntax"},
      {"id": "}", "text": "}", "category": "syntax"},
      {"id": "==", "text": "==", "category": "operator"},
      {"id": "(", "text": "(", "category": "syntax"}
    ],
    "allow_reuse": false
  }
}
```

---

### 5. Ordering (`ordering`)

**Description:** Student arranges items in correct sequential order.

**Content Structure:**
```json
{
  "items": [
    {
      "id": "string (unique, e.g., a, b, c)",
      "text": "string (item description)",
      "image": "string (optional, relative URL)"
    }
  ],
  "correct_order": ["array of item IDs in correct sequence"],
  "partial_credit_strategy": "string ('adjacent_pairs' | 'position_based' | 'all_or_nothing')",
  "media": { /* optional */ }
}
```

**Generation Rules:**
- Minimum 3 items, maximum 8 items recommended
- Items array should be in RANDOM order (system will shuffle)
- correct_order defines the exact sequence
- Use `adjacent_pairs` for lenient grading
- Perfect for: timelines, processes, steps, lifecycles
- Each item should be clear and distinct

**Example:**
```json
{
  "question_type": "ordering",
  "question_text": "Order the stages of software development:",
  "content": {
    "items": [
      {"id": "a", "text": "Requirements gathering"},
      {"id": "b", "text": "Design"},
      {"id": "c", "text": "Implementation"},
      {"id": "d", "text": "Testing"},
      {"id": "e", "text": "Deployment"}
    ],
    "correct_order": ["a", "b", "c", "d", "e"],
    "partial_credit_strategy": "adjacent_pairs"
  }
}
```

---

### 6. Matching (`matching`)

**Description:** Student matches items from two columns (pairs).

**Content Structure:**
```json
{
  "left_items": [
    {
      "id": "string (e.g., l1, l2)",
      "text": "string (left column item)",
      "image": "string (optional)"
    }
  ],
  "right_items": [
    {
      "id": "string (e.g., r1, r2)",
      "text": "string (right column item)",
      "audio": "string (optional, for sound matching)"
    }
  ],
  "correct_pairs": [
    {
      "left": "left item ID",
      "right": "right item ID"
    }
  ],
  "partial_credit_strategy": "string ('per_pair' | 'all_or_nothing')",
  "shuffle_items": "boolean"
}
```

**Generation Rules:**
- Equal number of left and right items (1:1 matching)
- Minimum 3 pairs, maximum 8 pairs
- Each item used exactly once
- Use `per_pair` for partial credit
- Perfect for: vocabulary, definitions, relationships
- Right items should be plausible matches for multiple left items

**Example:**
```json
{
  "question_type": "matching",
  "question_text": "Match programming terms to definitions:",
  "content": {
    "left_items": [
      {"id": "l1", "text": "Variable"},
      {"id": "l2", "text": "Function"},
      {"id": "l3", "text": "Loop"}
    ],
    "right_items": [
      {"id": "r1", "text": "Stores data"},
      {"id": "r2", "text": "Reusable code block"},
      {"id": "r3", "text": "Repeats instructions"}
    ],
    "correct_pairs": [
      {"left": "l1", "right": "r1"},
      {"left": "l2", "right": "r2"},
      {"left": "l3", "right": "r3"}
    ],
    "partial_credit_strategy": "per_pair",
    "shuffle_items": true
  }
}
```

---

### 7. Program Submission (`program_submission`)

**Description:** Student writes code that must pass test cases.

**Content Structure:**
```json
{
  "prompt": "string (clear instructions for coding task)",
  "starter_code": "string (template code with TODO comments)",
  "language": "string ('python' | 'javascript' | 'java' | 'cpp')",
  "test_cases": [
    {
      "input": "string (function call or test input)",
      "expected": "string (expected output)",
      "weight": "decimal (0.0-1.0, must sum to 1.0)",
      "visible": "boolean (show to student before submission?)",
      "description": "string (test case description)"
    }
  ],
  "time_limit_ms": "integer (execution timeout)",
  "memory_limit_mb": "integer (memory constraint)",
  "allowed_imports": ["array of allowed library imports"],
  "media": { /* optional tutorial/hint */ }
}
```

**Generation Rules:**
- Minimum 3 test cases, 5+ recommended
- At least 1 visible test case for students
- Test weights must sum to 1.0
- Include edge cases in hidden tests
- Starter code should have clear TODO markers
- Set reasonable time limits (1000ms typical)
- Specify allowed imports explicitly

**Example:**
```json
{
  "question_type": "program_submission",
  "question_text": "Write a function to check if a number is even:",
  "content": {
    "prompt": "Complete the function is_even(n) that returns True if n is even, False otherwise.",
    "starter_code": "def is_even(n):\n    # TODO: Write your code here\n    pass",
    "language": "python",
    "test_cases": [
      {
        "input": "is_even(4)",
        "expected": "True",
        "weight": 0.25,
        "visible": true,
        "description": "Even number"
      },
      {
        "input": "is_even(7)",
        "expected": "False",
        "weight": 0.25,
        "visible": true,
        "description": "Odd number"
      },
      {
        "input": "is_even(0)",
        "expected": "True",
        "weight": 0.25,
        "visible": false,
        "description": "Zero case"
      },
      {
        "input": "is_even(-4)",
        "expected": "True",
        "weight": 0.25,
        "visible": false,
        "description": "Negative even"
      }
    ],
    "time_limit_ms": 1000,
    "memory_limit_mb": 64,
    "allowed_imports": []
  }
}
```

---

### 8. Short Answer (`short_answer`)

**Description:** Student writes free-form text response (manual or keyword-based grading).

**Content Structure:**
```json
{
  "max_length": "integer (character limit, 50-2000)",
  "min_length": "integer (minimum characters required)",
  "keywords": [
    {
      "word": "string (keyword to detect)",
      "weight": "decimal (0.0-1.0, contribution to score)",
      "required": "boolean (must appear for passing)",
      "synonyms": ["array of alternative words"]
    }
  ],
  "min_score_threshold": "decimal (0.0-1.0, minimum to pass)",
  "rubric_description": "string (grading criteria for manual review)",
  "media": { /* optional reference material */ }
}
```

**Generation Rules:**
- Keyword weights should sum to ~1.0
- Mark essential keywords as `required: true`
- Provide 2-4 synonyms per keyword
- Set `min_score_threshold` to 0.5-0.7 typically
- Include rubric for human graders
- Max length 500 for younger ages, 1000+ for older

**Example:**
```json
{
  "question_type": "short_answer",
  "question_text": "Explain what a variable is in programming:",
  "content": {
    "max_length": 300,
    "min_length": 30,
    "keywords": [
      {
        "word": "store",
        "weight": 0.3,
        "required": true,
        "synonyms": ["hold", "contain", "keep"]
      },
      {
        "word": "data",
        "weight": 0.3,
        "required": true,
        "synonyms": ["information", "value", "content"]
      },
      {
        "word": "name",
        "weight": 0.2,
        "required": false,
        "synonyms": ["label", "identifier", "called"]
      },
      {
        "word": "change",
        "weight": 0.2,
        "required": false,
        "synonyms": ["modify", "update", "vary"]
      }
    ],
    "min_score_threshold": 0.6,
    "rubric_description": "Answer should mention that variables store data and have names. Bonus for mentioning mutability."
  }
}
```

---

## Media Object Structure (Optional for ALL Types)

```json
{
  "question_image": {
    "url": "string (relative path: /assets/folder/image.jpg)",
    "alt_text": "string (accessibility description)",
    "width": "integer (pixels)",
    "height": "integer (pixels)"
  },
  "question_audio": {
    "url": "string (relative path: /assets/audio/file.mp3)",
    "duration_seconds": "integer"
  },
  "hint_image": {
    "url": "string",
    "alt_text": "string",
    "width": "integer",
    "height": "integer"
  },
  "tutorial_video": {
    "url": "string (relative path: /assets/videos/tutorial.mp4)",
    "duration_seconds": "integer",
    "thumbnail": "string (relative path)"
  },
  "reference_image": {
    "url": "string",
    "alt_text": "string",
    "width": "integer",
    "height": "integer"
  }
}
```

---

## Subject Categories (Standardized)

Use these standard subject values:
- `mathematics`
- `science`
- `language_arts`
- `social_studies`
- `computer_science`
- `programming`
- `art`
- `music`
- `geography`
- `history`
- `physics`
- `chemistry`
- `biology`

---

## Difficulty Guidelines

**Easy:**
- Ages 5-8
- Simple concepts
- Direct questions
- Visual aids helpful
- 15-60 seconds

**Medium:**
- Ages 9-14
- Multi-step thinking
- Some background knowledge
- 60-180 seconds

**Hard:**
- Ages 12-18
- Complex reasoning
- Application of concepts
- Multiple skills combined
- 180-600 seconds

---

## Age-Appropriate Language

**Ages 5-7:**
- Very simple sentences (5-10 words)
- Concrete, familiar topics
- Lots of visual support
- Encourage read-aloud

**Ages 8-10:**
- Clear, simple language
- Mix concrete and abstract
- Some technical terms with context
- 10-20 word sentences

**Ages 11-14:**
- More complex vocabulary
- Multi-step instructions
- Abstract concepts OK
- Assume reading fluency

**Ages 15-18:**
- Full vocabulary range
- Technical terminology
- Complex scenarios
- Academic language appropriate

---

## LLM Generation Prompt Template

```
Generate a quiz question for the Kids Quiz System with the following parameters:

REQUIRED PARAMETERS:
- Question Type: [one of 8 types above]
- Subject: [from standard list]
- Age Range: [min-max, e.g., 10-13]
- Difficulty: [easy/medium/hard]
- Topic: [specific topic within subject]

OUTPUT FORMAT:
Provide valid JSON matching the exact structure documented above for the specified question type.

QUALITY REQUIREMENTS:
1. Age-appropriate language and complexity
2. Clear, unambiguous question text
3. Correct answer must be unquestionably right
4. Distractors should be plausible but clearly wrong
5. Educational value - tests understanding not memorization
6. Inclusive and culturally sensitive content
7. Follow all generation rules for the question type
8. Include helpful hints when appropriate
9. Set reasonable time estimates
10. Assign fair point values (10-25 typical range)

EXAMPLE REQUEST:
"Generate a multiple_choice_single question about photosynthesis for ages 10-13, medium difficulty, worth 15 points."

EXAMPLE OUTPUT:
[Provide complete JSON following the schema]
```

---

## Validation Checklist

Before submitting generated questions, verify:

- [ ] Valid UUID v4 format for question_id
- [ ] Question type is one of the 8 supported types
- [ ] age_max >= age_min
- [ ] difficulty is 'easy', 'medium', or 'hard'
- [ ] estimated_seconds is reasonable (15-600)
- [ ] points value is appropriate (1-100)
- [ ] Content structure matches type specification exactly
- [ ] All required fields are present
- [ ] No extra/unsupported fields in content
- [ ] Text is age-appropriate
- [ ] No sensitive/inappropriate content
- [ ] Correct answers are accurate
- [ ] Media URLs follow relative path convention
- [ ] Array lengths match expectations (e.g., blanks count)
- [ ] IDs are unique within the question
- [ ] JSON is valid and properly escaped

---

## Common Mistakes to Avoid

1. **Mismatched Templates:** Blank count doesn't match template `___` count
2. **Wrong ID References:** Referencing IDs that don't exist in options/word_bank
3. **Invalid UUIDs:** Using sequential numbers instead of UUID v4 format
4. **Age Inconsistency:** Content complexity doesn't match age range
5. **Missing Required Fields:** Omitting shuffle_options, partial_credit_strategy, etc.
6. **Incorrect Weights:** Test case weights don't sum to 1.0
7. **Ambiguous Answers:** Multiple "correct" answers when only one intended
8. **Poor Distractors:** Wrong answers that are too obviously wrong
9. **Absolute Paths:** Using absolute URLs instead of relative paths
10. **Escaped Quotes:** Forgetting to escape quotes in JSON strings

---

## SQL Insert Template

```sql
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
    '[UUID]',
    '[question_type]',
    '[question_text]',
    [age_min], [age_max],
    '[difficulty]',
    [estimated_seconds],
    '[subject]',
    '[locale]',
    [points],
    [allow_partial_credit],
    [supports_read_aloud],
    '[content_json]'::jsonb
);
```

---

## Batch Generation Guidelines

When generating multiple questions:

1. **Vary Question Types:** Mix different types for engagement
2. **Progressive Difficulty:** Start easy, increase complexity
3. **Unique IDs:** Generate fresh UUIDs for each question
4. **Topic Coverage:** Cover different aspects of the subject
5. **Balance Points:** Harder questions = more points
6. **Estimated Time:** Total should match quiz estimated_minutes
7. **Age Consistency:** All questions should fit age range
8. **Avoid Duplication:** No repeated content or similar questions

---

## Testing & Validation

After generating questions:

1. **JSON Validation:** Use online JSON validator
2. **Schema Check:** Verify all required fields present
3. **Answer Verification:** Manually confirm correct answers
4. **Age Test:** Have target age group review language
5. **Timing Test:** Measure actual completion time
6. **Distractor Quality:** Ensure plausible wrong answers
7. **Edge Cases:** Test boundary conditions (empty input, special chars)
8. **Accessibility:** Verify alt text, read-aloud compatibility

---

## Version Information

- **Document Version:** 1.0
- **Last Updated:** 2025-11-27
- **Compatible Schema Version:** 002-questions
- **Question Types Supported:** 8
- **Database:** PostgreSQL with JSONB

---

## Support & Updates

For questions or suggestions about this generation guide:
- Repository: Quizz-MCL
- Schema Files: `/SRC/DatabaseScripts/002_questions.sql`
- Seed Examples: `/SRC/DatabaseScripts/004_seed_data.sql`
- Frontend Components: `/SRC/quiz-app/src/components/QuestionTypes/`

---

**END OF GUIDE**
