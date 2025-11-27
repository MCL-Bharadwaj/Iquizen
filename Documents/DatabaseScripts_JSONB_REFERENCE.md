# Question Type JSONB Reference Guide

## Quick Reference for Question Content Structures

This document provides **complete JSONB structure templates** for all 7 question types.

---

## 1️⃣ Multiple Choice Single

**Type**: `multiple_choice_single`

### Required Fields
```json
{
  "options": [
    {"id": "a", "text": "Blue"},
    {"id": "b", "text": "Green"}
  ],
  "correct_answer": "a"
}
```

### Full Structure
```json
{
  "options": [
    {
      "id": "a",
      "text": "Blue",
      "image": "/assets/colors/blue.jpg"
    },
    {
      "id": "b",
      "text": "Green",
      "image": "/assets/colors/green.jpg"
    }
  ],
  "correct_answer": "a",
  "shuffle_options": true,
  "media": {
    "question_image": {
      "url": "/assets/sky.jpg",
      "alt_text": "Clear blue sky",
      "width": 800,
      "height": 600
    },
    "question_audio": {
      "url": "/assets/audio/question.mp3",
      "duration_seconds": 10
    }
  }
}
```

### Answer Payload
```json
{
  "selected_option": "a"
}
```

### Grading Details
```json
{
  "auto_graded": true,
  "feedback": "Great job! 🎉",
  "time_taken_seconds": 25
}
```

---

## 2️⃣ Multiple Choice Multi

**Type**: `multiple_choice_multi`

### Required Fields
```json
{
  "options": [
    {"id": "a", "text": "Apple"},
    {"id": "b", "text": "Banana"},
    {"id": "c", "text": "Carrot"}
  ],
  "correct_answers": ["a", "b"]
}
```

### Full Structure
```json
{
  "options": [
    {
      "id": "a",
      "text": "Apple",
      "image": "/assets/food/apple.jpg"
    },
    {
      "id": "b",
      "text": "Banana",
      "image": "/assets/food/banana.jpg"
    },
    {
      "id": "c",
      "text": "Carrot",
      "image": "/assets/food/carrot.jpg"
    }
  ],
  "correct_answers": ["a", "b"],
  "shuffle_options": true,
  "partial_credit_rule": "proportional",
  "media": {
    "question_image": {
      "url": "/assets/food/food-groups.jpg",
      "alt_text": "Various fruits and vegetables"
    }
  }
}
```

### Answer Payload
```json
{
  "selected_options": ["a", "b"]
}
```

### Grading Details
```json
{
  "auto_graded": true,
  "feedback": "Good effort! You got 2 out of 3 correct. ⭐",
  "correct_selections": 2,
  "total_correct": 3,
  "incorrect_selections": 0,
  "partial_credit_applied": true,
  "time_taken_seconds": 42
}
```

### Partial Credit Rules
- **proportional**: Score = (correct_selected / total_correct) * points
- **all_or_nothing**: Score = points if all correct, else 0
- **penalty**: Deduct points for incorrect selections

---

## 3️⃣ Fill in the Blank

**Type**: `fill_in_blank`

### Required Fields
```json
{
  "template": "The cat is ___ the mat.",
  "blanks": [
    {
      "position": 1,
      "accepted_answers": ["on", "upon"]
    }
  ]
}
```

### Full Structure
```json
{
  "template": "The cat is ___ the mat. It has ___ legs.",
  "blanks": [
    {
      "position": 1,
      "accepted_answers": ["on", "upon", "sitting on"],
      "case_sensitive": false,
      "hint": "Where is the cat?",
      "regex_pattern": "^(on|upon)$"
    },
    {
      "position": 2,
      "accepted_answers": ["four", "4"],
      "case_sensitive": false,
      "hint": "Count the legs"
    }
  ],
  "media": {
    "hint_image": {
      "url": "/assets/animals/cat-on-mat.jpg",
      "alt_text": "Cat sitting on a colorful mat"
    }
  }
}
```

### Answer Payload
```json
{
  "blanks": [
    {"position": 1, "answer": "on"},
    {"position": 2, "answer": "four"}
  ]
}
```

### Grading Details
```json
{
  "auto_graded": true,
  "feedback": "Almost there! 2 out of 3 blanks correct. 💪",
  "blank_results": [
    {
      "position": 1,
      "correct": true,
      "submitted": "on",
      "accepted": ["on", "upon", "sitting on"]
    },
    {
      "position": 2,
      "correct": false,
      "submitted": "two",
      "accepted": ["four", "4"]
    }
  ],
  "partial_credit_applied": true
}
```

---

## 4️⃣ Ordering

**Type**: `ordering`

