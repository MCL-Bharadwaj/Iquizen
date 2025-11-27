using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.QuestionTypes;

/// <summary>
/// Multiple choice multi - multiple correct answers with partial credit
/// </summary>
public class MultipleChoiceMultiContent
{
    [JsonPropertyName("options")]
    public List<McOption> Options { get; set; } = new();

    [JsonPropertyName("correctAnswers")]
    public List<string> CorrectAnswers { get; set; } = new();

    [JsonPropertyName("shuffleOptions")]
    public bool ShuffleOptions { get; set; } = true;

    [JsonPropertyName("partialCreditRule")]
    public string PartialCreditRule { get; set; } = "proportional";

    [JsonPropertyName("media")]
    public QuestionMedia? Media { get; set; }
}

/// <summary>
/// Answer payload for multiple choice multi
/// </summary>
public class MultipleChoiceMultiAnswer
{
    [JsonPropertyName("selectedOptions")]
    public List<string> SelectedOptions { get; set; } = new();
}

/// <summary>
/// Grading details for multiple choice multi
/// </summary>
public class MultipleChoiceMultiGrading
{
    [JsonPropertyName("autoGraded")]
    public bool AutoGraded { get; set; } = true;

    [JsonPropertyName("feedback")]
    public string? Feedback { get; set; }

    [JsonPropertyName("correctSelections")]
    public int CorrectSelections { get; set; }

    [JsonPropertyName("totalCorrect")]
    public int TotalCorrect { get; set; }

    [JsonPropertyName("incorrectSelections")]
    public int IncorrectSelections { get; set; }

    [JsonPropertyName("partialCreditApplied")]
    public bool PartialCreditApplied { get; set; }

    [JsonPropertyName("timeTakenSeconds")]
    public int? TimeTakenSeconds { get; set; }
}


