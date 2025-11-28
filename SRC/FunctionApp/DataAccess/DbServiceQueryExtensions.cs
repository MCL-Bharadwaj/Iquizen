using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using Npgsql;

namespace Quizz.DataAccess
{
    /// <summary>
    /// Extension methods for IDbService to provide Dapper-like query capabilities.
    /// These methods enable type-safe deserialization of database results.
    /// </summary>
    public static class DbServiceQueryExtensions
    {
        /// <summary>
        /// Executes a query and deserializes all rows into a list of objects of type T.
        /// </summary>
        public static async Task<List<T>> QueryAsync<T>(
            this IDbService dbService,
            string sql,
            object? parameters = null) where T : new()
        {
            var npgsqlParameters = ConvertParametersToNpgsqlParameters(parameters);
            var reader = await dbService.ExecuteQueryAsync(sql, npgsqlParameters);

            var results = new List<T>();
            try
            {
                while (await reader.ReadAsync())
                {
                    var item = new T();
                    MapReaderToObject(reader, item);
                    results.Add(item);
                }
            }
            finally
            {
                await reader.DisposeAsync();
            }

            return results;
        }

        /// <summary>
        /// Executes a query and deserializes the first row into an object of type T.
        /// Returns null if no rows are found.
        /// </summary>
        public static async Task<T?> QuerySingleAsync<T>(
            this IDbService dbService,
            string sql,
            object? parameters = null) where T : new()
        {
            var npgsqlParameters = ConvertParametersToNpgsqlParameters(parameters);
            var reader = await dbService.ExecuteQueryAsync(sql, npgsqlParameters);

            try
            {
                if (await reader.ReadAsync())
                {
                    var item = new T();
                    MapReaderToObject(reader, item);
                    return item;
                }

                return default;
            }
            finally
            {
                await reader.DisposeAsync();
            }
        }

        /// <summary>
        /// Executes a query and returns the first column of the first row as type T.
        /// Returns default(T) if no rows are found.
        /// </summary>
        public static async Task<T?> QueryFirstAsync<T>(
            this IDbService dbService,
            string sql,
            object? parameters = null)
        {
            var npgsqlParameters = ConvertParametersToNpgsqlParameters(parameters);
            var reader = await dbService.ExecuteQueryAsync(sql, npgsqlParameters);

            try
            {
                if (await reader.ReadAsync())
                {
                    return reader.IsDBNull(0) ? default : (T)reader.GetValue(0);
                }

                return default;
            }
            finally
            {
                await reader.DisposeAsync();
            }
        }

        /// <summary>
        /// Executes a query and returns all values in the first column as a list.
        /// </summary>
        public static async Task<List<T>> QueryScalarListAsync<T>(
            this IDbService dbService,
            string sql,
            object? parameters = null)
        {
            var npgsqlParameters = ConvertParametersToNpgsqlParameters(parameters);
            var reader = await dbService.ExecuteQueryAsync(sql, npgsqlParameters);

            var results = new List<T>();
            try
            {
                while (await reader.ReadAsync())
                {
                    if (!reader.IsDBNull(0))
                    {
                        results.Add((T)reader.GetValue(0));
                    }
                }
            }
            finally
            {
                await reader.DisposeAsync();
            }

            return results;
        }

        /// <summary>
        /// Converts an anonymous object to NpgsqlParameter array.
        /// Example: new { QuizId = quizId, UserId = userId } becomes
        /// [@QuizId, @UserId] parameters
        /// </summary>
        private static NpgsqlParameter[] ConvertParametersToNpgsqlParameters(object? parameters)
        {
            if (parameters == null)
                return Array.Empty<NpgsqlParameter>();

            var paramList = new List<NpgsqlParameter>();
            var properties = parameters.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);

            foreach (var prop in properties)
            {
                var paramName = "@" + prop.Name;
                var value = prop.GetValue(parameters) ?? DBNull.Value;
                paramList.Add(new NpgsqlParameter(paramName, value));
            }

            return paramList.ToArray();
        }

        /// <summary>
        /// Maps a NpgsqlDataReader row to an object's properties.
        /// Handles type conversion and null values automatically.
        /// </summary>
        private static void MapReaderToObject<T>(NpgsqlDataReader reader, T obj) where T : new()
        {
            var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);

            for (int i = 0; i < reader.FieldCount; i++)
            {
                var fieldName = reader.GetName(i);
                var property = Array.Find(properties, p => 
                    p.Name.Equals(fieldName, StringComparison.OrdinalIgnoreCase));

                if (property != null && property.CanWrite)
                {
                    var value = reader.IsDBNull(i) ? null : reader.GetValue(i);

                    try
                    {
                        if (value != null)
                        {
                            // Handle JSONB fields - deserialize them
                            if (property.PropertyType == typeof(object) || property.PropertyType.Name.Contains("Dictionary") || property.PropertyType.Name.Contains("List"))
                            {
                                if (value is string jsonString)
                                {
                                    value = JsonSerializer.Deserialize(jsonString, property.PropertyType);
                                }
                            }
                            else if (!property.PropertyType.IsAssignableFrom(value.GetType()))
                            {
                                // Try to convert if types don't match
                                value = Convert.ChangeType(value, property.PropertyType);
                            }
                        }

                        property.SetValue(obj, value);
                    }
                    catch
                    {
                        // Silently skip fields that can't be mapped
                    }
                }
            }
        }
    }
}
