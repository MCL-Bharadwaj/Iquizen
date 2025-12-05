using System.Text.Json.Serialization;

namespace Quizz.DataModel.Dtos;

/// <summary>
/// Attempt API model - user quiz attempt
/// </summary>
public class Attempt
{
    [JsonPropertyName("attemptId")]
    public Guid AttemptId { get; set; }

    [JsonPropertyName("quizId")]
    public Guid QuizId { get; set; }

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "in_progress";

    [JsonPropertyName("startedAt")]
    public DateTime StartedAt { get; set; }

    [JsonPropertyName("completedAt")]
    public DateTime? CompletedAt { get; set; }

    [JsonPropertyName("totalScore")]
    public decimal? TotalScore { get; set; }

    [JsonPropertyName("maxPossibleScore")]
    public decimal? MaxPossibleScore { get; set; }

    [JsonPropertyName("scorePercentage")]
    public decimal? ScorePercentage { get; set; }

    [JsonPropertyName("metadata")]
    public object? Metadata { get; set; }

    [JsonPropertyName("quizTitle")]
    public string? QuizTitle { get; set; }

    [JsonPropertyName("maxAttempts")]
    public int? MaxAttempts { get; set; }

    [JsonPropertyName("attemptsUsed")]
    public int? AttemptsUsed { get; set; }
}

/// <summary>
/// Attempt with details - includes quiz info and responses
/// </summary>
public class AttemptWithDetails : Attempt
{
    [JsonPropertyName("quiz")]
    public QuizWithQuestions? Quiz { get; set; }

    [JsonPropertyName("responses")]
    public List<Response> Responses { get; set; } = new();

    [JsonPropertyName("completedQuestions")]
    public int CompletedQuestions => Responses.Count;

    [JsonPropertyName("totalQuestions")]
    public int TotalQuestions => Quiz?.TotalQuestions ?? 0;

    [JsonPropertyName("duration")]
    public TimeSpan? Duration => CompletedAt.HasValue 
        ? CompletedAt.Value - StartedAt 
        : null;
}

/// <summary>
/// Start attempt request
/// </summary>
public class StartAttemptRequest
{
    [JsonPropertyName("quizId")]
    public Guid QuizId { get; set; }

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("metadata")]
    public object? Metadata { get; set; }
}

/// <summary>
/// Complete attempt request
/// </summary>
public class CompleteAttemptRequest
{
    [JsonPropertyName("attemptId")]
    public Guid AttemptId { get; set; }
}


