# Database Deployment Guide

## 🚀 Quick Start

### Prerequisites
- PostgreSQL 14+ installed
- `psql` command-line tool
- Database user with CREATE DATABASE privileges

### Local Development Setup

#### 1. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE quiz_db;

# Exit
\q
```

#### 2. Run Migration Scripts
```bash
cd DatabaseScripts

# Run in order
psql -U postgres -d quiz_db -f 000_migration_setup.sql
psql -U postgres -d quiz_db -f 001_core_schema.sql
psql -U postgres -d quiz_db -f 002_indexes_constraints.sql
psql -U postgres -d quiz_db -f 003_seed_data.sql
```

#### 3. Verify Installation
```bash
psql -U postgres -d quiz_db -c "SELECT * FROM schema_versions;"
psql -U postgres -d quiz_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

---

## ☁️ Azure Database for PostgreSQL Deployment

### Option 1: Azure Portal

#### Step 1: Create Azure PostgreSQL Server
```bash
# Using Azure CLI
az postgres flexible-server create \
  --resource-group quiz-rg \
  --name quiz-db-server \
  --location eastus \
  --admin-user quizadmin \
  --admin-password YourSecurePassword123! \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0
```

#### Step 2: Create Database
```bash
az postgres flexible-server db create \
  --resource-group quiz-rg \
  --server-name quiz-db-server \
  --database-name quiz_db
```

#### Step 3: Configure Firewall
```bash
# Allow your IP
az postgres flexible-server firewall-rule create \
  --resource-group quiz-rg \
  --name quiz-db-server \
  --rule-name AllowMyIP \
  --start-ip-address YOUR_IP_ADDRESS \
  --end-ip-address YOUR_IP_ADDRESS

# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group quiz-rg \
  --name quiz-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

#### Step 4: Connect and Run Scripts
```bash
# Get connection string
az postgres flexible-server show-connection-string \
  --server-name quiz-db-server

# Connect
psql "host=quiz-db-server.postgres.database.azure.com port=5432 dbname=quiz_db user=quizadmin password=YourSecurePassword123! sslmode=require"

# Run scripts
\i 000_migration_setup.sql
\i 001_core_schema.sql
\i 002_indexes_constraints.sql
\i 003_seed_data.sql
```

### Option 2: Using Connection String

#### Environment Variables
```bash
# .env file
DB_HOST=quiz-db-server.postgres.database.azure.com
DB_PORT=5432
DB_NAME=quiz_db
DB_USER=quizadmin
DB_PASSWORD=YourSecurePassword123!
DB_SSL_MODE=require
```

#### Deploy Script
```bash
#!/bin/bash
# deploy-to-azure.sh

set -e

echo "🚀 Deploying database scripts to Azure..."

PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f 000_migration_setup.sql

PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f 001_core_schema.sql

PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f 002_indexes_constraints.sql

PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f 003_seed_data.sql

echo "✅ Database deployment complete!"
```

```bash
chmod +x deploy-to-azure.sh
./deploy-to-azure.sh
```

---

## 🐳 Docker Deployment

### Local PostgreSQL with Docker

#### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: quiz-postgres
    environment:
      POSTGRES_DB: quiz_db
      POSTGRES_USER: quizuser
      POSTGRES_PASSWORD: quizpass123
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./DatabaseScripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U quizuser -d quiz_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

#### Start Container
```bash
# Start PostgreSQL
docker-compose up -d

# Check logs
docker-compose logs -f postgres

# Connect
docker exec -it quiz-postgres psql -U quizuser -d quiz_db

# Stop
docker-compose down
```

---

## 🔐 Security Configuration

### Create Application User
```sql
-- Create read-only user for reporting
CREATE USER quiz_readonly WITH PASSWORD 'ReadOnlyPass123!';
GRANT CONNECT ON DATABASE quiz_db TO quiz_readonly;
GRANT USAGE ON SCHEMA public TO quiz_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO quiz_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO quiz_readonly;

-- Create app user with CRUD privileges
CREATE USER quiz_app WITH PASSWORD 'AppPass123!';
GRANT CONNECT ON DATABASE quiz_db TO quiz_app;
GRANT USAGE ON SCHEMA public TO quiz_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO quiz_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO quiz_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO quiz_app;
```

### Enable SSL (Azure)
```sql
-- Verify SSL is enabled
SHOW ssl;

-- Force SSL connections
ALTER SYSTEM SET ssl = on;
SELECT pg_reload_conf();
```

### Row-Level Security Example
```sql
-- Enable RLS on attempts table
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own attempts
CREATE POLICY user_attempts_policy ON attempts
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true));

-- Set user context in application
SET app.current_user_id = 'user_12345';
```

---

## 📊 Monitoring & Maintenance

### Check Database Size
```sql
SELECT 
    pg_size_pretty(pg_database_size('quiz_db')) as database_size;
