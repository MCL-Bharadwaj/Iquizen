using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.QuestionTypes;

/// <summary>
/// Short answer - keyword-based rubric scoring
/// </summary>
public class ShortAnswerContent
{
    [JsonPropertyName("maxLength")]
    public int MaxLength { get; set; } = 500;

    [JsonPropertyName("minLength")]
    public int MinLength { get; set; } = 50;

    [JsonPropertyName("keywords")]
    public List<Keyword> Keywords { get; set; } = new();

    [JsonPropertyName("minScoreThreshold")]
    public decimal MinScoreThreshold { get; set; } = 0.5m;

    [JsonPropertyName("rubricDescription")]
    public string? RubricDescription { get; set; }

    [JsonPropertyName("media")]
    public QuestionMedia? Media { get; set; }
}

/// <summary>
/// Keyword definition for scoring
/// </summary>
public class Keyword
{
    [JsonPropertyName("word")]
    public string Word { get; set; } = string.Empty;

    [JsonPropertyName("weight")]
    public decimal Weight { get; set; }

    [JsonPropertyName("required")]
    public bool Required { get; set; }

    [JsonPropertyName("synonyms")]
    public List<string>? Synonyms { get; set; }
}

/// <summary>
/// Answer payload for short answer
/// </summary>
public class ShortAnswerAnswer
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

/// <summary>
/// Grading details for short answer
/// </summary>
public class ShortAnswerGrading
{
    [JsonPropertyName("autoGraded")]
    public bool AutoGraded { get; set; } = true;

    [JsonPropertyName("feedback")]
    public string? Feedback { get; set; }

    [JsonPropertyName("keywordMatches")]
    public List<KeywordMatch> KeywordMatches { get; set; } = new();

    [JsonPropertyName("totalKeywordScore")]
    public decimal TotalKeywordScore { get; set; }

    [JsonPropertyName("requiredKeywordsFound")]
    public bool RequiredKeywordsFound { get; set; }

    [JsonPropertyName("wordCount")]
    public int WordCount { get; set; }

    [JsonPropertyName("characterCount")]
    public int CharacterCount { get; set; }

    [JsonPropertyName("manualReviewNeeded")]
    public bool ManualReviewNeeded { get; set; }
}

/// <summary>
/// Individual keyword match result
/// </summary>
public class KeywordMatch
{
    [JsonPropertyName("keyword")]
    public string Keyword { get; set; } = string.Empty;

    [JsonPropertyName("found")]
    public bool Found { get; set; }

    [JsonPropertyName("matchedText")]
    public string? MatchedText { get; set; }

    [JsonPropertyName("weight")]
    public decimal Weight { get; set; }

    [JsonPropertyName("pointsEarned")]
    public decimal PointsEarned { get; set; }
}


