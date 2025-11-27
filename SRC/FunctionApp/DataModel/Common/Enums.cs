using System.Text.Json.Serialization;

namespace Quizz.DataModel.Common;

/// <summary>
/// Question type discriminator
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum QuestionType
{
    MultipleChoiceSingle,
    MultipleChoiceMulti,
    FillInBlank,
    FillInBlankDragDrop,
    Ordering,
    Matching,
    ProgramSubmission,
    ShortAnswer
}

/// <summary>
/// Quiz/Question difficulty level
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Difficulty
{
    Easy,
    Medium,
    Hard
}

/// <summary>
/// Quiz attempt status
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AttemptStatus
{
    InProgress,
    Completed,
    Abandoned
}

/// <summary>
/// Subject/category for quizzes and questions
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Subject
{
    Mathematics,
    Science,
    ComputerScience,
    LanguageArts,
    History,
    Geography,
    Art,
    Music,
    Other
}

/// <summary>
/// Partial credit strategy for multiple choice multi questions
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PartialCreditRule
{
    Proportional,
    AllOrNothing,
    Penalty
}

/// <summary>
/// Partial credit strategy for ordering questions
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderingCreditStrategy
{
    AdjacentPairs,
    PositionAccuracy,
    AllOrNothing
}

/// <summary>
/// Partial credit strategy for matching questions
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MatchingCreditStrategy
{
    PerPair,
    AllOrNothing
}

/// <summary>
/// Programming language for code submissions
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ProgrammingLanguage
{
    Python,
    JavaScript,
    Sql,
    Java,
    CSharp,
    TypeScript
}

/// <summary>
/// Audit log action types
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AuditAction
{
    Create,
    Update,
    Delete,
    Submit,
    Grade,
    Start,
    Complete
}

/// <summary>
/// Entity types for audit logging
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EntityType
{
    Quiz,
    Question,
    Attempt,
    Response
}


