using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.Entities;

/// <summary>
/// Quiz database entity - represents a quiz with metadata
/// </summary>
[Table("quizzes")]
public class QuizDb
{
    [Key]
    [Column("quiz_id")]
    public Guid QuizId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("age_min")]
    [Range(3, 18)]
    public int? AgeMin { get; set; }

    [Column("age_max")]
    [Range(3, 18)]
    public int? AgeMax { get; set; }

    [Column("subject")]
    [MaxLength(100)]
    public string? Subject { get; set; }

    [Column("difficulty")]
    [MaxLength(20)]
    public string? Difficulty { get; set; }

    [Column("estimated_minutes")]
    public int? EstimatedMinutes { get; set; }

    [Column("tags")]
    public string[]? Tags { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public virtual ICollection<QuizQuestionDb> QuizQuestions { get; set; } = new List<QuizQuestionDb>();
    public virtual ICollection<AttemptDb> Attempts { get; set; } = new List<AttemptDb>();
}



