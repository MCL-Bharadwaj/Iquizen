using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.Entities;

/// <summary>
/// Attempt database entity - stores user quiz attempts with aggregate scoring
/// </summary>
[Table("attempts")]
public class AttemptDb
{
    [Key]
    [Column("attempt_id")]
    public Guid AttemptId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("quiz_id")]
    public Guid QuizId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "in_progress";

    [Column("started_at")]
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [Column("total_score")]
    public decimal? TotalScore { get; set; }

    [Column("max_possible_score")]
    public decimal? MaxPossibleScore { get; set; }

    /// <summary>
    /// JSONB metadata containing device info, scoring policy, etc.
    /// </summary>
    [Column("metadata", TypeName = "jsonb")]
    public string? MetadataJson { get; set; }

    // Navigation properties
    [ForeignKey(nameof(QuizId))]
    public virtual QuizDb Quiz { get; set; } = null!;

    public virtual ICollection<ResponseDb> Responses { get; set; } = new List<ResponseDb>();

    /// <summary>
    /// Get metadata as typed object
    /// </summary>
    public T? GetMetadata<T>() where T : class
    {
        if (string.IsNullOrWhiteSpace(MetadataJson))
            return null;
            
        return JsonHelper.Deserialize<T>(MetadataJson);
    }

    /// <summary>
    /// Set metadata from object
    /// </summary>
    public void SetMetadata<T>(T metadata) where T : class
    {
        MetadataJson = JsonHelper.Serialize(metadata);
    }

    /// <summary>
    /// Calculate score percentage
    /// </summary>
    [NotMapped]
    public decimal? ScorePercentage => 
        TotalScore.HasValue && MaxPossibleScore.HasValue && MaxPossibleScore.Value > 0
            ? Math.Round((TotalScore.Value / MaxPossibleScore.Value) * 100, 2)
            : null;
}



