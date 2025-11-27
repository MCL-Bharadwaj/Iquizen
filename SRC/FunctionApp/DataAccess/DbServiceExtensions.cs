using System;
using Microsoft.Extensions.DependencyInjection;

namespace Quizz.DataAccess
{
    /// <summary>
    /// Extension methods for registering DbService with dependency injection.
    /// Used by Azure Functions startup configuration.
    /// </summary>
    public static class DbServiceExtensions
    {
        /// <summary>
        /// Registers IDbService as a scoped service for dependency injection.
        /// Connection string should be retrieved from environment variables or configuration.
        /// </summary>
        /// <param name="services">Service collection</param>
        /// <param name="connectionString">PostgreSQL connection string</param>
        /// <returns>Service collection for chaining</returns>
        public static IServiceCollection AddDbService(
            this IServiceCollection services, 
            string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new ArgumentException("Connection string cannot be null or empty", nameof(connectionString));
            }

            // Register as scoped - new instance per Azure Function invocation
            services.AddScoped<IDbService>(sp => new DbService(connectionString));

            return services;
        }

        /// <summary>
        /// Registers IDbService with a factory pattern for more complex initialization.
        /// </summary>
        /// <param name="services">Service collection</param>
        /// <param name="factory">Factory function to create IDbService</param>
        /// <returns>Service collection for chaining</returns>
        public static IServiceCollection AddDbService(
            this IServiceCollection services,
            Func<IServiceProvider, IDbService> factory)
        {
            if (factory == null)
            {
                throw new ArgumentNullException(nameof(factory));
            }

            services.AddScoped(factory);

            return services;
        }

        /// <summary>
        /// Registers IDbServiceFactory as a singleton for creating IDbService instances on-demand.
        /// Useful for multi-tenant scenarios or dynamic connection string selection.
        /// </summary>
        /// <param name="services">Service collection</param>
        /// <param name="defaultConnectionString">Default PostgreSQL connection string</param>
        /// <returns>Service collection for chaining</returns>
        public static IServiceCollection AddDbServiceFactory(
            this IServiceCollection services,
            string defaultConnectionString)
        {
            if (string.IsNullOrWhiteSpace(defaultConnectionString))
            {
                throw new ArgumentException("Connection string cannot be null or empty", nameof(defaultConnectionString));
            }

            // Register factory as singleton - it only holds connection string(s)
            services.AddSingleton<IDbServiceFactory>(sp => new DbServiceFactory(defaultConnectionString));

            return services;
        }

        /// <summary>
        /// Registers IDbServiceFactory with a custom factory implementation.
        /// </summary>
        /// <param name="services">Service collection</param>
        /// <param name="factoryImplementation">Custom factory function</param>
        /// <returns>Service collection for chaining</returns>
        public static IServiceCollection AddDbServiceFactory(
            this IServiceCollection services,
            Func<IServiceProvider, IDbServiceFactory> factoryImplementation)
        {
            if (factoryImplementation == null)
            {
                throw new ArgumentNullException(nameof(factoryImplementation));
            }

            services.AddSingleton(factoryImplementation);

            return services;
        }
    }
}


