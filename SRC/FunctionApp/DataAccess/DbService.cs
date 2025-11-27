using System;
using System.Collections.Generic;
using System.Data;
using System.Text.Json;
using System.Threading.Tasks;
using Npgsql;
using NpgsqlTypes;

namespace Quizz.DataAccess
{
    /// <summary>
    /// PostgreSQL database service for quiz application.
    /// Handles all database interactions using Npgsql.
    /// Designed for dependency injection in Azure Functions.
    /// </summary>
    public class DbService : IDbService
    {
        private readonly string _connectionString;
        private NpgsqlConnection _connection;
        private readonly JsonSerializerOptions _jsonOptions;

        public DbService(string connectionString)
        {
            _connectionString = connectionString ?? throw new ArgumentNullException(nameof(connectionString));
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };
        }

        #region Connection Management

        /// <summary>
        /// Gets or creates a database connection. Opens if not already open.
        /// </summary>
        public async Task<NpgsqlConnection> GetConnectionAsync()
        {
            if (_connection == null)
            {
                _connection = new NpgsqlConnection(_connectionString);
            }

            if (_connection.State != ConnectionState.Open)
            {
                await _connection.OpenAsync();
                
                // Set the schema search path to 'quiz' schema
                using (var cmd = new NpgsqlCommand("SET search_path TO quiz, public;", _connection))
                {
                    await cmd.ExecuteNonQueryAsync();
                }
            }

            return _connection;
        }

