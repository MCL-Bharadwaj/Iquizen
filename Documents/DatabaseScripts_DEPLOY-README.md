# Database Deployment - Quick Reference

## One-Command Deployment

```powershell
cd c:\CodeBase\Quizz\DatabaseScripts
.\Deploy-Database.ps1 -PromptForPassword
```

That's it! The script will:
- ✅ Create database if needed
- ✅ Run all migrations in order
- ✅ Track execution in schema_versions table
- ✅ Display summary

## Parameters

```powershell
.\Deploy-Database.ps1 `
    -Server "localhost" `         # Default: localhost
    -Port 5432 `                  # Default: 5432
    -Database "quizdb" `          # Default: quizdb
    -Username "postgres" `        # Default: postgres
    -Password "secret" `          # Or use -PromptForPassword
    -WhatIf                       # Preview only, no changes
```

## Prerequisites

```powershell
# Install PostgreSQL (includes psql)
winget install PostgreSQL.PostgreSQL

# Verify
psql --version
```

## Verify Deployment

```sql
-- Check applied migrations
SELECT version_number, description, applied_at 
FROM schema_versions 
ORDER BY applied_at;

-- List all tables
\dt
```

## Create Test API Key

```sql
INSERT INTO api_keys (key_hash, key_prefix, name, scopes, is_active)
VALUES (
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'test_key',
    'Test Key',
    ARRAY['quiz:read', 'quiz:write', 'quiz:delete'],
    true
);
-- Password: test_key_12345
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `psql not found` | Install PostgreSQL: `winget install PostgreSQL.PostgreSQL` |
| `Connection refused` | Start PostgreSQL: `Start-Service postgresql*` |
| `Auth failed` | Check username/password |
| `Permission denied` | Grant CREATEDB: `ALTER USER postgres CREATEDB;` |

## Full Documentation

See `DEPLOYMENT.md` for complete guide including CI/CD integration, rollback procedures, and security best practices.
