# Script to update all SQL files to use quiz schema
$files = @(
    "002_questions.sql",
    "003_quiz_questions.sql",
    "004_attempts.sql",
    "005_responses.sql",
    "006_content.sql",
    "007_audit_log.sql",
    "008_api_keys.sql"
)

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    Write-Host "Updating $file..." -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    
    # Replace CREATE TABLE statements
    $content = $content -replace 'CREATE TABLE IF NOT EXISTS ([a-z_]+)', 'CREATE TABLE IF NOT EXISTS quiz.$1'
    
    # Replace table references in triggers
    $content = $content -replace 'BEFORE UPDATE ON ([a-z_]+)', 'BEFORE UPDATE ON quiz.$1'
    $content = $content -replace 'BEFORE INSERT ON ([a-z_]+)', 'BEFORE INSERT ON quiz.$1'
    $content = $content -replace 'AFTER INSERT ON ([a-z_]+)', 'AFTER INSERT ON quiz.$1'
    $content = $content -replace 'AFTER UPDATE ON ([a-z_]+)', 'AFTER UPDATE ON quiz.$1'
    
    # Replace table references in indexes
    $content = $content -replace 'CREATE INDEX ([A-Z_\s]+)?ON ([a-z_]+)', 'CREATE INDEX $1ON quiz.$2'
    
    # Replace table references in ALTER TABLE
    $content = $content -replace 'ALTER TABLE IF EXISTS ([a-z_]+)', 'ALTER TABLE quiz.$1'
    $content = $content -replace 'ALTER TABLE ([a-z_]+)', 'ALTER TABLE quiz.$1'
    
    # Replace REFERENCES in foreign keys
    $content = $content -replace 'REFERENCES ([a-z_]+)\(', 'REFERENCES quiz.$1('
    
    # Replace FROM schema_versions
    $content = $content -replace 'FROM schema_versions', 'FROM quiz.schema_versions'
    
    # Replace INSERT INTO for non-schema tables
    $content = $content -replace 'INSERT INTO ([a-z_]+) \(', 'INSERT INTO quiz.$1 ('
    
    # Fix double quiz. prefixes
    $content = $content -replace 'quiz\.quiz\.', 'quiz.'
    
    Set-Content $filePath $content -NoNewline
    Write-Host "Updated $file" -ForegroundColor Green
}

Write-Host "`nAll files updated successfully!" -ForegroundColor Green
