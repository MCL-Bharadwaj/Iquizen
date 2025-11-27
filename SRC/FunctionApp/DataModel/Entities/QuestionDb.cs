using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.Entities;

/// <summary>
/// Question database entity - stores questions with type discriminator and JSONB content
/// </summary>
[Table("questions")]
public class QuestionDb
{
    [Key]
    [Column("question_id")]
    public Guid QuestionId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    [Column("question_type")]
    public string QuestionType { get; set; } = string.Empty;

    [Required]
    [Column("question_text")]
    public string QuestionText { get; set; } = string.Empty;

    [Column("age_min")]
    [Range(3, 18)]
    public int? AgeMin { get; set; }

    [Column("age_max")]
    [Range(3, 18)]
    public int? AgeMax { get; set; }

    [Column("difficulty")]
    [MaxLength(20)]
    public string? Difficulty { get; set; }

    [Column("estimated_seconds")]
    public int? EstimatedSeconds { get; set; }

    [Column("subject")]
    [MaxLength(100)]
    public string? Subject { get; set; }

    [Column("locale")]
    [MaxLength(10)]
    public string Locale { get; set; } = "en-US";

    [Column("points")]
    public decimal Points { get; set; } = 10.0m;

    [Column("allow_partial_credit")]
    public bool AllowPartialCredit { get; set; } = false;

    [Column("negative_marking")]
    public bool NegativeMarking { get; set; } = false;

    [Column("supports_read_aloud")]
    public bool SupportsReadAloud { get; set; } = true;

    /// <summary>
    /// JSONB content containing question-specific data and media
    /// Stored as JSON string in database
    /// </summary>
    [Required]
    [Column("content", TypeName = "jsonb")]
    public string ContentJson { get; set; } = "{}";

    [Column("version")]
    public int Version { get; set; } = 1;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public virtual ICollection<QuizQuestionDb> QuizQuestions { get; set; } = new List<QuizQuestionDb>();
    public virtual ICollection<ResponseDb> Responses { get; set; } = new List<ResponseDb>();

    /// <summary>
    /// Deserialize content JSON to specific question type
    /// </summary>
    public T? GetContent<T>() where T : class
    {
        return JsonHelper.Deserialize<T>(ContentJson);
    }

    /// <summary>
    /// Serialize content object to JSON
    /// </summary>
    public void SetContent<T>(T content) where T : class
    {
        ContentJson = JsonHelper.Serialize(content);
    }
}



