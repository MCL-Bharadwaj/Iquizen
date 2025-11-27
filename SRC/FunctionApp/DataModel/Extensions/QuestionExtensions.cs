using Quizz.DataModel.Dtos;
using Quizz.DataModel.Entities;

namespace Quizz.DataModel.Extensions;

/// <summary>
/// Extension methods for converting between Question database and API models
/// </summary>
public static class QuestionExtensions
{
    /// <summary>
    /// Convert QuestionDb to Question API model (full)
    /// </summary>
    public static Question ToApiModel(this QuestionDb db)
    {
        return new Question
        {
            QuestionId = db.QuestionId,
            QuestionType = db.QuestionType,
            QuestionText = db.QuestionText,
            AgeMin = db.AgeMin,
            AgeMax = db.AgeMax,
            Difficulty = db.Difficulty,
            EstimatedSeconds = db.EstimatedSeconds,
            Subject = db.Subject,
            Locale = db.Locale,
            Points = db.Points,
            AllowPartialCredit = db.AllowPartialCredit,
            NegativeMarking = db.NegativeMarking,
            SupportsReadAloud = db.SupportsReadAloud,
            Content = db.ContentJson,
            CreatedAt = db.CreatedAt,
            UpdatedAt = db.UpdatedAt
        };
    }

    /// <summary>
    /// Convert QuestionDb to QuestionSummary API model (summary version for quiz listings)
    /// </summary>
    public static QuestionSummary ToSummaryApiModel(this QuestionDb db, int? position = null)
    {
        return new QuestionSummary
        {
            QuestionId = db.QuestionId,
            QuestionType = db.QuestionType,
            QuestionText = db.QuestionText,
            Difficulty = db.Difficulty,
            EstimatedSeconds = db.EstimatedSeconds,
            Points = db.Points,
            Position = position
        };
    }

    /// <summary>
    /// Convert CreateQuestionRequest to QuestionDb
    /// </summary>
    public static QuestionDb ToDbModel(this CreateQuestionRequest request)
    {
        return new QuestionDb
        {
            QuestionId = Guid.NewGuid(),
            QuestionType = request.QuestionType,
            QuestionText = request.QuestionText,
            AgeMin = request.AgeMin,
            AgeMax = request.AgeMax,
            Difficulty = request.Difficulty,
            EstimatedSeconds = request.EstimatedSeconds,
            Subject = request.Subject,
            Locale = request.Locale ?? "en-US",
            Points = request.Points ?? 10.0m,
            AllowPartialCredit = request.AllowPartialCredit ?? false,
            NegativeMarking = request.NegativeMarking ?? false,
            SupportsReadAloud = request.SupportsReadAloud ?? true,
            ContentJson = System.Text.Json.JsonSerializer.Serialize(request.Content),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Update QuestionDb from UpdateQuestionRequest
    /// </summary>
    public static void UpdateFromRequest(this QuestionDb db, UpdateQuestionRequest request)
    {
        db.QuestionType = request.QuestionType;
        db.QuestionText = request.QuestionText;
        db.AgeMin = request.AgeMin;
        db.AgeMax = request.AgeMax;
        db.Difficulty = request.Difficulty;
        db.EstimatedSeconds = request.EstimatedSeconds;
        db.Subject = request.Subject;
        db.Locale = request.Locale ?? db.Locale;
        db.Points = request.Points ?? db.Points;
        db.AllowPartialCredit = request.AllowPartialCredit ?? db.AllowPartialCredit;
        db.NegativeMarking = request.NegativeMarking ?? db.NegativeMarking;
        db.SupportsReadAloud = request.SupportsReadAloud ?? db.SupportsReadAloud;
        db.ContentJson = System.Text.Json.JsonSerializer.Serialize(request.Content);
        db.UpdatedAt = DateTime.UtcNow;
    }
}


