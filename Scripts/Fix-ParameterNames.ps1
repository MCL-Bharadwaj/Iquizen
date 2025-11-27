# Fix Npgsql Parameter Names - Remove @ prefix from parameter constructor
# The @ symbol should only be in the SQL query, not in the NpgsqlParameter constructor

$files = Get-ChildItem -Path "C:\Users\USER\Desktop\Quizz\Functions\Endpoints" -Filter "*.cs" -Recurse

$patterns = @{
    # Attempt parameters
    'new NpgsqlParameter\("@attemptId"' = 'new NpgsqlParameter("attempt_id"'
    'new NpgsqlParameter\("@attempt_id"' = 'new NpgsqlParameter("attempt_id"'
    
    # Response parameters
    'new NpgsqlParameter\("@responseId"' = 'new NpgsqlParameter("response_id"'
    'new NpgsqlParameter\("@response_id"' = 'new NpgsqlParameter("response_id"'
    
    # Question parameters
    'new NpgsqlParameter\("@questionId"' = 'new NpgsqlParameter("question_id"'
    'new NpgsqlParameter\("@question_id"' = 'new NpgsqlParameter("question_id"'
    'new NpgsqlParameter\("@questionType"' = 'new NpgsqlParameter("question_type"'
    'new NpgsqlParameter\("@questionText"' = 'new NpgsqlParameter("question_text"'
    
    # Quiz parameters
    'new NpgsqlParameter\("@quizId"' = 'new NpgsqlParameter("quiz_id"'
    'new NpgsqlParameter\("@quiz_id"' = 'new NpgsqlParameter("quiz_id"'
    
    # User parameters
    'new NpgsqlParameter\("@userId"' = 'new NpgsqlParameter("user_id"'
    'new NpgsqlParameter\("@user_id"' = 'new NpgsqlParameter("user_id"'
    
    # Score parameters
    'new NpgsqlParameter\("@totalScore"' = 'new NpgsqlParameter("total_score"'
    'new NpgsqlParameter\("@total_score"' = 'new NpgsqlParameter("total_score"'
    'new NpgsqlParameter\("@maxScore"' = 'new NpgsqlParameter("max_score"'
    'new NpgsqlParameter\("@max_possible_score"' = 'new NpgsqlParameter("max_possible_score"'
    'new NpgsqlParameter\("@scorePercentage"' = 'new NpgsqlParameter("score_percentage"'
    'new NpgsqlParameter\("@score_percentage"' = 'new NpgsqlParameter("score_percentage"'
    'new NpgsqlParameter\("@pointsEarned"' = 'new NpgsqlParameter("points_earned"'
    'new NpgsqlParameter\("@pointsPossible"' = 'new NpgsqlParameter("points_possible"'
    
    # Other common parameters
    'new NpgsqlParameter\("@answerPayload"' = 'new NpgsqlParameter("answer_payload"'
    'new NpgsqlParameter\("@ageMin"' = 'new NpgsqlParameter("age_min"'
    'new NpgsqlParameter\("@ageMax"' = 'new NpgsqlParameter("age_max"'
    'new NpgsqlParameter\("@difficulty"' = 'new NpgsqlParameter("difficulty"'
    'new NpgsqlParameter\("@estimatedSeconds"' = 'new NpgsqlParameter("estimated_seconds"'
    'new NpgsqlParameter\("@estimatedMinutes"' = 'new NpgsqlParameter("estimated_minutes"'
    'new NpgsqlParameter\("@subject"' = 'new NpgsqlParameter("subject"'
    'new NpgsqlParameter\("@locale"' = 'new NpgsqlParameter("locale"'
    'new NpgsqlParameter\("@points"' = 'new NpgsqlParameter("points"'
    'new NpgsqlParameter\("@allowPartialCredit"' = 'new NpgsqlParameter("allow_partial_credit"'
    'new NpgsqlParameter\("@negativeMarking"' = 'new NpgsqlParameter("negative_marking"'
    'new NpgsqlParameter\("@supportsReadAloud"' = 'new NpgsqlParameter("supports_read_aloud"'
    'new NpgsqlParameter\("@content"' = 'new NpgsqlParameter("content"'
    'new NpgsqlParameter\("@version"' = 'new NpgsqlParameter("version"'
    'new NpgsqlParameter\("@limit"' = 'new NpgsqlParameter("limit"'
    'new NpgsqlParameter\("@offset"' = 'new NpgsqlParameter("offset"'
    'new NpgsqlParameter\("@metadata"' = 'new NpgsqlParameter("metadata"'
    'new NpgsqlParameter\("@title"' = 'new NpgsqlParameter("title"'
    'new NpgsqlParameter\("@description"' = 'new NpgsqlParameter("description"'
    'new NpgsqlParameter\("@tags"' = 'new NpgsqlParameter("tags"'
    'new NpgsqlParameter\("@contentKey"' = 'new NpgsqlParameter("content_key"'
    'new NpgsqlParameter\("@translations"' = 'new NpgsqlParameter("translations"'
    'new NpgsqlParameter\("@key"' = 'new NpgsqlParameter("key"'
    'new NpgsqlParameter\("@isCorrect"' = 'new NpgsqlParameter("is_correct"'
    'new NpgsqlParameter\("@gradingDetails"' = 'new NpgsqlParameter("grading_details"'
}

$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    foreach ($pattern in $patterns.Keys) {
        $replacement = $patterns[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $changesInFile = ($originalContent.Length - $content.Length) / 20  # Rough estimate
        $totalChanges++
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`nTotal files modified: $totalChanges" -ForegroundColor Cyan
Write-Host "Please rebuild the project!" -ForegroundColor Yellow
