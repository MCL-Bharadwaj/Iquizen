using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.Entities;

/// <summary>
/// Response database entity - stores user answers and calculated scores (combined table)
/// </summary>
[Table("responses")]
public class ResponseDb
{
    [Key]
    [Column("response_id")]
    public Guid ResponseId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("attempt_id")]
    public Guid AttemptId { get; set; }

    [Required]
    [Column("question_id")]
    public Guid QuestionId { get; set; }

    /// <summary>
    /// JSONB answer payload containing type-specific answer
    /// </summary>
    [Required]
    [Column("answer_payload", TypeName = "jsonb")]
    public string AnswerPayloadJson { get; set; } = "{}";

    [Column("submitted_at")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Scoring fields
    [Column("points_earned")]
    public decimal? PointsEarned { get; set; }

    [Column("points_possible")]
    public decimal? PointsPossible { get; set; }

    [Column("is_correct")]
    public bool? IsCorrect { get; set; }

    /// <summary>
    /// JSONB grading details containing partial credit breakdown, test results, feedback
    /// </summary>
    [Column("grading_details", TypeName = "jsonb")]
    public string? GradingDetailsJson { get; set; }

    [Column("graded_at")]
    public DateTime? GradedAt { get; set; }

    // Navigation properties
    [ForeignKey(nameof(AttemptId))]
    public virtual AttemptDb Attempt { get; set; } = null!;

    [ForeignKey(nameof(QuestionId))]
    public virtual QuestionDb Question { get; set; } = null!;

    /// <summary>
    /// Get answer payload as typed object
    /// </summary>
    public T? GetAnswerPayload<T>() where T : class
    {
        return JsonHelper.Deserialize<T>(AnswerPayloadJson);
    }

    /// <summary>
    /// Set answer payload from object
    /// </summary>
    public void SetAnswerPayload<T>(T answer) where T : class
    {
        AnswerPayloadJson = JsonHelper.Serialize(answer);
    }

    /// <summary>
    /// Get grading details as typed object
    /// </summary>
    public T? GetGradingDetails<T>() where T : class
    {
        if (string.IsNullOrWhiteSpace(GradingDetailsJson))
            return null;
            
        return JsonHelper.Deserialize<T>(GradingDetailsJson);
    }

    /// <summary>
    /// Set grading details from object
    /// </summary>
    public void SetGradingDetails<T>(T details) where T : class
    {
        GradingDetailsJson = JsonHelper.Serialize(details);
    }

    /// <summary>
    /// Calculate score percentage for this response
    /// </summary>
    [NotMapped]
    public decimal? ScorePercentage => 
        PointsEarned.HasValue && PointsPossible.HasValue && PointsPossible.Value > 0
            ? Math.Round((PointsEarned.Value / PointsPossible.Value) * 100, 2)
            : null;

    /// <summary>
    /// Check if response has been graded
    /// </summary>
    [NotMapped]
    public bool IsGraded => GradedAt.HasValue && PointsEarned.HasValue;
}



