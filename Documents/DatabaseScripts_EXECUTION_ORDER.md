# Database Migration Scripts - Execution Order

## Overview
Database scripts should be executed in numerical order. Each script is designed to be idempotent where possible.

## Migration Scripts (Ordered Sequence)

### Core Setup
- **000_migration_setup.sql** - Initialize migration tracking system

### Quiz System Tables
- **001_quizzes.sql** - Create quizzes table
- **002_questions.sql** - Create questions table
- **003_quiz_questions.sql** - Create quiz_questions junction table
- **004_seed_data.sql** - Insert seed data for quizzes and questions

### Quiz Attempts and Responses
- **005_attempts.sql** - Create attempts table (tracks quiz attempts)
- **006_responses.sql** - Create responses table (stores user answers)
- **007_content.sql** - Create content table
- **008_audit_log.sql** - Create audit_log table for tracking changes

### Quiz Enhancements
- **009_quiz_assignments.sql** - Create quiz_assignments table
- **010_add_score_percentage.sql** - Add score_percentage column to attempts
- **011_grade_existing_responses.sql** - Backfill grading for existing responses

### User Management & RBAC (New LMS-based structure)
- **012_create_roles.sql** - Create roles table in `lms` schema with default roles (Administrator, Tutor, Student, Parent, Content Creator)
- **013_create_users_table.sql** - Create comprehensive users table in `lms` schema with:
  - Full profile fields (first_name, middle_name, last_name)
  - Contact info (email, phone)
  - Personal details (date_of_birth, gender)
  - Address fields (address1, address2, city, state, country, postal_code)
  - Profile picture URL
  - Account status (is_active, is_verified, last_login)
  - Audit fields (created_at, updated_at)
  - Sample data for 24 student users
  
- **014_create_user_roles_table.sql** - Create user_roles junction table in `lms` schema for RBAC:
  - Many-to-many relationship between users and roles
  - Audit trail (assigned_by, assigned_at)
  - Prevents duplicate role assignments
  - Supports role activation/deactivation
  
- **015_create_students_table.sql** - Create students extension table in `lms` schema:
  - Links to lms.users table via user_id
  - Student-specific fields (student_number, enrollment_date, grade_level)
  - Emergency contact information
  - Special needs and learning preferences
  - Sample data for 24 students matching users table

## Schema Information
- **Quiz Tables Schema**: `quiz` (quizzes, questions, attempts, responses, etc.)
- **User Management Schema**: `lms` (users, roles, user_roles, students)
- **Primary Key Type**: UUID with `gen_random_uuid()`
- **Timestamp Type**: `TIMESTAMP WITH TIME ZONE`
- **Soft Deletes**: Most tables support logical deletion

## Execution Instructions

### First-Time Setup
```bash
# Execute scripts in order
psql -U your_user -d your_database -f 000_migration_setup.sql
psql -U your_user -d your_database -f 001_quizzes.sql
# ... continue through 015_create_students_table.sql
```

### Update Existing Database
```bash
# Only run scripts that haven't been executed yet
# The migration_versions table tracks which scripts have been applied
```

## Dependencies
- PostgreSQL 12+ (for `gen_random_uuid()` support)
- `quiz` schema must exist for quiz-related tables
- `lms` schema must exist for user management tables
- Proper permissions for CREATE TABLE, CREATE INDEX, etc.

## Obsolete Files (Moved to DeleteMe/)
- `011_users_and_auth.sql` - Replaced by 013_create_users_table.sql
- `012_enhance_users_and_roles.sql` - Split into 012_create_roles.sql and 014_create_user_roles_table.sql
- `01_python_conditions_quiz.sql` - Sample quiz data, moved to archive

## Notes
1. Scripts 013-015 represent the new comprehensive user management system from the LMS project
2. All foreign keys use CASCADE DELETE for proper cleanup
3. Indexes are created for common query patterns
4. All tables include audit timestamps (created_at, updated_at)
5. The roles table comes before users because user_roles references both
