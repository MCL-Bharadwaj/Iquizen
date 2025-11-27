using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.QuestionTypes;

/// <summary>
/// Multiple choice single - one correct answer
/// </summary>
public class MultipleChoiceSingleContent
{
    [JsonPropertyName("options")]
    public List<McOption> Options { get; set; } = new();

    [JsonPropertyName("correctAnswer")]
    public string CorrectAnswer { get; set; } = string.Empty;

    [JsonPropertyName("shuffleOptions")]
    public bool ShuffleOptions { get; set; } = true;

    [JsonPropertyName("media")]
    public QuestionMedia? Media { get; set; }
}

/// <summary>
/// Multiple choice option
/// </summary>
public class McOption
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string? Image { get; set; }
}

/// <summary>
/// Answer payload for multiple choice single
/// </summary>
public class MultipleChoiceSingleAnswer
{
    [JsonPropertyName("selectedOption")]
    public string SelectedOption { get; set; } = string.Empty;
}

/// <summary>
/// Grading details for multiple choice single
/// </summary>
public class MultipleChoiceSingleGrading
{
    [JsonPropertyName("autoGraded")]
    public bool AutoGraded { get; set; } = true;

    [JsonPropertyName("feedback")]
    public string? Feedback { get; set; }

    [JsonPropertyName("timeTakenSeconds")]
    public int? TimeTakenSeconds { get; set; }
}


