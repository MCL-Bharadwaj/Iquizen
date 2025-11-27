using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Quizz.DataModel.Entities;

/// <summary>
/// Represents player-specific information extending the User entity
/// Maps to the quiz.players table
/// </summary>
[Table("players", Schema = "quiz")]
public class Player
{
    [Key]
    [Column("player_id")]
    public Guid PlayerId { get; set; }

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("player_number")]
    public string PlayerNumber { get; set; } = string.Empty;

    [Column("enrollment_date")]
    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;

    [Column("graduation_date")]
    public DateTime? GraduationDate { get; set; }

    [Column("total_score")]
    public int TotalScore { get; set; } = 0;

    [Column("games_played")]
    public int GamesPlayed { get; set; } = 0;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
