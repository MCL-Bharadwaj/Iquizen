using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.QuestionTypes;

/// <summary>
/// Matching - match pairs with partial credit per pair
/// </summary>
public class MatchingContent
{
    [JsonPropertyName("leftItems")]
    public List<MatchItem> LeftItems { get; set; } = new();

    [JsonPropertyName("rightItems")]
    public List<MatchItem> RightItems { get; set; } = new();

    [JsonPropertyName("correctPairs")]
    public List<MatchPair> CorrectPairs { get; set; } = new();

    [JsonPropertyName("partialCreditStrategy")]
    public string PartialCreditStrategy { get; set; } = "per_pair";

    [JsonPropertyName("shuffleItems")]
    public bool ShuffleItems { get; set; } = true;

    [JsonPropertyName("media")]
    public QuestionMedia? Media { get; set; }
}

/// <summary>
/// Match item
/// </summary>
public class MatchItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string? Image { get; set; }

    [JsonPropertyName("audio")]
    public string? Audio { get; set; }
}

/// <summary>
/// Match pair
/// </summary>
public class MatchPair
{
    [JsonPropertyName("left")]
    public string Left { get; set; } = string.Empty;

    [JsonPropertyName("right")]
    public string Right { get; set; } = string.Empty;
}

/// <summary>
/// Answer payload for matching
/// </summary>
public class MatchingAnswer
{
    [JsonPropertyName("pairs")]
    public List<MatchPair> Pairs { get; set; } = new();
}

/// <summary>
/// Grading details for matching
/// </summary>
public class MatchingGrading
{
    [JsonPropertyName("autoGraded")]
    public bool AutoGraded { get; set; } = true;

    [JsonPropertyName("feedback")]
    public string? Feedback { get; set; }

    [JsonPropertyName("correctPairs")]
    public int CorrectPairs { get; set; }

    [JsonPropertyName("totalPairs")]
    public int TotalPairs { get; set; }

    [JsonPropertyName("pairResults")]
    public List<PairResult> PairResults { get; set; } = new();

    [JsonPropertyName("partialCreditApplied")]
    public bool PartialCreditApplied { get; set; }
}

/// <summary>
/// Individual pair grading result
/// </summary>
public class PairResult
{
    [JsonPropertyName("left")]
    public string Left { get; set; } = string.Empty;

    [JsonPropertyName("right")]
    public string Right { get; set; } = string.Empty;

    [JsonPropertyName("correct")]
    public bool Correct { get; set; }
}


