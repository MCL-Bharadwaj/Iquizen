using System.Text.Json;
using System.Text.Json.Serialization;

namespace Quizz.Common.Utilities;

/// <summary>
/// JSON converter for TimeOnly type - converts to/from "HH:mm:ss" format
/// </summary>
public class TimeOnlyJsonConverter : JsonConverter<TimeOnly>
{
    private const string Format = "HH:mm:ss";

    public override TimeOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value))
        {
            throw new JsonException("TimeOnly value cannot be null or empty");
        }

        if (TimeOnly.TryParse(value, out var timeOnly))
        {
            return timeOnly;
        }

        throw new JsonException($"Unable to parse '{value}' as TimeOnly. Expected format: {Format}");
    }

    public override void Write(Utf8JsonWriter writer, TimeOnly value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(Format));
    }
}

/// <summary>
/// JSON converter for DateOnly type - converts to/from "yyyy-MM-dd" format
/// </summary>
public class DateOnlyJsonConverter : JsonConverter<DateOnly>
{
    private const string Format = "yyyy-MM-dd";

    public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value))
        {
            throw new JsonException("DateOnly value cannot be null or empty");
        }

        if (DateOnly.TryParse(value, out var dateOnly))
        {
            return dateOnly;
        }

        throw new JsonException($"Unable to parse '{value}' as DateOnly. Expected format: {Format}");
    }

    public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(Format));
    }
}


