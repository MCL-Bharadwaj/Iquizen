namespace Quizz.Common.Utilities;

/// <summary>
/// Paged result wrapper for list endpoints
/// </summary>
public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}

/// <summary>
/// Query parameters for paging and sorting
/// </summary>
public class PagedQuery
{
    private int _page = 1;
    private int _pageSize = 50;

    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value < 1 ? 50 : (value > 100 ? 100 : value);
    }

    public string? Sort { get; set; }
    public string? Filter { get; set; }
}

/// <summary>
/// Extension methods for paging queries
/// </summary>
public static class PagedQueryExtensions
{
    public static PagedQuery ParseFromQueryString(this PagedQuery query, string queryString)
    {
        var parsed = System.Web.HttpUtility.ParseQueryString(queryString);
        
        if (int.TryParse(parsed["page"], out var page))
            query.Page = page;
        
        if (int.TryParse(parsed["pageSize"], out var pageSize))
            query.PageSize = pageSize;
        
        query.Sort = parsed["sort"];
        query.Filter = parsed["filter"];
        
        return query;
    }

    public static IQueryable<T> ApplyPaging<T>(this IQueryable<T> source, PagedQuery query)
    {
        return source
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize);
    }

    public static PagedResult<T> ToPagedResult<T>(this IQueryable<T> source, PagedQuery query)
    {
        var totalCount = source.Count();
        var items = source
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToList();

        return new PagedResult<T>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
    }

    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(this IQueryable<T> source, PagedQuery query)
    {
        var totalCount = source.Count();
        var items = source
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToList();

        return new PagedResult<T>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
    }
}


