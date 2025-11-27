using Quizz.DataModel.Dtos;
using Quizz.DataModel.Entities;
using Quizz.DataModel.Common;

namespace Quizz.DataModel.Extensions;

/// <summary>
/// Extension methods for converting between Quiz DB and API models
/// </summary>
public static class QuizExtensions
{
    /// <summary>
    /// Convert QuizDb to Quiz API model
    /// </summary>
    public static Quiz ToApiModel(this QuizDb db)
    {
        return new Quiz
        {
            QuizId = db.QuizId,
            Title = db.Title,
            Description = db.Description,
            AgeMin = db.AgeMin,
            AgeMax = db.AgeMax,
            Subject = db.Subject,
            Difficulty = db.Difficulty,
            EstimatedMinutes = db.EstimatedMinutes,
            Tags = db.Tags,
            CreatedAt = db.CreatedAt,
            UpdatedAt = db.UpdatedAt
        };
    }

    /// <summary>
    /// Convert QuizDb with questions to QuizWithQuestions API model
    /// </summary>
    public static QuizWithQuestions ToApiModelWithQuestions(this QuizDb db)
    {
        var quiz = new QuizWithQuestions
        {
            QuizId = db.QuizId,
            Title = db.Title,
            Description = db.Description,
            AgeMin = db.AgeMin,
            AgeMax = db.AgeMax,
            Subject = db.Subject,
            Difficulty = db.Difficulty,
            EstimatedMinutes = db.EstimatedMinutes,
            Tags = db.Tags,
            CreatedAt = db.CreatedAt,
            UpdatedAt = db.UpdatedAt
        };

        if (db.QuizQuestions?.Any() == true)
        {
            quiz.Questions = db.QuizQuestions
                .OrderBy(qq => qq.Position)
                .Select(qq => qq.Question.ToSummaryApiModel(qq.Position))
                .ToList();
        }

        return quiz;
    }

    /// <summary>
    /// Convert CreateQuizRequest to QuizDb
    /// </summary>
    public static QuizDb ToDbModel(this CreateQuizRequest request)
    {
        return new QuizDb
        {
            Title = request.Title,
            Description = request.Description,
            AgeMin = request.AgeMin,
            AgeMax = request.AgeMax,
            Subject = request.Subject,
            Difficulty = request.Difficulty,
            EstimatedMinutes = request.EstimatedMinutes,
            Tags = request.Tags
        };
    }

    /// <summary>
    /// Update QuizDb from UpdateQuizRequest
    /// </summary>
    public static void UpdateFromRequest(this QuizDb db, UpdateQuizRequest request)
    {
        db.Title = request.Title;
        db.Description = request.Description;
        db.AgeMin = request.AgeMin;
        db.AgeMax = request.AgeMax;
        db.Subject = request.Subject;
        db.Difficulty = request.Difficulty;
        db.EstimatedMinutes = request.EstimatedMinutes;
        db.Tags = request.Tags;
        db.UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Convert list of QuizDb to list of Quiz API models
    /// </summary>
    public static List<Quiz> ToApiModels(this IEnumerable<QuizDb> dbList)
    {
        return dbList.Select(db => db.ToApiModel()).ToList();
    }
}


