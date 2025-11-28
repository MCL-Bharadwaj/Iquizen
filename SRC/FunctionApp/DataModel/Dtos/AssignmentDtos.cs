namespace Quizz.DataModel.Dtos;

/// <summary>
/// DTO for creating a new quiz assignment
/// </summary>
public class CreateAssignmentRequest
{
    public Guid QuizId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public int? MaxAttempts { get; set; }
    public bool IsMandatory { get; set; } = false;
    public string? Notes { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// DTO for bulk assignment creation
/// </summary>
public class BulkAssignmentRequest
{
    public Guid QuizId { get; set; }
    public List<string> UserIds { get; set; } = new();
    public DateTime? DueDate { get; set; }
    public int? MaxAttempts { get; set; }
    public bool IsMandatory { get; set; } = false;
    public string? Notes { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// DTO for updating assignment status
/// </summary>
public class UpdateAssignmentStatusRequest
{
    public string Status { get; set; } = string.Empty; // assigned, in_progress, completed, overdue, cancelled
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal? Score { get; set; }
}

/// <summary>
/// DTO for updating assignment details
/// </summary>
public class UpdateAssignmentRequest
{
    public DateTime? DueDate { get; set; }
    public int? MaxAttempts { get; set; }
    public bool? IsMandatory { get; set; }
    public string? Notes { get; set; }
    public string? Status { get; set; }
}

/// <summary>
/// DTO for assignment response
/// </summary>
public class AssignmentResponse
{
    public Guid AssignmentId { get; set; }
    public Guid QuizId { get; set; }
    public string QuizTitle { get; set; } = string.Empty;
    public string? QuizDescription { get; set; }
    public string? Subject { get; set; }
    public string? Difficulty { get; set; }
    public int? EstimatedMinutes { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? AssignedBy { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal? Score { get; set; }
    public int? MaxAttempts { get; set; }
    public int AttemptsUsed { get; set; }
    public bool IsMandatory { get; set; }
    public string? Notes { get; set; }
    public double? HoursUntilDue { get; set; }
    public double? CompletionTimeMinutes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for assignment statistics
/// </summary>
public class AssignmentStatsResponse
{
    public Guid QuizId { get; set; }
    public int TotalAssignments { get; set; }
    public int AssignedCount { get; set; }
    public int InProgressCount { get; set; }
    public int CompletedCount { get; set; }
    public int OverdueCount { get; set; }
    public int CancelledCount { get; set; }
    public decimal? AverageScore { get; set; }
    public double? AverageCompletionMinutes { get; set; }
    public int MandatoryCount { get; set; }
}

/// <summary>
/// DTO for user assignment summary
/// </summary>
public class UserAssignmentSummary
{
    public string UserId { get; set; } = string.Empty;
    public int TotalAssignments { get; set; }
    public int CompletedCount { get; set; }
    public int PendingCount { get; set; }
    public int OverdueCount { get; set; }
    public decimal? AverageScore { get; set; }
}

/// <summary>
/// DTO for assignment start request
/// </summary>
public class StartAssignmentRequest
{
    public Guid AssignmentId { get; set; }
}

/// <summary>
/// DTO for assignment completion
/// </summary>
public class CompleteAssignmentRequest
{
    public Guid AssignmentId { get; set; }
    public decimal Score { get; set; }
}

/// <summary>
/// DTO for bulk assignment response
/// </summary>
public class BulkAssignmentResponse
{
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<AssignmentResponse> CreatedAssignments { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}
