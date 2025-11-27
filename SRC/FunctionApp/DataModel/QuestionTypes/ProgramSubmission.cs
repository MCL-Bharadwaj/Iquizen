using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.QuestionTypes;

/// <summary>
/// Program submission - code challenges with test cases
/// </summary>
public class ProgramSubmissionContent
{
    [JsonPropertyName("prompt")]
    public string Prompt { get; set; } = string.Empty;

    [JsonPropertyName("starterCode")]
    public string? StarterCode { get; set; }

    [JsonPropertyName("language")]
    public string Language { get; set; } = "python";

    [JsonPropertyName("testCases")]
    public List<TestCase> TestCases { get; set; } = new();

    [JsonPropertyName("timeLimitMs")]
    public int TimeLimitMs { get; set; } = 1000;

    [JsonPropertyName("memoryLimitMb")]
    public int MemoryLimitMb { get; set; } = 64;

    [JsonPropertyName("allowedImports")]
    public List<string>? AllowedImports { get; set; }

    [JsonPropertyName("forbiddenKeywords")]
    public List<string>? ForbiddenKeywords { get; set; }

    [JsonPropertyName("media")]
    public QuestionMedia? Media { get; set; }
}

/// <summary>
/// Test case definition
/// </summary>
public class TestCase
{
    [JsonPropertyName("input")]
    public string Input { get; set; } = string.Empty;

    [JsonPropertyName("expected")]
    public string Expected { get; set; } = string.Empty;

    [JsonPropertyName("weight")]
    public decimal Weight { get; set; } = 1.0m;

    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

/// <summary>
/// Answer payload for program submission
/// </summary>
public class ProgramSubmissionAnswer
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;
}

/// <summary>
/// Grading details for program submission
/// </summary>
public class ProgramSubmissionGrading
{
    [JsonPropertyName("autoGraded")]
    public bool AutoGraded { get; set; } = true;

    [JsonPropertyName("feedback")]
    public string? Feedback { get; set; }

    [JsonPropertyName("totalTests")]
    public int TotalTests { get; set; }

    [JsonPropertyName("passedTests")]
    public int PassedTests { get; set; }

    [JsonPropertyName("failedTests")]
    public int FailedTests { get; set; }

    [JsonPropertyName("testResults")]
    public List<TestResult> TestResults { get; set; } = new();

    [JsonPropertyName("syntaxErrors")]
    public List<string> SyntaxErrors { get; set; } = new();

    [JsonPropertyName("runtimeErrors")]
    public List<string> RuntimeErrors { get; set; } = new();

    [JsonPropertyName("totalExecutionTimeMs")]
    public int TotalExecutionTimeMs { get; set; }
}

/// <summary>
/// Individual test result
/// </summary>
public class TestResult
{
    [JsonPropertyName("testNumber")]
    public int TestNumber { get; set; }

    [JsonPropertyName("input")]
    public string Input { get; set; } = string.Empty;

    [JsonPropertyName("expected")]
    public string Expected { get; set; } = string.Empty;

    [JsonPropertyName("actual")]
    public string? Actual { get; set; }

    [JsonPropertyName("passed")]
    public bool Passed { get; set; }

    [JsonPropertyName("weight")]
    public decimal Weight { get; set; }

    [JsonPropertyName("executionTimeMs")]
    public int ExecutionTimeMs { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}


