using System;

namespace Quizz.DataAccess
{
    /// <summary>
    /// Factory interface for creating IDbService instances.
    /// Useful for multi-tenant scenarios or connection string rotation.
    /// </summary>
    public interface IDbServiceFactory
    {
        /// <summary>
        /// Creates a new IDbService instance with the default connection string.
        /// </summary>
        IDbService Create();

        /// <summary>
        /// Creates a new IDbService instance with a specific connection string.
        /// </summary>
        /// <param name="connectionString">PostgreSQL connection string</param>
        IDbService Create(string connectionString);
    }

    /// <summary>
    /// Default implementation of IDbServiceFactory.
    /// </summary>
    public class DbServiceFactory : IDbServiceFactory
    {
        private readonly string _defaultConnectionString;

        /// <summary>
        /// Initializes a new instance of DbServiceFactory.
        /// </summary>
        /// <param name="defaultConnectionString">Default PostgreSQL connection string</param>
        public DbServiceFactory(string defaultConnectionString)
        {
            _defaultConnectionString = defaultConnectionString 
                ?? throw new ArgumentNullException(nameof(defaultConnectionString));
        }

        /// <summary>
        /// Creates a new IDbService instance with the default connection string.
        /// </summary>
        public IDbService Create()
        {
            return new DbService(_defaultConnectionString);
        }

        /// <summary>
        /// Creates a new IDbService instance with a specific connection string.
        /// Useful for multi-tenant scenarios where each tenant has a separate database.
        /// </summary>
        /// <param name="connectionString">PostgreSQL connection string</param>
        public IDbService Create(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new ArgumentException("Connection string cannot be null or empty", nameof(connectionString));
            }

            return new DbService(connectionString);
        }
    }
}


