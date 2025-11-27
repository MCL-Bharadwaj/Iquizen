
using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.QuestionTypes;

/// <summary>
/// Fill in the blank - multiple blanks with flexible matching
/// </summary>
public class FillInBlankContent
{
    [JsonPropertyName("template")]
    public string Template { get; set; } = string.Empty;

    [JsonPropertyName("blanks")]
    public List<Blank> Blanks { get; set; } = new();

    [JsonPropertyName("media")]
    public QuestionMedia? Media { get; set; }
}

/// <summary>
/// Blank definition
/// </summary>
public class Blank
{
    [JsonPropertyName("position")]
    public int Position { get; set; }

    [JsonPropertyName("acceptedAnswers")]
    public List<string> AcceptedAnswers { get; set; } = new();

    [JsonPropertyName("caseSensitive")]
    public bool CaseSensitive { get; set; } = false;

    [JsonPropertyName("hint")]
    public string? Hint { get; set; }

    [JsonPropertyName("regexPattern")]
    public string? RegexPattern { get; set; }
}

/// <summary>
/// Answer payload for fill in blank
/// </summary>
public class FillInBlankAnswer
{
    [JsonPropertyName("blanks")]
    public List<BlankAnswer> Blanks { get; set; } = new();
}

/// <summary>
/// Individual blank answer
/// </summary>
public class BlankAnswer
{
    [JsonPropertyName("position")]
    public int Position { get; set; }

    [JsonPropertyName("answer")]
    public string Answer { get; set; } = string.Empty;
}

/// <summary>
/// Grading details for fill in blank
/// </summary>
public class FillInBlankGrading
{
    [JsonPropertyName("autoGraded")]
    public bool AutoGraded { get; set; } = true;

    [JsonPropertyName("feedback")]
    public string? Feedback { get; set; }

    [JsonPropertyName("blankResults")]
    public List<BlankResult> BlankResults { get; set; } = new();

    [JsonPropertyName("partialCreditApplied")]
    public bool PartialCreditApplied { get; set; }
}

/// <summary>
/// Individual blank grading result
/// </summary>
public class BlankResult
{
    [JsonPropertyName("position")]
    public int Position { get; set; }

    [JsonPropertyName("correct")]
    public bool Correct { get; set; }

    [JsonPropertyName("submitted")]
    public string Submitted { get; set; } = string.Empty;

    [JsonPropertyName("accepted")]
    public List<string> Accepted { get; set; } = new();
}


