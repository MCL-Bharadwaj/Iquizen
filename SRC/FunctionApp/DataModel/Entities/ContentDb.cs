using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.Entities;

/// <summary>
/// Content database entity - stores i18n translations and localized content
/// </summary>
[Table("content")]
public class ContentDb
{
    [Key]
    [Column("content_id")]
    public Guid ContentId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(10)]
    [Column("locale")]
    public string Locale { get; set; } = string.Empty;

    /// <summary>
    /// JSONB translations containing key-value pairs
    /// </summary>
    [Required]
    [Column("translations", TypeName = "jsonb")]
    public string TranslationsJson { get; set; } = "{}";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Get translations as dictionary
    /// </summary>
    public Dictionary<string, string>? GetTranslations()
    {
        return JsonHelper.Deserialize<Dictionary<string, string>>(TranslationsJson);
    }

    /// <summary>
    /// Set translations from dictionary
    /// </summary>
    public void SetTranslations(Dictionary<string, string> translations)
    {
        TranslationsJson = JsonHelper.Serialize(translations);
    }

    /// <summary>
    /// Get specific translation by key
    /// </summary>
    public string? GetTranslation(string key)
    {
        var translations = GetTranslations();
        return translations?.TryGetValue(key, out var value) == true ? value : null;
    }
}