### Required Fields
```json
{
  "items": [
    {"id": "a", "text": "Step 1"},
    {"id": "b", "text": "Step 2"}
  ],
  "correct_order": ["a", "b"]
}
```

### Full Structure
```json
{
  "items": [
    {
      "id": "a",
      "text": "Plant seed",
      "image": "/assets/plants/seed.jpg"
    },
    {
      "id": "b",
      "text": "Water plant",
      "image": "/assets/plants/water.jpg"
    },
    {
      "id": "c",
      "text": "Harvest crop",
      "image": "/assets/plants/harvest.jpg"
    }
  ],
  "correct_order": ["a", "b", "c"],
  "partial_credit_strategy": "adjacent_pairs",
  "media": {
    "tutorial_video": {
      "url": "/assets/videos/plant-lifecycle.mp4",
      "duration_seconds": 45,
      "thumbnail": "/assets/videos/thumb.jpg"
    }
  }
}
```

### Answer Payload
```json
{
  "order": ["a", "b", "c"]
}
```

### Grading Details
```json
{
  "auto_graded": true,
  "feedback": "Good job! 2 out of 3 pairs correct.",
  "correct_positions": 2,
  "total_positions": 3,
  "adjacent_pairs_correct": 2,
  "partial_credit_applied": true
}
```

### Partial Credit Strategies
- **adjacent_pairs**: Score based on correct adjacent pairs
- **position_accuracy**: Score based on distance from correct position
- **all_or_nothing**: Full points only if completely correct

---

## 5️⃣ Matching

**Type**: `matching`

### Required Fields
```json
{
  "left_items": [
    {"id": "l1", "text": "Dog"}
  ],
  "right_items": [
    {"id": "r1", "text": "Bark"}
  ],
  "correct_pairs": [
    {"left": "l1", "right": "r1"}
  ]
}
```

### Full Structure
```json
{
  "left_items": [
    {
      "id": "l1",
      "text": "Dog",
      "image": "/assets/animals/dog.jpg"
    },
    {
      "id": "l2",
      "text": "Cat",
      "image": "/assets/animals/cat.jpg"
    }
  ],
  "right_items": [
    {
      "id": "r1",
      "text": "Bark",
      "audio": "/assets/sounds/bark.mp3"
    },
    {
      "id": "r2",
      "text": "Meow",
      "audio": "/assets/sounds/meow.mp3"
    }
  ],
  "correct_pairs": [
    {"left": "l1", "right": "r1"},
    {"left": "l2", "right": "r2"}
  ],
  "partial_credit_strategy": "per_pair",
  "shuffle_items": true
}
```

### Answer Payload
```json
{
  "pairs": [
    {"left": "l1", "right": "r1"},
    {"left": "l2", "right": "r2"}
  ]
}
```

### Grading Details
```json
{
  "auto_graded": true,
  "feedback": "3 out of 4 pairs correct! ⭐",
  "correct_pairs": 3,
  "total_pairs": 4,
  "pair_results": [
    {"left": "l1", "right": "r1", "correct": true},
    {"left": "l2", "right": "r2", "correct": true}
  ],
  "partial_credit_applied": true
}
```

---

## 6️⃣ Program Submission

**Type**: `program_submission`

### Required Fields
```json
{
  "prompt": "Write a function that adds two numbers",
  "language": "python",
  "test_cases": [
    {
      "input": "add(2, 3)",
      "expected": "5",
      "weight": 1.0,
      "visible": true
    }
  ]
}
```

### Full Structure
```json
{
  "prompt": "Write a function that adds two numbers together",
  "starter_code": "def add_numbers(a, b):\n    # Write your code here\n    pass",
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
      "description": "Adding negative"
    },
    {
      "input": "add_numbers(100, 200)",
      "expected": "300",
      "weight": 0.2,
      "visible": false,
      "description": "Large numbers"
    }
  ],
  "time_limit_ms": 1000,
  "memory_limit_mb": 64,
  "allowed_imports": ["math"],
  "forbidden_keywords": ["eval", "exec"],
  "media": {
    "tutorial_video": {
      "url": "/assets/videos/python-functions.mp4",
      "duration_seconds": 120,
      "thumbnail": "/assets/videos/thumb.jpg"
    }
  }
}
```

### Answer Payload
```json
{
  "code": "def add_numbers(a, b):\n    return a + b"
}
```

### Grading Details
```json
{
  "auto_graded": true,
  "feedback": "Great work! All test cases passed. 🎉",
  "total_tests": 5,
  "passed_tests": 5,
  "failed_tests": 0,
  "test_results": [
    {
      "test_number": 1,
      "input": "add_numbers(2, 3)",
      "expected": "5",
      "actual": "5",
      "passed": true,
      "weight": 0.2,
      "execution_time_ms": 12
    },
    {
      "test_number": 2,
      "input": "add_numbers(-1, 1)",
      "expected": "0",
      "actual": "0",
      "passed": true,
      "weight": 0.2,
      "execution_time_ms": 8
    }
  ],
  "syntax_errors": [],
  "runtime_errors": [],
  "total_execution_time_ms": 45
}
```

