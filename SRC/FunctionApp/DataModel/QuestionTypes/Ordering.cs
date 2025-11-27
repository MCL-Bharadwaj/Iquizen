using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.QuestionTypes;

/// <summary>
/// Ordering - order items in correct sequence with partial credit
/// </summary>
public class OrderingContent
{
    [JsonPropertyName("items")]
    public List<OrderItem> Items { get; set; } = new();

    [JsonPropertyName("correctOrder")]
    public List<string> CorrectOrder { get; set; } = new();

    [JsonPropertyName("partialCreditStrategy")]
    public string PartialCreditStrategy { get; set; } = "adjacent_pairs";

    [JsonPropertyName("media")]
    public QuestionMedia? Media { get; set; }
}

/// <summary>
/// Order item
/// </summary>
public class OrderItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string? Image { get; set; }
}

/// <summary>
/// Answer payload for ordering
/// </summary>
public class OrderingAnswer
{
    [JsonPropertyName("order")]
    public List<string> Order { get; set; } = new();
}

/// <summary>
/// Grading details for ordering
/// </summary>
public class OrderingGrading
{
    [JsonPropertyName("autoGraded")]
    public bool AutoGraded { get; set; } = true;

    [JsonPropertyName("feedback")]
    public string? Feedback { get; set; }

    [JsonPropertyName("correctPositions")]
    public int CorrectPositions { get; set; }

    [JsonPropertyName("totalPositions")]
    public int TotalPositions { get; set; }

    [JsonPropertyName("adjacentPairsCorrect")]
    public int AdjacentPairsCorrect { get; set; }

    [JsonPropertyName("partialCreditApplied")]
    public bool PartialCreditApplied { get; set; }
}


