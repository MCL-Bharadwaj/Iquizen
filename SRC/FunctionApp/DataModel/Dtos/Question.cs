using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.Dtos;

/// <summary>
/// Question API model - simplified version for API responses
/// </summary>
public class Question
{
    [JsonPropertyName("questionId")]
    public Guid QuestionId { get; set; }

    [JsonPropertyName("questionType")]
    public string QuestionType { get; set; } = string.Empty;

    [JsonPropertyName("questionText")]
    public string QuestionText { get; set; } = string.Empty;

    [JsonPropertyName("ageMin")]
    public int? AgeMin { get; set; }

    [JsonPropertyName("ageMax")]
    public int? AgeMax { get; set; }

    [JsonPropertyName("difficulty")]
    public string? Difficulty { get; set; }

    [JsonPropertyName("estimatedSeconds")]
    public int? EstimatedSeconds { get; set; }

    [JsonPropertyName("subject")]
    public string? Subject { get; set; }

    [JsonPropertyName("locale")]
    public string Locale { get; set; } = "en-US";

    [JsonPropertyName("points")]
    public decimal Points { get; set; } = 10.0m;

    [JsonPropertyName("allowPartialCredit")]
    public bool AllowPartialCredit { get; set; } = false;

    [JsonPropertyName("negativeMarking")]
    public bool NegativeMarking { get; set; } = false;

    [JsonPropertyName("supportsReadAloud")]
    public bool SupportsReadAloud { get; set; } = true;

    /// <summary>
    /// Question content (type-specific, stored as object for JSON serialization)
    /// </summary>
    [JsonPropertyName("content")]
    public object? Content { get; set; }

    [JsonPropertyName("version")]
    public int Version { get; set; } = 1;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Question summary - minimal info for lists
/// </summary>
public class QuestionSummary
{
    [JsonPropertyName("questionId")]
    public Guid QuestionId { get; set; }

    [JsonPropertyName("questionType")]
    public string QuestionType { get; set; } = string.Empty;

    [JsonPropertyName("questionText")]
    public string QuestionText { get; set; } = string.Empty;

    [JsonPropertyName("difficulty")]
    public string? Difficulty { get; set; }

    [JsonPropertyName("points")]
    public decimal Points { get; set; } = 10.0m;

    [JsonPropertyName("estimatedSeconds")]
    public int? EstimatedSeconds { get; set; }

    [JsonPropertyName("position")]
    public int? Position { get; set; }
}

/// <summary>
/// Create question request
/// </summary>
public class CreateQuestionRequest
{
    [JsonPropertyName("questionType")]
    public string QuestionType { get; set; } = string.Empty;

    [JsonPropertyName("questionText")]
    public string QuestionText { get; set; } = string.Empty;

    [JsonPropertyName("ageMin")]
    public int? AgeMin { get; set; }

    [JsonPropertyName("ageMax")]
    public int? AgeMax { get; set; }

    [JsonPropertyName("difficulty")]
    public string? Difficulty { get; set; }

    [JsonPropertyName("estimatedSeconds")]
    public int? EstimatedSeconds { get; set; }

    [JsonPropertyName("subject")]
    public string? Subject { get; set; }

    [JsonPropertyName("locale")]
    public string? Locale { get; set; }

    [JsonPropertyName("points")]
    public decimal? Points { get; set; }

    [JsonPropertyName("allowPartialCredit")]
    public bool? AllowPartialCredit { get; set; }

    [JsonPropertyName("negativeMarking")]
    public bool? NegativeMarking { get; set; }

    [JsonPropertyName("supportsReadAloud")]
    public bool? SupportsReadAloud { get; set; }

    /// <summary>
    /// Question content (type-specific)
    /// </summary>
    [JsonPropertyName("content")]
    public object Content { get; set; } = new();
}

/// <summary>
/// Update question request
/// </summary>
public class UpdateQuestionRequest : CreateQuestionRequest
{
    [JsonPropertyName("questionId")]
    public Guid QuestionId { get; set; }
}

/// <summary>
/// Add question to quiz request
/// </summary>
public class AddQuestionToQuizRequest
{
    [JsonPropertyName("questionId")]
    public Guid QuestionId { get; set; }

    [JsonPropertyName("position")]
    public int? Position { get; set; }
}


