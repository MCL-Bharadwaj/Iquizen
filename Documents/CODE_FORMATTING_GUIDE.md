# Code Formatting Guide for Quiz Questions

## Overview
The quiz application now supports **automatic code formatting** for questions that contain code snippets. This makes programming questions more readable and professional.

## How to Format Questions with Code

### 1. Inline Code (Single Backticks)
Use single backticks for short code snippets within text:

**Example:**
```
What does the `print()` function do in Python?
```

**Result:** The word `print()` will be displayed with a gray/blue background.

---

### 2. Code Blocks (Triple Backticks)
Use triple backticks for multi-line code snippets:

**Example:**
```
What will this code print? ```print("Score:", 10)```
```

**Better formatted example:**
```
What will this code print?

```python
print("Score:", 10)
```
(end of code block - close with ```)
```

**Result:** The code will be displayed in a formatted code block with:
- Monospace font
- Dark/light theme-aware background
- Proper indentation
- Horizontal scroll for long lines

---

## Examples for Common Question Types

### Example 1: Simple Output Question
**Question Text:**
```
What will this code print?

```python
print("Score:", 10)
```
```

**Options:**
- Score:10
- Score: 10
- Score 10
- 10 Score

---

### Example 2: Code Analysis Question
**Question Text:**
```
What is the output of this code?

```python
x = 5
y = 10
print(x + y)
```
```

**Options:**
- 5
- 10
- 15
- 510

---

### Example 3: Code Completion Question
**Question Text:**
```
Complete the code to print "Hello World":

```python
message = "Hello World"
print(___)
```

What should replace the blank?
```

**Options:**
- message
- "message"
- Hello World
- $message

---

### Example 4: Error Detection Question
**Question Text:**
```
Which line has an error?

```python
x = 10
y = 20
print(x + y
z = 30
```
```

**Options:**
- Line 1
- Line 2
- Line 3 (missing closing parenthesis)
- Line 4

---

## Formatting Guidelines

### ✅ DO:
- Use triple backticks for code blocks
- Add language identifier after opening backticks (e.g., ```python)
- Keep code properly indented
- Use blank lines before/after code blocks for readability
- Use inline backticks for function names, variables, keywords

### ❌ DON'T:
- Mix different code formatting styles in the same question
- Forget to close code blocks with ```
- Use excessive line breaks within code blocks
- Use special characters that might break formatting

---

## Supported Languages

The code formatter works with any programming language. Common ones include:

- `python` - Python code
- `javascript` - JavaScript code
- `java` - Java code
- `csharp` or `cs` - C# code
- `cpp` or `c++` - C++ code
- `sql` - SQL queries
- `html` - HTML markup
- `css` - CSS styles
- `bash` or `shell` - Shell commands

---

## How It Works

The application automatically:
1. **Detects** code patterns using backticks
2. **Formats** them with proper styling
3. **Applies** theme-aware colors (dark/light mode)
4. **Preserves** original spacing and indentation

---

## Testing Your Questions

1. Create a question with code formatting
2. Preview it in the quiz interface
3. Check both **light** and **dark** themes
4. Verify code is readable on mobile devices

---

## Database Storage

Questions are stored as plain text with markdown-style backticks:

```sql
INSERT INTO quiz.questions (question_text, ...) VALUES (
  'What will this code print?

```python
print("Score:", 10)
```',
  ...
);
```

The formatting is applied automatically when displaying the question.

---

## Need Help?

If code formatting isn't working:
1. Check that backticks are properly placed
2. Ensure code blocks are closed
3. Verify no special characters are breaking the markdown
4. Test in both dark and light themes

---

## Examples in Database

Here are some ready-to-use question texts:

```sql
-- Example 1: Print statement
'What will this code print? ```print("Score:", 10)```'

-- Example 2: Variable assignment
'What is stored in variable `x`?

```python
x = 5 + 3
```'

-- Example 3: Function call
'Which function is used to display output? The `___()` function.'
```
