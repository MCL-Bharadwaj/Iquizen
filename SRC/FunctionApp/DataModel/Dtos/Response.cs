using System.Text.Json.Serialization;

namespace Quizz.DataModel.Dtos;

/// <summary>
/// Response API model - user answer and score
/// </summary>
public class Response
{
    [JsonPropertyName("responseId")]
    public Guid ResponseId { get; set; }

    [JsonPropertyName("attemptId")]
    public Guid AttemptId { get; set; }

    [JsonPropertyName("questionId")]
    public Guid QuestionId { get; set; }

    [JsonPropertyName("answerPayload")]
    public object AnswerPayload { get; set; } = new();

    [JsonPropertyName("submittedAt")]
    public DateTime SubmittedAt { get; set; }

    [JsonPropertyName("pointsEarned")]
    public decimal? PointsEarned { get; set; }

    [JsonPropertyName("pointsPossible")]
    public decimal? PointsPossible { get; set; }

    [JsonPropertyName("isCorrect")]
    public bool? IsCorrect { get; set; }

    [JsonPropertyName("gradingDetails")]
    public object? GradingDetails { get; set; }

    [JsonPropertyName("gradedAt")]
    public DateTime? GradedAt { get; set; }

    [JsonPropertyName("scorePercentage")]
    public decimal? ScorePercentage { get; set; }

    [JsonPropertyName("isGraded")]
    public bool IsGraded => GradedAt.HasValue && PointsEarned.HasValue;
}

/// <summary>
/// Response with question details
/// </summary>
public class ResponseWithQuestion : Response
{
    [JsonPropertyName("question")]
    public QuestionSummary? Question { get; set; }
}

/// <summary>
/// Submit answer request
/// </summary>
public class SubmitAnswerRequest
{
    [JsonPropertyName("attemptId")]
    public Guid AttemptId { get; set; }

    [JsonPropertyName("questionId")]
    public Guid QuestionId { get; set; }

    [JsonPropertyName("answerPayload")]
    public object AnswerPayload { get; set; } = new();

    [JsonPropertyName("pointsPossible")]
    public decimal? PointsPossible { get; set; }
}

/// <summary>
/// Grading result
/// </summary>
public class GradingResult
{
    [JsonPropertyName("responseId")]
    public Guid ResponseId { get; set; }

    [JsonPropertyName("pointsEarned")]
    public decimal PointsEarned { get; set; }

    [JsonPropertyName("pointsPossible")]
    public decimal PointsPossible { get; set; }

    [JsonPropertyName("isCorrect")]
    public bool IsCorrect { get; set; }

    [JsonPropertyName("feedback")]
    public string? Feedback { get; set; }

    [JsonPropertyName("gradingDetails")]
    public object? GradingDetails { get; set; }
}