        /// <summary>
        /// Executes an action within a transaction scope.
        /// </summary>
        public async Task<T> ExecuteInTransactionAsync<T>(Func<NpgsqlTransaction, Task<T>> action)
        {
            var conn = await GetConnectionAsync();
            await using var transaction = await conn.BeginTransactionAsync();
            
            try
            {
                var result = await action(transaction);
                await transaction.CommitAsync();
                return result;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        #endregion

        #region Quiz Operations

        /// <summary>
        /// Gets a quiz by ID.
        /// </summary>
        public async Task<NpgsqlDataReader> GetQuizByIdAsync(Guid quizId)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                SELECT quiz_id, title, description, slug, difficulty, estimated_minutes,
                       is_published, tags, created_at, updated_at, deleted_at
                FROM quiz.quizzes
                WHERE quiz_id = @quizId AND deleted_at IS NULL", conn);
            
            cmd.Parameters.AddWithValue("@quizId", quizId);
            return await cmd.ExecuteReaderAsync(CommandBehavior.SingleRow);
        }

        /// <summary>
        /// Gets all published quizzes with optional filtering.
        /// </summary>
        public async Task<NpgsqlDataReader> GetPublishedQuizzesAsync(
            string difficulty = null,
            string[] tags = null,
            int limit = 50,
            int offset = 0)
        {
            var conn = await GetConnectionAsync();
            var sql = @"
                SELECT quiz_id, title, description, slug, difficulty, estimated_minutes,
                       is_published, tags, created_at, updated_at
                FROM quiz.quizzes
                WHERE is_published = true AND deleted_at IS NULL";

            var parameters = new List<NpgsqlParameter>();

            if (!string.IsNullOrEmpty(difficulty))
            {
                sql += " AND difficulty = @difficulty";
                parameters.Add(new NpgsqlParameter("@difficulty", difficulty));
            }

            if (tags != null && tags.Length > 0)
            {
                sql += " AND tags && @tags";
                parameters.Add(new NpgsqlParameter("@tags", NpgsqlDbType.Array | NpgsqlDbType.Text) { Value = tags });
            }

            sql += " ORDER BY created_at DESC LIMIT @limit OFFSET @offset";
            parameters.Add(new NpgsqlParameter("@limit", limit));
            parameters.Add(new NpgsqlParameter("@offset", offset));

            var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddRange(parameters.ToArray());

            return await cmd.ExecuteReaderAsync();
        }

        /// <summary>
        /// Creates a new quiz.
        /// </summary>
        public async Task<Guid> CreateQuizAsync(
            string title,
            string description,
            string slug,
            string difficulty,
            int estimatedMinutes,
            bool isPublished = false,
            string[] tags = null)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                INSERT INTO quiz.quizzes (title, description, slug, difficulty, estimated_minutes, is_published, tags)
                VALUES (@title, @description, @slug, @difficulty, @estimatedMinutes, @isPublished, @tags)
                RETURNING quiz_id", conn);

            cmd.Parameters.AddWithValue("@title", title);
            cmd.Parameters.AddWithValue("@description", description ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@slug", slug);
            cmd.Parameters.AddWithValue("@difficulty", difficulty);
            cmd.Parameters.AddWithValue("@estimatedMinutes", estimatedMinutes);
            cmd.Parameters.AddWithValue("@isPublished", isPublished);
            cmd.Parameters.AddWithValue("@tags", tags != null 
                ? (object)tags 
                : (object)DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            return (Guid)result;
        }

        /// <summary>
        /// Updates a quiz.
        /// </summary>
        public async Task<bool> UpdateQuizAsync(
            Guid quizId,
            string title = null,
            string description = null,
            string difficulty = null,
            int? estimatedMinutes = null,
            bool? isPublished = null,
            string[] tags = null)
        {
            var conn = await GetConnectionAsync();
            var updates = new List<string>();
            var parameters = new List<NpgsqlParameter>
            {
                new NpgsqlParameter("@quizId", quizId)
            };

            if (title != null)
            {
                updates.Add("title = @title");
                parameters.Add(new NpgsqlParameter("@title", title));
            }

            if (description != null)
            {
                updates.Add("description = @description");
                parameters.Add(new NpgsqlParameter("@description", description));
            }

            if (difficulty != null)
            {
                updates.Add("difficulty = @difficulty");
                parameters.Add(new NpgsqlParameter("@difficulty", difficulty));
            }

            if (estimatedMinutes.HasValue)
            {
                updates.Add("estimated_minutes = @estimatedMinutes");
                parameters.Add(new NpgsqlParameter("@estimatedMinutes", estimatedMinutes.Value));
            }

            if (isPublished.HasValue)
            {
                updates.Add("is_published = @isPublished");
                parameters.Add(new NpgsqlParameter("@isPublished", isPublished.Value));
            }

            if (tags != null)
            {
                updates.Add("tags = @tags");
                parameters.Add(new NpgsqlParameter("@tags", NpgsqlDbType.Array | NpgsqlDbType.Text) { Value = tags });
            }

            if (updates.Count == 0)
            {
                return false;
            }

            var sql = $"UPDATE quiz.quizzes SET {string.Join(", ", updates)} WHERE quiz_id = @quizId AND deleted_at IS NULL";
            var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddRange(parameters.ToArray());

            var rowsAffected = await cmd.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        /// <summary>
        /// Soft deletes a quiz.
        /// </summary>
        public async Task<bool> DeleteQuizAsync(Guid quizId)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                UPDATE quiz.quizzes 
                SET deleted_at = NOW() 
                WHERE quiz_id = @quizId AND deleted_at IS NULL", conn);

            cmd.Parameters.AddWithValue("@quizId", quizId);
            var rowsAffected = await cmd.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        #endregion

        #region Question Operations

        /// <summary>
        /// Gets a question by ID including its JSONB content.
        /// </summary>
        public async Task<NpgsqlDataReader> GetQuestionByIdAsync(Guid questionId)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                SELECT question_id, question_type, content, points, explanation,
                       tags, version, created_at, updated_at, deleted_at
                FROM quiz.questions
                WHERE question_id = @questionId AND deleted_at IS NULL", conn);

            cmd.Parameters.AddWithValue("@questionId", questionId);
            return await cmd.ExecuteReaderAsync(CommandBehavior.SingleRow);
        }

        /// <summary>
        /// Gets all questions for a quiz (via quiz_questions junction).
        /// </summary>
        public async Task<NpgsqlDataReader> GetQuestionsByQuizIdAsync(Guid quizId)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                SELECT q.question_id, q.question_type, q.content, q.points, q.explanation,
                       q.tags, q.version, qq.display_order
                FROM quiz.questions q
                INNER JOIN quiz.quiz_questions qq ON q.question_id = qq.question_id
                WHERE qq.quiz_id = @quizId AND q.deleted_at IS NULL
                ORDER BY qq.display_order", conn);

            cmd.Parameters.AddWithValue("@quizId", quizId);
            return await cmd.ExecuteReaderAsync();
        }

        /// <summary>
        /// Creates a new question with JSONB content.
        /// </summary>
        public async Task<Guid> CreateQuestionAsync(
            string questionType,
            object content,
            decimal points,
            string explanation = null,
            string[] tags = null,
            int version = 1)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                INSERT INTO quiz.questions (question_type, content, points, explanation, tags, version)
                VALUES (@questionType, @content::jsonb, @points, @explanation, @tags, @version)
                RETURNING question_id", conn);

            cmd.Parameters.AddWithValue("@questionType", questionType);
            cmd.Parameters.AddWithValue("@content", JsonSerializer.Serialize(content, _jsonOptions));
            cmd.Parameters.AddWithValue("@points", points);
            cmd.Parameters.AddWithValue("@explanation", explanation ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@tags", tags != null ? (object)tags : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@version", version);

            var result = await cmd.ExecuteScalarAsync();
            return (Guid)result;
        }

