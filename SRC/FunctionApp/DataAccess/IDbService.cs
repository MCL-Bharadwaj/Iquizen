using System;
using System.Threading.Tasks;
using Npgsql;

namespace Quizz.DataAccess
{
    /// <summary>
    /// Interface for PostgreSQL database service operations.
    /// Enables testability and dependency injection.
    /// </summary>
    public interface IDbService : IDisposable
    {
        #region Transaction Management

        /// <summary>
        /// Executes an action within a transaction scope.
        /// </summary>
        Task<T> ExecuteInTransactionAsync<T>(Func<NpgsqlTransaction, Task<T>> action);

        #endregion

        #region Quiz Operations

        /// <summary>
        /// Gets a quiz by ID.
        /// </summary>
        Task<NpgsqlDataReader> GetQuizByIdAsync(Guid quizId);

        /// <summary>
        /// Gets all published quizzes with optional filtering.
        /// </summary>
        Task<NpgsqlDataReader> GetPublishedQuizzesAsync(
            string difficulty = null,
            string[] tags = null,
            int limit = 50,
            int offset = 0);

        /// <summary>
        /// Creates a new quiz.
        /// </summary>
        Task<Guid> CreateQuizAsync(
            string title,
            string description,
            string slug,
            string difficulty,
            int estimatedMinutes,
            bool isPublished = false,
            string[] tags = null);

        /// <summary>
        /// Updates a quiz.
        /// </summary>
        Task<bool> UpdateQuizAsync(
            Guid quizId,
            string title = null,
            string description = null,
            string difficulty = null,
            int? estimatedMinutes = null,
            bool? isPublished = null,
            string[] tags = null);

        /// <summary>
        /// Soft deletes a quiz.
        /// </summary>
        Task<bool> DeleteQuizAsync(Guid quizId);

        #endregion

        #region Question Operations

        /// <summary>
        /// Gets a question by ID including its JSONB content.
        /// </summary>
        Task<NpgsqlDataReader> GetQuestionByIdAsync(Guid questionId);

        /// <summary>
        /// Gets all questions for a quiz (via quiz_questions junction).
        /// </summary>
        Task<NpgsqlDataReader> GetQuestionsByQuizIdAsync(Guid quizId);

        /// <summary>
        /// Creates a new question with JSONB content.
        /// </summary>
        Task<Guid> CreateQuestionAsync(
            string questionType,
            object content,
            decimal points,
            string explanation = null,
            string[] tags = null,
            int version = 1);

        /// <summary>
        /// Updates a question's content.
        /// </summary>
        Task<bool> UpdateQuestionAsync(
            Guid questionId,
            object content = null,
            decimal? points = null,
            string explanation = null,
            string[] tags = null);

        /// <summary>
        /// Soft deletes a question.
        /// </summary>
        Task<bool> DeleteQuestionAsync(Guid questionId);

        #endregion

        #region Quiz-Question Association

        /// <summary>
        /// Associates a question with a quiz at a specific display order.
        /// </summary>
        Task<bool> AddQuestionToQuizAsync(Guid quizId, Guid questionId, int displayOrder);

        /// <summary>
        /// Removes a question from a quiz.
        /// </summary>
        Task<bool> RemoveQuestionFromQuizAsync(Guid quizId, Guid questionId);

        #endregion

        #region Attempt Operations

        /// <summary>
        /// Gets an attempt by ID.
        /// </summary>
        Task<NpgsqlDataReader> GetAttemptByIdAsync(Guid attemptId);

        /// <summary>
        /// Gets all attempts for a user.
        /// </summary>
        Task<NpgsqlDataReader> GetAttemptsByUserIdAsync(Guid userId, int limit = 50);

        /// <summary>
        /// Creates a new attempt.
        /// </summary>
        Task<Guid> CreateAttemptAsync(Guid quizId, Guid userId, object metadata = null);

        /// <summary>
        /// Updates an attempt's status and scores.
        /// </summary>
        Task<bool> UpdateAttemptAsync(
            Guid attemptId,
            string status = null,
            decimal? totalScore = null,
            decimal? maxScore = null,
            DateTime? submittedAt = null);

        #endregion

        #region Response Operations

        /// <summary>
        /// Gets all responses for an attempt.
        /// </summary>
        Task<NpgsqlDataReader> GetResponsesByAttemptIdAsync(Guid attemptId);

        /// <summary>
        /// Creates or updates a response (upsert).
        /// </summary>
        Task<Guid> UpsertResponseAsync(
            Guid attemptId,
            Guid questionId,
            object answerPayload,
            decimal? pointsEarned = null,
            decimal? pointsPossible = null,
            bool? isCorrect = null,
            object gradingDetails = null);

        #endregion

        #region Content Operations

        /// <summary>
        /// Gets content by key and type.
        /// </summary>
        Task<NpgsqlDataReader> GetContentAsync(string contentKey, string contentType);

        /// <summary>
        /// Creates or updates content (upsert).
        /// </summary>
        Task<Guid> UpsertContentAsync(
            string contentKey,
            string contentType,
            object translations,
            object metadata = null);

        #endregion

        #region Audit Log Operations

        /// <summary>
        /// Creates an audit log entry.
        /// </summary>
        Task<Guid> LogAuditAsync(
            string eventType,
            string actorType = null,
            Guid? actorId = null,
            string resourceType = null,
            Guid? resourceId = null,
            object payload = null,
            string ipAddress = null);

        /// <summary>
        /// Gets recent audit logs with optional filtering.
        /// </summary>
        Task<NpgsqlDataReader> GetAuditLogsAsync(
            string eventType = null,
            string resourceType = null,
            Guid? resourceId = null,
            int limit = 100);

        #endregion

        #region Helper Methods

        /// <summary>
        /// Gets a new database connection (for custom queries).
        /// Caller is responsible for disposing the connection.
        /// </summary>
        Task<NpgsqlConnection> GetConnectionAsync();

        /// <summary>
        /// Executes a raw SQL query and returns a data reader.
        /// </summary>
        Task<NpgsqlDataReader> ExecuteQueryAsync(string sql, params NpgsqlParameter[] parameters);

        /// <summary>
        /// Executes a raw SQL command (INSERT/UPDATE/DELETE) and returns rows affected.
        /// </summary>
        Task<int> ExecuteNonQueryAsync(string sql, params NpgsqlParameter[] parameters);

        #endregion
    }
}


