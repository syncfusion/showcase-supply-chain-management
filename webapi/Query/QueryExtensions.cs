using System.Globalization;
using System.Linq.Expressions;
using System.Reflection;

namespace Agm.SupplyChain.Api.Query;

public sealed class ListQuery
{
    public int Skip { get; set; }
    public int Take { get; set; } = 100;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Search { get; set; }
    public string? Sort { get; set; }
    public string? SortDirection { get; set; } = "asc";
    public string? Region { get; set; }
    public string? Warehouse { get; set; }
    public string? Status { get; set; }
    public string? Risk { get; set; }
    public string? Category { get; set; }
    public string? Supplier { get; set; }
    public string? BusinessUnit { get; set; }
}

public static class QueryExtensions
{
    public static IEnumerable<T> ApplySearch<T>(this IEnumerable<T> source, string? search, params Func<T, string?>[] selectors)
    {
        if (string.IsNullOrWhiteSpace(search)) return source;
        var term = search.Trim();
        return source.Where(item => selectors.Any(sel =>
            (sel(item) ?? string.Empty).Contains(term, StringComparison.OrdinalIgnoreCase)));
    }

    public static IEnumerable<T> ApplySort<T>(this IEnumerable<T> source, string? sort, string? direction)
    {
        if (string.IsNullOrWhiteSpace(sort)) return source;
        var prop = typeof(T).GetProperty(sort, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        if (prop is null) return source;
        var desc = string.Equals(direction, "desc", StringComparison.OrdinalIgnoreCase);
        return desc ? source.OrderByDescending(x => prop.GetValue(x)) : source.OrderBy(x => prop.GetValue(x));
    }

    public static (IReadOnlyList<T> Items, int Count) Page<T>(this IEnumerable<T> source, int skip, int take)
    {
        var materialized = source as IList<T> ?? source.ToList();
        take = Math.Clamp(take <= 0 ? 100 : take, 1, 2000);
        skip = Math.Max(0, skip);
        return (materialized.Skip(skip).Take(take).ToList(), materialized.Count);
    }
}
