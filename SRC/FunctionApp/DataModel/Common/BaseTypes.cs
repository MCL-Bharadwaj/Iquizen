using System.Text.Json;

namespace Quizz.DataModel.Common;

/// <summary>
/// Base interface for models with conversion capabilities
/// </summary>
public interface IConvertible<TDb, TApi>
{
    TApi ToApiModel();
}

/// <summary>
/// Media asset metadata
/// </summary>
public class MediaAsset
{
    public string Url { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Thumbnail { get; set; }
    public string? Transcript { get; set; }
    public string? Captions { get; set; }
}

/// <summary>
/// Media collection for questions
/// </summary>
public class QuestionMedia
{
    public MediaAsset? QuestionImage { get; set; }
    public MediaAsset? QuestionAudio { get; set; }
    public MediaAsset? QuestionVideo { get; set; }
    public MediaAsset? HintImage { get; set; }
    public MediaAsset? TutorialVideo { get; set; }
    public MediaAsset? ReferenceImage { get; set; }
    public Dictionary<string, MediaAsset>? OptionImages { get; set; }
}

/// <summary>
/// Helper methods for JSON serialization
/// </summary>
public static class JsonHelper
{
    private static readonly JsonSerializerOptions _options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false
    };

    public static string Serialize<T>(T obj)
    {
        return JsonSerializer.Serialize(obj, _options);
    }

    public static T? Deserialize<T>(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return default;
            
        return JsonSerializer.Deserialize<T>(json, _options);
    }

    public static JsonDocument ParseDocument(string json)
    {
        return JsonDocument.Parse(json);
    }
}