```

### Check Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Vacuum and Analyze
```bash
# Run maintenance
psql -U postgres -d quiz_db -c "VACUUM ANALYZE;"

# Check last vacuum times
psql -U postgres -d quiz_db -c "
SELECT 
    schemaname,
    relname,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public';
"
```

---

## 🔄 Backup & Restore

### Backup Database

#### Full Backup
```bash
# Local backup
pg_dump -U postgres -d quiz_db -F c -f quiz_db_backup_$(date +%Y%m%d).dump

# Azure backup
pg_dump -h quiz-db-server.postgres.database.azure.com \
        -U quizadmin \
        -d quiz_db \
        -F c \
        -f quiz_db_backup_$(date +%Y%m%d).dump
```

#### Schema Only
```bash
pg_dump -U postgres -d quiz_db --schema-only -f quiz_schema.sql
```

#### Data Only
```bash
pg_dump -U postgres -d quiz_db --data-only -f quiz_data.sql
```

### Restore Database

#### From Dump File
```bash
# Create new database
createdb -U postgres quiz_db_restored

# Restore
pg_restore -U postgres -d quiz_db_restored quiz_db_backup_20251108.dump
```

#### From SQL File
```bash
psql -U postgres -d quiz_db_restored -f quiz_schema.sql
psql -U postgres -d quiz_db_restored -f quiz_data.sql
```

---

## 🧪 Testing Scripts

### Validate Schema
```bash
# test-schema.sh
#!/bin/bash

echo "🧪 Testing database schema..."

# Test 1: Check tables exist
echo "✓ Checking tables..."
TABLES=$(psql -U postgres -d quiz_db -t -c "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
")
echo "Found $TABLES tables (expected: 9)"

# Test 2: Check indexes
echo "✓ Checking indexes..."
INDEXES=$(psql -U postgres -d quiz_db -t -c "
    SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
")
echo "Found $INDEXES indexes"

# Test 3: Check sample data
echo "✓ Checking sample data..."
QUIZZES=$(psql -U postgres -d quiz_db -t -c "SELECT COUNT(*) FROM quizzes;")
QUESTIONS=$(psql -U postgres -d quiz_db -t -c "SELECT COUNT(*) FROM questions;")
echo "Found $QUIZZES quizzes and $QUESTIONS questions"

# Test 4: Check migrations
echo "✓ Checking migrations..."
psql -U postgres -d quiz_db -c "SELECT version_number, status FROM schema_versions ORDER BY version_id;"

echo "✅ Schema validation complete!"
```

```bash
chmod +x test-schema.sh
./test-schema.sh
```

---

## 🔧 Troubleshooting

### Extension Not Found
```sql
-- Install extensions manually
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Permission Denied
```sql
-- Grant superuser temporarily
ALTER USER quizadmin WITH SUPERUSER;

-- Revoke after setup
ALTER USER quizadmin WITH NOSUPERUSER;
```

### Connection Issues (Azure)
```bash
# Test connection
psql "host=quiz-db-server.postgres.database.azure.com port=5432 dbname=postgres user=quizadmin sslmode=require"

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group quiz-rg \
  --name quiz-db-server
```

### Migration Failed
```sql
-- Check migration status
SELECT * FROM schema_versions WHERE status = 'failed';

-- Check error logs
SELECT * FROM migration_log WHERE log_level = 'ERROR';

-- Rollback (manually drop objects and retry)
```

---

## 📝 Post-Deployment Checklist

- [ ] Database created successfully
- [ ] All 4 migration scripts executed
- [ ] 7 core tables exist
- [ ] Sample data inserted (3 quizzes, 7 questions)
- [ ] Indexes created (35+)
- [ ] Extensions enabled (uuid-ossp, pgcrypto)
- [ ] Application user created with proper permissions
- [ ] SSL/TLS configured (for Azure)
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring enabled
- [ ] Connection string stored securely

---

## 🔗 Connection Strings

### Local Development
```
postgresql://quizuser:quizpass123@localhost:5432/quiz_db
```

### Azure PostgreSQL
```
postgresql://quizadmin:YourPassword@quiz-db-server.postgres.database.azure.com:5432/quiz_db?sslmode=require
```

### Connection String for .NET (Azure Functions)
```
Host=quiz-db-server.postgres.database.azure.com;Database=quiz_db;Username=quizadmin;Password=YourPassword;SSL Mode=Require;Trust Server Certificate=true
```

### Connection String for Node.js
```javascript
const config = {
  host: 'quiz-db-server.postgres.database.azure.com',
  database: 'quiz_db',
  user: 'quizadmin',
  password: 'YourPassword',
  port: 5432,
  ssl: { rejectUnauthorized: false }
};
```

---

## 📚 Additional Resources

- [PostgreSQL 14 Documentation](https://www.postgresql.org/docs/14/)
- [Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [JSONB Performance](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-08