### Supported Languages
- `python` (Python 3.x)
- `javascript` (Node.js)
- `sql` (PostgreSQL)
- Future: `java`, `csharp`, `typescript`

---

## 7️⃣ Short Answer

**Type**: `short_answer`

### Required Fields
```json
{
  "keywords": [
    {
      "word": "sunlight",
      "weight": 0.5,
      "required": true
    }
  ]
}
```

### Full Structure
```json
{
  "max_length": 500,
  "min_length": 50,
  "keywords": [
    {
      "word": "photosynthesis",
      "weight": 0.25,
      "required": false,
      "synonyms": ["photo synthesis"]
    },
    {
      "word": "sunlight",
      "weight": 0.25,
      "required": true,
      "synonyms": ["sun", "light", "solar"]
    },
    {
      "word": "water",
      "weight": 0.15,
      "required": true,
      "synonyms": ["h2o"]
    },
    {
      "word": "carbon dioxide",
      "weight": 0.15,
      "required": false,
      "synonyms": ["co2", "carbon"]
    },
    {
      "word": "oxygen",
      "weight": 0.1,
      "required": false,
      "synonyms": ["o2"]
    },
    {
      "word": "glucose",
      "weight": 0.1,
      "required": false,
      "synonyms": ["sugar", "food", "energy"]
    }
  ],
  "min_score_threshold": 0.5,
  "rubric_description": "Answer should mention sunlight, water, and the process of making food.",
  "media": {
    "reference_image": {
      "url": "/assets/science/photosynthesis-diagram.jpg",
      "alt_text": "Diagram showing photosynthesis process"
    }
  }
}
```

### Answer Payload
```json
{
  "text": "Plants use sunlight, water, and carbon dioxide to make their own food through photosynthesis. They produce oxygen as a byproduct."
}
```

### Grading Details
```json
{
  "auto_graded": true,
  "feedback": "Excellent answer! You covered all key concepts. 🎉",
  "keyword_matches": [
    {
      "keyword": "photosynthesis",
      "found": true,
      "matched_text": "photosynthesis",
      "weight": 0.25,
      "points_earned": 0.25
    },
    {
      "keyword": "sunlight",
      "found": true,
      "matched_text": "sunlight",
      "weight": 0.25,
      "points_earned": 0.25
    },
    {
      "keyword": "water",
      "found": true,
      "matched_text": "water",
      "weight": 0.15,
      "points_earned": 0.15
    }
  ],
  "total_keyword_score": 0.85,
  "required_keywords_found": true,
  "word_count": 23,
  "character_count": 142,
  "manual_review_needed": false
}
```

### Scoring Strategies
- **Keyword Matching**: Sum weights of found keywords
- **Semantic Similarity**: Use AI/ML for concept matching (optional)
- **Rubric-based**: Manual review with suggested score
- **Hybrid**: Auto-score + manual review flag

---

## 📋 Media Object Structure

### Image
```json
{
  "url": "/assets/images/photo.jpg",
  "alt_text": "Description for screen readers",
  "width": 800,
  "height": 600,
  "thumbnail": "/assets/images/photo-thumb.jpg"
}
```

### Audio
```json
{
  "url": "/assets/audio/sound.mp3",
  "duration_seconds": 15,
  "transcript": "Audio transcript for accessibility"
}
```

### Video
```json
{
  "url": "/assets/videos/tutorial.mp4",
  "duration_seconds": 120,
  "thumbnail": "/assets/videos/thumb.jpg",
  "captions": "/assets/videos/captions.vtt",
  "width": 1280,
  "height": 720
}
```

---

## 🔍 Validation Queries

### Validate Multiple Choice Single
```sql
SELECT 
    question_id,
    question_text,
    validate_mc_single_content(content) as is_valid
FROM questions
WHERE question_type = 'multiple_choice_single';
```

### Find Questions Missing Media
```sql
SELECT question_id, question_text
FROM questions
WHERE content->'media' IS NULL;
```

### Count Options per Question
```sql
SELECT 
    question_id,
    question_text,
    jsonb_array_length(content->'options') as option_count
FROM questions
WHERE question_type IN ('multiple_choice_single', 'multiple_choice_multi');
```

---

## 📚 Additional Resources

- See `001_core_schema.sql` for table definitions
- See `002_indexes_constraints.sql` for validation functions
- See `003_seed_data.sql` for complete examples

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-08
