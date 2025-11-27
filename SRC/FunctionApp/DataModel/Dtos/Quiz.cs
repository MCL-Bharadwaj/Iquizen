using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.Dtos;

/// <summary>
/// Quiz API model - simplified version for API responses
/// </summary>
public class Quiz
{
    [JsonPropertyName("quizId")]
    public Guid QuizId { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("ageMin")]
    public int? AgeMin { get; set; }

    [JsonPropertyName("ageMax")]
    public int? AgeMax { get; set; }

    [JsonPropertyName("subject")]
    public string? Subject { get; set; }

    [JsonPropertyName("difficulty")]
    public string? Difficulty { get; set; }

    [JsonPropertyName("estimatedMinutes")]
    public int? EstimatedMinutes { get; set; }

    [JsonPropertyName("tags")]
    public string[]? Tags { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Quiz with questions - for quiz retrieval
/// </summary>
public class QuizWithQuestions : Quiz
{
    [JsonPropertyName("questions")]
    public List<QuestionSummary> Questions { get; set; } = new();

    [JsonPropertyName("totalQuestions")]
    public int TotalQuestions => Questions.Count;

    [JsonPropertyName("totalPoints")]
    public decimal TotalPoints => Questions.Sum(q => q.Points);
}

/// <summary>
/// Create/Update quiz request
/// </summary>
public class CreateQuizRequest
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("ageMin")]
    public int? AgeMin { get; set; }

    [JsonPropertyName("ageMax")]
    public int? AgeMax { get; set; }

    [JsonPropertyName("subject")]
    public string? Subject { get; set; }

    [JsonPropertyName("difficulty")]
    public string? Difficulty { get; set; }

    [JsonPropertyName("estimatedMinutes")]
    public int? EstimatedMinutes { get; set; }

    [JsonPropertyName("tags")]
    public string[]? Tags { get; set; }

    [JsonPropertyName("questionIds")]
    public List<Guid>? QuestionIds { get; set; }
}

/// <summary>
/// Update quiz request
/// </summary>
public class UpdateQuizRequest : CreateQuizRequest
{
    [JsonPropertyName("quizId")]
    public Guid QuizId { get; set; }
}


