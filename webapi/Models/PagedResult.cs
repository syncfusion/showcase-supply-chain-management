namespace Agm.SupplyChain.Api.Models;

/// <summary>
/// Generic paged response envelope returned by the list endpoints. Carries the
/// current page, total <see cref="Count"/>, paging offsets, and optional
/// pre-computed aggregate buckets.
/// </summary>
/// <typeparam name="T">Row type for the page.</typeparam>
public sealed class PagedResult<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public required int Count { get; init; }
    public int Skip { get; init; }
    public int Take { get; init; }
    public Dictionary<string, object>? Aggregates { get; init; }
}
