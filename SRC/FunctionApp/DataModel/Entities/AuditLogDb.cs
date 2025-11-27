using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.Entities;

/// <summary>
/// Audit log database entity - stores audit trail for all operations
/// </summary>
[Table("audit_log")]
public class AuditLogDb
{
    [Key]
    [Column("log_id")]
    public Guid LogId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    [Column("entity_type")]
    public string EntityType { get; set; } = string.Empty;

    [Column("entity_id")]
    public Guid? EntityId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("action")]
    public string Action { get; set; } = string.Empty;

    [MaxLength(255)]
    [Column("actor_id")]
    public string? ActorId { get; set; }

    /// <summary>
    /// JSONB changes containing old/new values and metadata
    /// </summary>
    [Column("changes", TypeName = "jsonb")]
    public string? ChangesJson { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Get changes as typed object
    /// </summary>
    public T? GetChanges<T>() where T : class
    {
        if (string.IsNullOrWhiteSpace(ChangesJson))
            return null;
            
        return JsonHelper.Deserialize<T>(ChangesJson);
    }

    /// <summary>
    /// Set changes from object
    /// </summary>
    public void SetChanges<T>(T changes) where T : class
    {
        ChangesJson = JsonHelper.Serialize(changes);
    }

    /// <summary>
    /// Get changes as dictionary
    /// </summary>
    public Dictionary<string, object>? GetChangesAsDictionary()
    {
        if (string.IsNullOrWhiteSpace(ChangesJson))
            return null;
            
        return JsonHelper.Deserialize<Dictionary<string, object>>(ChangesJson);
    }
}