        /// <summary>
        /// Updates a question's content.
        /// </summary>
        public async Task<bool> UpdateQuestionAsync(
            Guid questionId,
            object content = null,
            decimal? points = null,
            string explanation = null,
            string[] tags = null)
        {
            var conn = await GetConnectionAsync();
            var updates = new List<string>();
            var parameters = new List<NpgsqlParameter>
            {
                new NpgsqlParameter("@questionId", questionId)
            };

            if (content != null)
            {
                updates.Add("content = @content::jsonb");
                parameters.Add(new NpgsqlParameter("@content", JsonSerializer.Serialize(content, _jsonOptions)));
            }

            if (points.HasValue)
            {
                updates.Add("points = @points");
                parameters.Add(new NpgsqlParameter("@points", points.Value));
            }

            if (explanation != null)
            {
                updates.Add("explanation = @explanation");
                parameters.Add(new NpgsqlParameter("@explanation", explanation));
            }

            if (tags != null)
            {
                updates.Add("tags = @tags");
                parameters.Add(new NpgsqlParameter("@tags", NpgsqlDbType.Array | NpgsqlDbType.Text) { Value = tags });
            }

            if (updates.Count == 0)
            {
                return false;
            }

            var sql = $"UPDATE quiz.questions SET {string.Join(", ", updates)} WHERE question_id = @questionId AND deleted_at IS NULL";
            var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddRange(parameters.ToArray());

            var rowsAffected = await cmd.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        /// <summary>
        /// Soft deletes a question.
        /// </summary>
        public async Task<bool> DeleteQuestionAsync(Guid questionId)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                UPDATE quiz.questions 
                SET deleted_at = NOW() 
                WHERE question_id = @questionId AND deleted_at IS NULL", conn);

            cmd.Parameters.AddWithValue("@questionId", questionId);
            var rowsAffected = await cmd.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        #endregion

        #region Quiz-Question Association

        /// <summary>
        /// Associates a question with a quiz at a specific display order.
        /// </summary>
        public async Task<bool> AddQuestionToQuizAsync(Guid quizId, Guid questionId, int displayOrder)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                INSERT INTO quiz.quiz_questions (quiz_id, question_id, display_order)
                VALUES (@quizId, @questionId, @displayOrder)
                ON CONFLICT (quiz_id, question_id) 
                DO UPDATE SET display_order = @displayOrder", conn);

            cmd.Parameters.AddWithValue("@quizId", quizId);
            cmd.Parameters.AddWithValue("@questionId", questionId);
            cmd.Parameters.AddWithValue("@displayOrder", displayOrder);

            await cmd.ExecuteNonQueryAsync();
            return true;
        }

