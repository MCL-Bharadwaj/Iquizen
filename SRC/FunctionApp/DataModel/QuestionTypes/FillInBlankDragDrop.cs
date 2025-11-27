using System.Text.Json.Serialization;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.QuestionTypes;

/// <summary>
/// Fill in the blank with drag and drop from word bank
/// </summary>
public class FillInBlankDragDropContent
{
    [JsonPropertyName("template")]
    public string Template { get; set; } = string.Empty;

    [JsonPropertyName("blanks")]
    public List<DragDropBlank> Blanks { get; set; } = new();

    [JsonPropertyName("word_bank")]
    public List<WordBankItem> WordBank { get; set; } = new();

    [JsonPropertyName("media")]
    public QuestionMedia? Media { get; set; }

    [JsonPropertyName("allow_reuse")]
    public bool AllowReuse { get; set; } = false; // Can same word be used multiple times?
}

/// <summary>
/// Blank definition for drag-drop
/// </summary>
public class DragDropBlank
{
    [JsonPropertyName("position")]
    public int Position { get; set; }

    [JsonPropertyName("accepted_answers")]
    public List<string> AcceptedAnswers { get; set; } = new(); // IDs from word bank

    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

/// <summary>
/// Word bank item for dragging
/// </summary>
public class WordBankItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string? Category { get; set; } // Optional: for color coding
}

/// <summary>
/// Answer payload for drag-drop fill in blank
/// </summary>
public class FillInBlankDragDropAnswer
{
    [JsonPropertyName("blanks")]
    public List<BlankDragAnswer> Blanks { get; set; } = new();
}

/// <summary>
/// Individual blank answer with drag-drop
/// </summary>
public class BlankDragAnswer
{
    [JsonPropertyName("position")]
    public int Position { get; set; }

    [JsonPropertyName("selected_id")]
    public string SelectedId { get; set; } = string.Empty;
}

/// <summary>
/// Grading details for drag-drop fill in blank
/// </summary>
public class FillInBlankDragDropGrading
{
    [JsonPropertyName("auto_graded")]
    public bool AutoGraded { get; set; } = true;

    [JsonPropertyName("feedback")]
    public string? Feedback { get; set; }

    [JsonPropertyName("blank_results")]
    public List<BlankDragResult> BlankResults { get; set; } = new();

    [JsonPropertyName("partial_credit_applied")]
    public bool PartialCreditApplied { get; set; }
}

/// <summary>
/// Individual blank grading result for drag-drop
/// </summary>
public class BlankDragResult
{
    [JsonPropertyName("position")]
    public int Position { get; set; }

    [JsonPropertyName("correct")]
    public bool Correct { get; set; }

    [JsonPropertyName("submitted_id")]
    public string SubmittedId { get; set; } = string.Empty;

    [JsonPropertyName("submitted_text")]
    public string SubmittedText { get; set; } = string.Empty;

    [JsonPropertyName("accepted_ids")]
    public List<string> AcceptedIds { get; set; } = new();
}
