# Script to update all C# SQL queries to use quiz schema
$files = @(
    "DataAccess\DbService.cs",
    "Auth\ApiKeyService.cs",
    "Functions\Endpoints\Quiz\QuizReadFunctions.cs"
)

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot "..\$file"
    Write-Host "Updating $file..." -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    
    # Replace FROM table references in SQL
    $content = $content -replace 'FROM quizzes(\s)', 'FROM quiz.quizzes$1'
    $content = $content -replace 'FROM questions(\s)', 'FROM quiz.questions$1'
    $content = $content -replace 'FROM api_keys(\s)', 'FROM quiz.api_keys$1'
    $content = $content -replace 'FROM attempts(\s)', 'FROM quiz.attempts$1'
    $content = $content -replace 'FROM responses(\s)', 'FROM quiz.responses$1'
    $content = $content -replace 'FROM quiz_questions(\s)', 'FROM quiz.quiz_questions$1'
    $content = $content -replace 'FROM content(\s)', 'FROM quiz.content$1'
    $content = $content -replace 'FROM audit_log(\s)', 'FROM quiz.audit_log$1'
    $content = $content -replace 'FROM api_key_audit(\s)', 'FROM quiz.api_key_audit$1'
    
    # Replace JOIN table references
    $content = $content -replace 'JOIN quizzes(\s)', 'JOIN quiz.quizzes$1'
    $content = $content -replace 'JOIN questions(\s)', 'JOIN quiz.questions$1'
    $content = $content -replace 'JOIN quiz_questions(\s)', 'JOIN quiz.quiz_questions$1'
    $content = $content -replace 'JOIN attempts(\s)', 'JOIN quiz.attempts$1'
    $content = $content -replace 'JOIN responses(\s)', 'JOIN quiz.responses$1'
    
    # Replace INSERT INTO
    $content = $content -replace 'INSERT INTO quizzes(\s)', 'INSERT INTO quiz.quizzes$1'
    $content = $content -replace 'INSERT INTO questions(\s)', 'INSERT INTO quiz.questions$1'
    $content = $content -replace 'INSERT INTO api_keys(\s)', 'INSERT INTO quiz.api_keys$1'
    $content = $content -replace 'INSERT INTO attempts(\s)', 'INSERT INTO quiz.attempts$1'
    $content = $content -replace 'INSERT INTO responses(\s)', 'INSERT INTO quiz.responses$1'
    $content = $content -replace 'INSERT INTO quiz_questions(\s)', 'INSERT INTO quiz.quiz_questions$1'
    $content = $content -replace 'INSERT INTO audit_log(\s)', 'INSERT INTO quiz.audit_log$1'
    $content = $content -replace 'INSERT INTO api_key_audit(\s)', 'INSERT INTO quiz.api_key_audit$1'
    
    # Replace UPDATE
    $content = $content -replace 'UPDATE quizzes(\s)', 'UPDATE quiz.quizzes$1'
    $content = $content -replace 'UPDATE questions(\s)', 'UPDATE quiz.questions$1'
    $content = $content -replace 'UPDATE api_keys(\s)', 'UPDATE quiz.api_keys$1'
    $content = $content -replace 'UPDATE attempts(\s)', 'UPDATE quiz.attempts$1'
    $content = $content -replace 'UPDATE responses(\s)', 'UPDATE quiz.responses$1'
    
    # Replace DELETE FROM
    $content = $content -replace 'DELETE FROM quizzes(\s)', 'DELETE FROM quiz.quizzes$1'
    $content = $content -replace 'DELETE FROM questions(\s)', 'DELETE FROM quiz.questions$1'
    
    # Fix double quiz. prefixes
    $content = $content -replace 'quiz\.quiz\.', 'quiz.'
    
    Set-Content $filePath $content -NoNewline
    Write-Host "Updated $file" -ForegroundColor Green
}

Write-Host "`nAll C# files updated successfully!" -ForegroundColor Green
