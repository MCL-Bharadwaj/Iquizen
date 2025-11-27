using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Quizz.DataModel.Entities;

/// <summary>
/// Quiz-Question junction table - links quizzes to questions with ordering
/// </summary>
[Table("quiz_questions")]
public class QuizQuestionDb
{
    [Required]
    [Column("quiz_id")]
    public Guid QuizId { get; set; }

    [Required]
    [Column("question_id")]
    public Guid QuestionId { get; set; }

    [Required]
    [Column("position")]
    [Range(1, int.MaxValue)]
    public int Position { get; set; }

    // Navigation properties
    [ForeignKey(nameof(QuizId))]
    public virtual QuizDb Quiz { get; set; } = null!;

    [ForeignKey(nameof(QuestionId))]
    public virtual QuestionDb Question { get; set; } = null!;
}



