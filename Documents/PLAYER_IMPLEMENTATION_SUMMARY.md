# Player Role & Table Implementation - Summary

## Date: November 26, 2025

## Changes Completed

### 1. Role Update (✅ Complete)
- Updated `AuthorizationService.cs`:
  - Changed comment from "Check if user has Student role" to "Check if user has Player role"
  - Simplified `IsPlayer` property to check only for "player" role
  - Removed duplicate condition

### 2. Entity Renaming (✅ Complete)
- Renamed `Student.cs` → `Player.cs`
- Updated `Player` entity class:
  - `StudentId` → `PlayerId`
  - `StudentNumber` → `PlayerNumber` 
  - Changed schema from `lms.students` to `quiz.players`
  - Changed table from `students` to `players`
  - Removed educational properties (emergency contacts, special needs, learning preferences, grade level)
  - Added gaming properties:
    - `TotalScore` (int) - cumulative score across all games
    - `GamesPlayed` (int) - total number of quizzes completed
    - `IsActive` (bool) - whether player account is active
  - Kept dates: `EnrollmentDate`, `GraduationDate` (optional)

### 3. User Entity Update (✅ Complete)
- Updated `User.cs`:
  - `Student? Student` navigation property → `Player? Player`
  - Updated comments from "Student" to "Player"

### 4. Database Script Created (✅ Complete)
- Created `016_players.sql` in `SRC/DatabaseScripts/`:
  - Creates `quiz.players` table with proper schema
  - Includes indexes for performance:
    - `idx_players_user_id`
    - `idx_players_player_number`
    - `idx_players_is_active`
    - `idx_players_total_score` (DESC for leaderboards)
  - Constraints:
    - Unique constraint on `user_id`
    - Unique constraint on `player_number`
    - Check constraints for non-negative scores and games_played
  - Auto-update trigger for `updated_at` timestamp
  - Sample data insertion query (commented out)

### 5. DTOs Created (✅ Complete)
- Added to `Auth.cs`:
  - `PlayerDto` - for GET operations
    - Includes player properties + user details (username, full_name, email)
  - `CreatePlayerRequest` - for POST (Admin only)
  - `UpdatePlayerRequest` - for PUT (Admin only)
  - `PaginatedResponse<T>` - generic pagination wrapper

### 6. Build Status
✅ **Build Successful**: 0 errors, 58 pre-existing warnings

## Architecture Summary

### Player Table Schema (`quiz.players`)
```sql
player_id UUID PRIMARY KEY
user_id UUID REFERENCES quiz.users (unique)
player_number VARCHAR(50) UNIQUE
enrollment_date TIMESTAMP
graduation_date TIMESTAMP (nullable)
total_score INTEGER (default 0, >= 0)
games_played INTEGER (default 0, >= 0)
is_active BOOLEAN (default true)
created_at TIMESTAMP
updated_at TIMESTAMP (auto-updates)
```

### Role-Based Access
- **Player Role**: Can view own player profile
- **Tutor Role**: Can view player responses and scores
- **Admin Role**: Full CRUD operations on player records

## Next Steps (Optional)

### 1. Implement Player Management API (Recommended)
Create `PlayerManagementEndpoints.cs` with:
- `GET /api/admin/players` - List all players (Player/Tutor/Admin)
- `GET /api/admin/players/{id}` - Get player by ID (Player can view own, Admin/Tutor can view any)
- `POST /api/admin/players` - Create player (Admin only)
- `PUT /api/admin/players/{id}` - Update player (Admin only)
- `DELETE /api/admin/players/{id}` - Delete player (Admin only)

**Note**: Follow the existing pattern in `TutorEndpoints.cs` using:
- `HttpRequest` (not `HttpRequestData`)
- `IActionResult` return type (not `HttpResponseData`)
- `[HttpTrigger]` attribute
- `AuthorizeTutor()` / `AuthorizePlayer()` helper methods

### 2. Run Database Migration
```sql
-- Execute the script
\i SRC/DatabaseScripts/016_players.sql

-- Or if using PowerShell script:
.\Scripts\DatabaseScripts_Deploy-Database.ps1
```

### 3. Update Existing Data (if needed)
```sql
-- Create player records for existing users with 'player' role
INSERT INTO quiz.players (user_id, player_number, enrollment_date)
SELECT 
    user_id,
    'PLR-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 5, '0'),
    created_at
FROM quiz.users
WHERE role = 'player'
ON CONFLICT (user_id) DO NOTHING;
```

### 4. Frontend Updates (Already Done Previously)
- ✅ Renamed Student components to Player
- ✅ Updated API routes `/api/student/*` → `/api/player/*`
- ✅ Updated localStorage keys

## Files Modified
1. `SRC/FunctionApp/Common/Services/AuthorizationService.cs` - Updated IsPlayer property
2. `SRC/FunctionApp/DataModel/Entities/Player.cs` - Renamed from Student.cs, updated schema
3. `SRC/FunctionApp/DataModel/Entities/User.cs` - Updated navigation property
4. `SRC/FunctionApp/DataModel/Dtos/Auth.cs` - Added Player DTOs
5. `SRC/DatabaseScripts/016_players.sql` - New database script

## Files Created
1. `016_players.sql` - Player table creation script
2. `ARCHITECTURE_UPDATE_PLAYER_RENAME.md` - Previous Student→Player rename documentation

## Benefits of Changes

1. **Clear Contextual Separation**: "Player" clearly indicates gaming context vs educational "Student" context
2. **Gaming-Focused Schema**: Added game-specific fields (total_score, games_played)
3. **Performance Optimized**: Indexes on commonly queried fields
4. **Proper Authorization**: Role-based access control for different operations
5. **Data Integrity**: Constraints prevent invalid data (negative scores, duplicate players)
6. **Audit Trail**: Timestamps track when players join and when records change

## Testing Checklist

- [ ] Execute `016_players.sql` script successfully
- [ ] Verify `quiz.players` table created with all indexes
- [ ] Test CREATE: Admin can create new player
- [ ] Test READ: Player can view own profile
- [ ] Test READ: Tutor can view all players
- [ ] Test UPDATE: Admin can update player scores/status
- [ ] Test DELETE: Admin can soft-delete (set is_active=false) or hard-delete players
- [ ] Verify constraints prevent negative scores
- [ ] Verify unique constraints on player_number and user_id
- [ ] Test pagination works correctly
- [ ] Verify `updated_at` auto-updates on changes

## Related Documentation
- `Documents/ARCHITECTURE_UPDATE_PLAYER_RENAME.md` - Complete Student→Player rename history
- `Documents/DatabaseScripts_README.md` - Database script execution order
- `SRC/DatabaseScripts/016_players.sql` - Player table SQL script
