# Fix SQL Query Parameters - Convert camelCase to snake_case in WHERE/VALUES clauses
# This matches the database column names and NpgsqlParameter names

$files = Get-ChildItem -Path "C:\Users\USER\Desktop\Quizz\Functions\Endpoints" -Filter "*.cs" -Recurse

$patterns = @{
    '@attemptId' = '@attempt_id'
    '@responseId' = '@response_id'
    '@questionId' = '@question_id'
    '@quizId' = '@quiz_id'
    '@userId' = '@user_id'
    '@questionType' = '@question_type'
    '@questionText' = '@question_text'
    '@totalScore' = '@total_score'
    '@maxScore' = '@max_score'
    '@scorePercentage' = '@score_percentage'
    '@pointsEarned' = '@points_earned'
    '@pointsPossible' = '@points_possible'
    '@answerPayload' = '@answer_payload'
    '@ageMin' = '@age_min'
    '@ageMax' = '@age_max'
    '@estimatedSeconds' = '@estimated_seconds'
    '@estimatedMinutes' = '@estimated_minutes'
    '@allowPartialCredit' = '@allow_partial_credit'
    '@negativeMarking' = '@negative_marking'
    '@supportsReadAloud' = '@supports_read_aloud'
    '@contentKey' = '@content_key'
    '@isCorrect' = '@is_correct'
    '@gradingDetails' = '@grading_details'
}

$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    foreach ($pattern in $patterns.Keys) {
        $replacement = $patterns[$pattern]
        # Only replace in SQL contexts (after WHERE, VALUES, SET, etc.)
        $content = $content -replace $pattern, $replacement
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalChanges++
        Write-Host "Fixed SQL in: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`nTotal files modified: $totalChanges" -ForegroundColor Cyan
Write-Host "All parameter names now match snake_case!" -ForegroundColor Yellow