        /// <summary>
        /// Removes a question from a quiz.
        /// </summary>
        public async Task<bool> RemoveQuestionFromQuizAsync(Guid quizId, Guid questionId)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                DELETE FROM quiz.quiz_questions 
                WHERE quiz_id = @quizId AND question_id = @questionId", conn);

            cmd.Parameters.AddWithValue("@quizId", quizId);
            cmd.Parameters.AddWithValue("@questionId", questionId);

            var rowsAffected = await cmd.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        #endregion

        #region Attempt Operations

        /// <summary>
        /// Gets an attempt by ID.
        /// </summary>
        public async Task<NpgsqlDataReader> GetAttemptByIdAsync(Guid attemptId)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                SELECT attempt_id, quiz_id, user_id, started_at, submitted_at,
                       total_score, max_score, status, metadata
                FROM quiz.attempts
                WHERE attempt_id = @attemptId", conn);

            cmd.Parameters.AddWithValue("@attemptId", attemptId);
            return await cmd.ExecuteReaderAsync(CommandBehavior.SingleRow);
        }

        /// <summary>
        /// Gets all attempts for a user.
        /// </summary>
        public async Task<NpgsqlDataReader> GetAttemptsByUserIdAsync(Guid userId, int limit = 50)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                SELECT attempt_id, quiz_id, user_id, started_at, submitted_at,
                       total_score, max_score, status, metadata
                FROM quiz.attempts
                WHERE user_id = @userId
                ORDER BY started_at DESC
                LIMIT @limit", conn);

            cmd.Parameters.AddWithValue("@userId", userId);
            cmd.Parameters.AddWithValue("@limit", limit);
            return await cmd.ExecuteReaderAsync();
        }

        /// <summary>
        /// Creates a new attempt.
        /// </summary>
        public async Task<Guid> CreateAttemptAsync(Guid quizId, Guid userId, object metadata = null)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                INSERT INTO quiz.attempts (quiz_id, user_id, status, metadata)
                VALUES (@quizId, @userId, 'in_progress', @metadata::jsonb)
                RETURNING attempt_id", conn);

            cmd.Parameters.AddWithValue("@quizId", quizId);
            cmd.Parameters.AddWithValue("@userId", userId);
            cmd.Parameters.AddWithValue("@metadata", 
                metadata != null 
                    ? JsonSerializer.Serialize(metadata, _jsonOptions) 
                    : "{}");

            var result = await cmd.ExecuteScalarAsync();
            return (Guid)result;
        }

        /// <summary>
        /// Updates an attempt's status and scores.
        /// </summary>
        public async Task<bool> UpdateAttemptAsync(
            Guid attemptId,
            string status = null,
            decimal? totalScore = null,
            decimal? maxScore = null,
            DateTime? submittedAt = null)
        {
            var conn = await GetConnectionAsync();
            var updates = new List<string>();
            var parameters = new List<NpgsqlParameter>
            {
                new NpgsqlParameter("@attemptId", attemptId)
            };

            if (status != null)
            {
                updates.Add("status = @status");
                parameters.Add(new NpgsqlParameter("@status", status));
            }

            if (totalScore.HasValue)
            {
                updates.Add("total_score = @totalScore");
                parameters.Add(new NpgsqlParameter("@totalScore", totalScore.Value));
            }

            if (maxScore.HasValue)
            {
                updates.Add("max_score = @maxScore");
                parameters.Add(new NpgsqlParameter("@maxScore", maxScore.Value));
            }

            if (submittedAt.HasValue)
            {
                updates.Add("submitted_at = @submittedAt");
                parameters.Add(new NpgsqlParameter("@submittedAt", submittedAt.Value));
            }

            if (updates.Count == 0)
            {
                return false;
            }

            var sql = $"UPDATE quiz.attempts SET {string.Join(", ", updates)} WHERE attempt_id = @attemptId";
            var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddRange(parameters.ToArray());

            var rowsAffected = await cmd.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        #endregion

        #region Response Operations

        /// <summary>
        /// Gets all responses for an attempt.
        /// </summary>
        public async Task<NpgsqlDataReader> GetResponsesByAttemptIdAsync(Guid attemptId)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                SELECT response_id, attempt_id, question_id, answer_payload, submitted_at,
                       points_earned, points_possible, is_correct, grading_details, graded_at
                FROM quiz.responses
                WHERE attempt_id = @attemptId
                ORDER BY submitted_at", conn);

            cmd.Parameters.AddWithValue("@attemptId", attemptId);
            return await cmd.ExecuteReaderAsync();
        }

        /// <summary>
        /// Creates or updates a response (upsert).
        /// </summary>
        public async Task<Guid> UpsertResponseAsync(
            Guid attemptId,
            Guid questionId,
            object answerPayload,
            decimal? pointsEarned = null,
            decimal? pointsPossible = null,
            bool? isCorrect = null,
            object gradingDetails = null)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                INSERT INTO quiz.responses (attempt_id, question_id, answer_payload, points_earned, points_possible, is_correct, grading_details, graded_at)
                VALUES (@attemptId, @questionId, @answerPayload::jsonb, @pointsEarned, @pointsPossible, @isCorrect, @gradingDetails::jsonb, 
                        CASE WHEN @pointsEarned IS NOT NULL THEN NOW() ELSE NULL END)
                ON CONFLICT (attempt_id, question_id)
                DO UPDATE SET 
                    answer_payload = EXCLUDED.answer_payload,
                    points_earned = EXCLUDED.points_earned,
                    points_possible = EXCLUDED.points_possible,
                    is_correct = EXCLUDED.is_correct,
                    grading_details = EXCLUDED.grading_details,
                    graded_at = EXCLUDED.graded_at,
                    submitted_at = NOW()
                RETURNING response_id", conn);

            cmd.Parameters.AddWithValue("@attemptId", attemptId);
            cmd.Parameters.AddWithValue("@questionId", questionId);
            cmd.Parameters.AddWithValue("@answerPayload", JsonSerializer.Serialize(answerPayload, _jsonOptions));
            cmd.Parameters.AddWithValue("@pointsEarned", pointsEarned.HasValue ? (object)pointsEarned.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@pointsPossible", pointsPossible.HasValue ? (object)pointsPossible.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@isCorrect", isCorrect.HasValue ? (object)isCorrect.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@gradingDetails", 
                gradingDetails != null 
                    ? JsonSerializer.Serialize(gradingDetails, _jsonOptions) 
                    : (object)DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            return (Guid)result;
        }

        #endregion

        #region Content Operations

        /// <summary>
        /// Gets content by key and type.
        /// </summary>
        public async Task<NpgsqlDataReader> GetContentAsync(string contentKey, string contentType)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                SELECT content_id, content_key, content_type, translations, metadata
                FROM quiz.content
                WHERE content_key = @contentKey AND content_type = @contentType", conn);

            cmd.Parameters.AddWithValue("@contentKey", contentKey);
            cmd.Parameters.AddWithValue("@contentType", contentType);
            return await cmd.ExecuteReaderAsync(CommandBehavior.SingleRow);
        }

        /// <summary>
        /// Creates or updates content (upsert).
        /// </summary>
        public async Task<Guid> UpsertContentAsync(
            string contentKey,
            string contentType,
            object translations,
            object metadata = null)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                INSERT INTO content (content_key, content_type, translations, metadata)
                VALUES (@contentKey, @contentType, @translations::jsonb, @metadata::jsonb)
                ON CONFLICT (content_key, content_type)
                DO UPDATE SET 
                    translations = EXCLUDED.translations,
                    metadata = EXCLUDED.metadata,
                    updated_at = NOW()
                RETURNING content_id", conn);

            cmd.Parameters.AddWithValue("@contentKey", contentKey);
            cmd.Parameters.AddWithValue("@contentType", contentType);
            cmd.Parameters.AddWithValue("@translations", JsonSerializer.Serialize(translations, _jsonOptions));
            cmd.Parameters.AddWithValue("@metadata", 
                metadata != null 
                    ? JsonSerializer.Serialize(metadata, _jsonOptions) 
                    : "{}");

            var result = await cmd.ExecuteScalarAsync();
            return (Guid)result;
        }

        #endregion

        #region Audit Log Operations

        /// <summary>
        /// Creates an audit log entry.
        /// </summary>
        public async Task<Guid> LogAuditAsync(
            string eventType,
            string actorType = null,
            Guid? actorId = null,
            string resourceType = null,
            Guid? resourceId = null,
            object payload = null,
            string ipAddress = null)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(@"
                INSERT INTO quiz.audit_log (event_type, actor_type, actor_id, resource_type, resource_id, payload, created_by_ip)
                VALUES (@eventType, @actorType, @actorId, @resourceType, @resourceId, @payload::jsonb, @ipAddress::inet)
                RETURNING audit_log_id", conn);

            cmd.Parameters.AddWithValue("@eventType", eventType);
            cmd.Parameters.AddWithValue("@actorType", actorType ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@actorId", actorId.HasValue ? (object)actorId.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@resourceType", resourceType ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@resourceId", resourceId.HasValue ? (object)resourceId.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@payload", 
                payload != null 
                    ? JsonSerializer.Serialize(payload, _jsonOptions) 
                    : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ipAddress", ipAddress ?? (object)DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            return (Guid)result;
        }

        /// <summary>
        /// Gets recent audit logs with optional filtering.
        /// </summary>
        public async Task<NpgsqlDataReader> GetAuditLogsAsync(
            string eventType = null,
            string resourceType = null,
            Guid? resourceId = null,
            int limit = 100)
        {
            var conn = await GetConnectionAsync();
            var sql = @"
                SELECT audit_log_id, occurred_at, actor_type, actor_id, event_type,
                       resource_type, resource_id, payload, created_by_ip
                FROM quiz.audit_log
                WHERE 1=1";

            var parameters = new List<NpgsqlParameter>();

            if (!string.IsNullOrEmpty(eventType))
            {
                sql += " AND event_type = @eventType";
                parameters.Add(new NpgsqlParameter("@eventType", eventType));
            }

            if (!string.IsNullOrEmpty(resourceType))
            {
                sql += " AND resource_type = @resourceType";
                parameters.Add(new NpgsqlParameter("@resourceType", resourceType));
            }

            if (resourceId.HasValue)
            {
                sql += " AND resource_id = @resourceId";
                parameters.Add(new NpgsqlParameter("@resourceId", resourceId.Value));
            }

            sql += " ORDER BY occurred_at DESC LIMIT @limit";
            parameters.Add(new NpgsqlParameter("@limit", limit));

            var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddRange(parameters.ToArray());

            return await cmd.ExecuteReaderAsync();
        }

        #endregion

        #region Helper Methods

        /// <summary>
        /// Executes a raw SQL query and returns a data reader.
        /// Use with caution - prefer typed methods above.
        /// </summary>
        public async Task<NpgsqlDataReader> ExecuteQueryAsync(string sql, params NpgsqlParameter[] parameters)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(sql, conn);
            
            if (parameters != null && parameters.Length > 0)
            {
                cmd.Parameters.AddRange(parameters);
            }

            return await cmd.ExecuteReaderAsync();
        }

        /// <summary>
        /// Executes a raw SQL command (INSERT/UPDATE/DELETE) and returns rows affected.
        /// Use with caution - prefer typed methods above.
        /// </summary>
        public async Task<int> ExecuteNonQueryAsync(string sql, params NpgsqlParameter[] parameters)
        {
            var conn = await GetConnectionAsync();
            var cmd = new NpgsqlCommand(sql, conn);
            
            if (parameters != null && parameters.Length > 0)
            {
                cmd.Parameters.AddRange(parameters);
            }

            return await cmd.ExecuteNonQueryAsync();
        }

        #endregion

        #region IDisposable

        public void Dispose()
        {
            _connection?.Dispose();
        }

        #endregion
    }
}


