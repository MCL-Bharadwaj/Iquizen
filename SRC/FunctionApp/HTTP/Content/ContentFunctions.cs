using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Npgsql;

using Quizz.Common.Services;
using Quizz.DataAccess;
using Quizz.Functions.Helpers;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace Quizz.Functions.Endpoints.Content
{
    /// <summary>
    /// Content and i18n translation endpoints
    /// </summary>
    public class ContentFunctions
    {
        private readonly IDbService _dbService;
        private readonly ILogger<ContentFunctions> _logger;
        private readonly AuthorizationService _authService;

        public ContentFunctions(
            IDbService dbService,
            ILogger<ContentFunctions> logger,
            AuthorizationService authService)
        {
            _dbService = dbService ?? throw new ArgumentNullException(nameof(dbService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        }

        [Function("GetContent")]
        [OpenApiOperation(
            operationId: "GetContent",
            tags: new[] { "Content" },
            Summary = "Get translations by locale",
            Description = "Retrieves all translations for a specific locale.")]
        [OpenApiParameter(
            name: "locale",
            In = ParameterLocation.Query,
            Required = false,
            Type = typeof(string),
            Description = "Locale code (e.g., 'en-US', 'es-ES'). Default: 'en-US'")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Successfully retrieved translations")]
        public async Task<HttpResponseData> GetContent(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "content")] HttpRequestData req)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Student", "Tutors", "Content Creator", "Player");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
                var locale = query["locale"] ?? "en-US";

                // Get all content items and filter translations by the requested locale
                var sql = @"
                    SELECT content_id, content_key, content_type, translations, created_at, updated_at
                    FROM quiz.content";

                using var reader = await _dbService.ExecuteQueryAsync(sql);

                var localeTranslations = new Dictionary<string, object>();
                while (await reader.ReadAsync())
                {
                    var contentKey = reader.GetString(1);
                    var translationsJson = reader.GetString(3);
                    var translations = JsonSerializer.Deserialize<Dictionary<string, object>>(translationsJson);
                    
                    if (translations != null && translations.ContainsKey(locale))
                    {
                        localeTranslations[contentKey] = translations[locale];
                    }
                }

                if (localeTranslations.Count == 0)
                {
                    return await ResponseHelper.NotFoundAsync(req, $"No content found for locale '{locale}'");
                }

                var content = new
                {
                    locale,
                    translations = localeTranslations,
                    count = localeTranslations.Count
                };

                _logger.LogInformation($"Retrieved {localeTranslations.Count} translations for locale {locale} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving content");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve content");
            }
        }

        [Function("GetAllContent")]
        [OpenApiOperation(
            operationId: "GetAllContent",
            tags: new[] { "Content" },
            Summary = "Get all available locales",
            Description = "Retrieves a list of all available locales with their translations. No API key required.")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Successfully retrieved all content")]
        public async Task<HttpResponseData> GetAllContent(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "content/all")] HttpRequestData req)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Student", "Tutors", "Content Creator", "Player");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                var sql = @"
                    SELECT content_id, content_key, content_type, translations, created_at, updated_at
                    FROM quiz.content
                    ORDER BY content_key";

                using var reader = await _dbService.ExecuteQueryAsync(sql);

                var contentList = new List<object>();
                while (await reader.ReadAsync())
                {
                    var translationsJson = reader.GetString(3);
                    var translations = JsonSerializer.Deserialize<Dictionary<string, object>>(translationsJson) ?? new Dictionary<string, object>();

                    contentList.Add(new
                    {
                        contentId = reader.GetGuid(0),
                        contentKey = reader.GetString(1),
                        contentType = reader.GetString(2),
                        translations,
                        createdAt = reader.GetDateTime(4),
                        updatedAt = reader.GetDateTime(5)
                    });
                }

                var response = new
                {
                    content = contentList,
                    count = contentList.Count
                };

                _logger.LogInformation($"Retrieved {contentList.Count} content locales in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all content");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve content");
            }
        }

        [Function("UpdateContent")]
        [OpenApiOperation(
            operationId: "UpdateContent",
            tags: new[] { "Content" },
            Summary = "Update translations for a locale",
            Description = "Updates or creates translations for a specific locale.")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiParameter(
            name: "locale",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(string),
            Description = "Locale code (e.g., 'en-US', 'es-ES')")]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(Dictionary<string, string>),
            Required = true,
            Description = "Translation key-value pairs")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Content updated successfully")]
        public async Task<HttpResponseData> UpdateContent(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "content/{locale}")] HttpRequestData req,
            string locale)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Student", "Tutors", "Content Creator", "Player");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // Uncomment when you want to use API key authentication instead of LMS session auth
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "content:write", stopwatch);
                // if (errorResponse != null) return errorResponse;

                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: content_creator, admin

                // Upsert content - expecting request body like:
                // { "en-US": "value1", "es-ES": "valor1" }
                // This will update/create a single content row with translations JSONB
                
                Dictionary<string, string>? translations;
                try
                {
                    translations = await JsonSerializer.DeserializeAsync<Dictionary<string, string>>(req.Body);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid JSON in request body");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid JSON format");
                }

                if (translations == null || translations.Count == 0)
                {
                    return await ResponseHelper.BadRequestAsync(req, "Translations are required");
                }

                var translationsJson = JsonSerializer.Serialize(translations);

                // Upsert content by content_key (which is passed in locale parameter - should rename route)
                var sql = @"
                    INSERT INTO quiz.content (content_id, content_key, content_type, translations, created_at, updated_at)
                    VALUES (gen_random_uuid(), @content_key, 'i18n', @translations::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON CONFLICT (content_key, content_type) 
                    DO UPDATE SET 
                        translations = EXCLUDED.translations,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING content_id, content_key, content_type, translations, created_at, updated_at";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("content_key", locale),
                    new NpgsqlParameter("translations", translationsJson));

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.InternalServerErrorAsync(req, "Failed to update content");
                }

                var translationsResult = reader.GetString(3);
                var translationsObject = JsonSerializer.Deserialize<Dictionary<string, string>>(translationsResult) ?? new Dictionary<string, string>();

                var content = new
                {
                    contentId = reader.GetGuid(0),
                    contentKey = reader.GetString(1),
                    contentType = reader.GetString(2),
                    translations = translationsObject,
                    createdAt = reader.GetDateTime(4),
                    updatedAt = reader.GetDateTime(5)
                };

                // API Key Usage Logging (Commented out for LMS integration)
                // if (validation?.ApiKey != null)
                // {
                //     await AuthHelper.LogSuccessfulUsageAsync(req, _apiKeyService, validation.ApiKey.ApiKeyId, "UpdateContent", 200, stopwatch);
                // }

                _logger.LogInformation($"Updated content for key {locale} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating content for locale {locale}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to update content");
            }
        }

        [Function("GetTranslation")]
        [OpenApiOperation(
            operationId: "GetTranslation",
            tags: new[] { "Content" },
            Summary = "Get a specific translation",
            Description = "Retrieves a specific translation key for a locale. No API key required.")]
        [OpenApiParameter(
            name: "locale",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(string),
            Description = "Locale code")]
        [OpenApiParameter(
            name: "key",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(string),
            Description = "Translation key")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Successfully retrieved translation")]
        public async Task<HttpResponseData> GetTranslation(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "content/{locale}/{key}")] HttpRequestData req,
            string locale,
            string key)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Student", "Tutors", "Content Creator", "Player");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                var sql = @"
                    SELECT translations
                    FROM quiz.content
                    WHERE content_key = @content_key AND content_type = 'i18n'";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("content_key", key));

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.NotFoundAsync(req, $"Translation key '{key}' not found");
                }

                var translationsJson = reader.GetString(0);
                var translations = JsonSerializer.Deserialize<Dictionary<string, object>>(translationsJson);

                if (translations == null || !translations.ContainsKey(locale))
                {
                    return await ResponseHelper.NotFoundAsync(req, $"Translation key '{key}' not found for locale '{locale}'");
                }

                var value = translations[locale];

                var response = new
                {
                    locale,
                    key,
                    value
                };

                _logger.LogInformation($"Retrieved translation {key} for locale {locale} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving translation {key} for locale {locale}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve translation");
            }
        }
    }
}


