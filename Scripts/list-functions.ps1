# Script to add token validation to all endpoints
$files = @(
    'C:\CodeRepos\IQuizen\SRC\FunctionApp\HTTP\Quiz\QuizReadFunctions.cs',
    'C:\CodeRepos\IQuizen\SRC\FunctionApp\HTTP\Quiz\QuizWriteFunctions.cs',
    'C:\CodeRepos\IQuizen\SRC\FunctionApp\HTTP\Question\QuestionReadFunctions.cs',
    'C:\CodeRepos\IQuizen\SRC\FunctionApp\HTTP\Question\QuestionWriteFunctions.cs',
    'C:\CodeRepos\IQuizen\SRC\FunctionApp\HTTP\Attempt\AttemptFunctions.cs',
    'C:\CodeRepos\IQuizen\SRC\FunctionApp\HTTP\Response\ResponseFunctions.cs',
    'C:\CodeRepos\IQuizen\SRC\FunctionApp\HTTP\Content\ContentFunctions.cs',
    'C:\CodeRepos\IQuizen\SRC\FunctionApp\HTTP\Player\PlayerEndpoints.cs'
)

foreach ($file in $files) {
    Write-Host "
=== $file ===" -ForegroundColor Cyan
    if (Test-Path $file) {
        Select-String -Path $file -Pattern '\[Function\(' | ForEach-Object {
            Write-Host $_.Line
        }
    }
}
