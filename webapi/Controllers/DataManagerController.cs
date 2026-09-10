using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Agm.SupplyChain.Api.Data;
using Agm.SupplyChain.Api.Models;
using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Agm.SupplyChain.Api.Controllers;

/// <summary>
/// Syncfusion DataManager UrlAdaptor endpoints.
/// Request: { RequiresCounts, Skip, Take, Sorted, Where, Search }
/// Response: { result, count }
/// </summary>
[ApiController]
[Route("api/datamanager")]
public sealed class DataManagerController(SupplyChainStore store) : ControllerBase
{
    [HttpPost("inventory")]
    public IActionResult Inventory([FromBody] DataManagerRequest? request)
    {
        request = MergeQueryFilters(request);
        return Ok(Process(store.Inventory, request, [
            "sku", "productName", "warehouseName", "bin", "category", "status", "preferredSupplierName"
        ]));
    }

    [HttpPost("orders")]
    public IActionResult Orders([FromBody] DataManagerRequest? request)
    {
        request = MergeQueryFilters(request);
        return Ok(Process(store.SalesOrders, request, [
            "number", "customerName", "region", "warehouseName", "status", "priority", "risk"
        ]));
    }

    [HttpPost("purchase-orders")]
    public IActionResult PurchaseOrders([FromBody] DataManagerRequest? request)
    {
        request = MergeQueryFilters(request);
        return Ok(Process(store.PurchaseOrders, request, [
            "number", "supplierName", "plant", "buyer", "status", "deliveryStatus", "risk"
        ]));
    }

    [HttpPost("suppliers")]
    public IActionResult Suppliers([FromBody] DataManagerRequest? request)
    {
        request = MergeQueryFilters(request);
        return Ok(Process(store.Suppliers, request, [
            "name", "region", "country", "category", "risk", "status"
        ]));
    }

    private DataManagerRequest MergeQueryFilters(DataManagerRequest? request)
    {
        request ??= new DataManagerRequest();
        request.Warehouse ??= Request.Query["warehouse"].FirstOrDefault();
        request.Status ??= Request.Query["status"].FirstOrDefault();
        request.Risk ??= Request.Query["risk"].FirstOrDefault();
        request.Region ??= Request.Query["region"].FirstOrDefault();
        request.Category ??= Request.Query["category"].FirstOrDefault();
        request.Supplier ??= Request.Query["supplier"].FirstOrDefault();
        var search = Request.Query["search"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(search) && (request.Search is null || request.Search.Count == 0))
        {
            request.Search = [new DataManagerSearch { Key = search }];
        }
        return request;
    }

    private static object Process<T>(IEnumerable<T> source, DataManagerRequest? request, string[] searchFields)
    {
        request ??= new DataManagerRequest();
        var skip = Math.Max(0, request.Skip);
        var take = request.Take <= 0 ? 50 : Math.Min(request.Take, 500);

        var hasSearch = request.Search is { Count: > 0 } && request.Search.Any(s => !string.IsNullOrWhiteSpace(s.Key));
        var hasWhere = request.Where is { Count: > 0 };
        var hasCustom =
            !string.IsNullOrWhiteSpace(request.Warehouse) ||
            !string.IsNullOrWhiteSpace(request.Status) ||
            !string.IsNullOrWhiteSpace(request.Risk) ||
            !string.IsNullOrWhiteSpace(request.Region) ||
            !string.IsNullOrWhiteSpace(request.Category) ||
            !string.IsNullOrWhiteSpace(request.Supplier);
        var hasSort = request.Sorted is { Count: > 0 };

        // Fast path: IReadOnlyList with skip/take only (no filter/search/sort) — O(take), O(1) count.
        if (!hasSearch && !hasWhere && !hasCustom && !hasSort && source is IReadOnlyList<T> listSource)
        {
            var fastPage = listSource.Skip(skip).Take(take).ToList();
            if (request.RequiresCounts)
                return new { result = fastPage, count = listSource.Count };
            return fastPage;
        }

        IEnumerable<T> query = source;
        query = ApplyCustomFilters(query, request);

        if (request.Search is { Count: > 0 })
        {
            foreach (var search in request.Search)
            {
                if (string.IsNullOrWhiteSpace(search.Key)) continue;
                var key = search.Key;
                var fields = (search.Fields is { Count: > 0 } ? search.Fields.ToArray() : searchFields);
                query = query.Where(item => fields.Any(f =>
                {
                    var val = GetProp(item, f)?.ToString();
                    return val != null && val.Contains(key, StringComparison.OrdinalIgnoreCase);
                }));
            }
        }

        if (request.Where is { Count: > 0 })
        {
            foreach (var filter in FlattenWhere(request.Where))
            {
                if (string.IsNullOrWhiteSpace(filter.Field)) continue;
                query = query.Where(item => MatchWhere(item, filter));
            }
        }

        if (request.Sorted is { Count: > 0 })
        {
            IOrderedEnumerable<T>? ordered = null;
            foreach (var sort in request.Sorted)
            {
                if (string.IsNullOrWhiteSpace(sort.Name)) continue;
                var desc = string.Equals(sort.Direction, "descending", StringComparison.OrdinalIgnoreCase);
                if (ordered is null)
                    ordered = desc ? query.OrderByDescending(x => GetProp(x, sort.Name)) : query.OrderBy(x => GetProp(x, sort.Name));
                else
                    ordered = desc ? ordered.ThenByDescending(x => GetProp(x, sort.Name)) : ordered.ThenBy(x => GetProp(x, sort.Name));
            }
            if (ordered is not null) query = ordered;
        }

        // Prefer Count + Skip/Take without materializing the full set when source is already a list
        // and we only sorted (LINQ OrderBy is deferred until enumerated).
        if (!hasSearch && !hasWhere && !hasCustom && source is IReadOnlyList<T> readable)
        {
            var pageOnly = query.Skip(skip).Take(take).ToList();
            if (request.RequiresCounts)
                return new { result = pageOnly, count = readable.Count };
            return pageOnly;
        }

        var list = query.ToList();
        var count = list.Count;
        var page = list.Skip(skip).Take(take).ToList();

        if (request.RequiresCounts)
            return new { result = page, count };
        return page;
    }

    private static IEnumerable<T> ApplyCustomFilters<T>(IEnumerable<T> query, DataManagerRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Warehouse))
            query = query.Where(x => ContainsProp(x, "WarehouseId", request.Warehouse) || ContainsProp(x, "WarehouseName", request.Warehouse));
        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(x => EqualsProp(x, "Status", request.Status));
        if (!string.IsNullOrWhiteSpace(request.Risk))
            query = query.Where(x => EqualsProp(x, "Risk", request.Risk) || EqualsProp(x, "Severity", request.Risk));
        if (!string.IsNullOrWhiteSpace(request.Region))
            query = query.Where(x => EqualsProp(x, "Region", request.Region));
        if (!string.IsNullOrWhiteSpace(request.Category))
            query = query.Where(x => EqualsProp(x, "Category", request.Category));
        if (!string.IsNullOrWhiteSpace(request.Supplier))
            query = query.Where(x =>
                ContainsProp(x, "SupplierId", request.Supplier) ||
                ContainsProp(x, "SupplierName", request.Supplier) ||
                ContainsProp(x, "PreferredSupplierName", request.Supplier) ||
                ContainsProp(x, "Name", request.Supplier));
        return query;
    }

    private static IEnumerable<DataManagerWhere> FlattenWhere(IEnumerable<DataManagerWhere> filters)
    {
        foreach (var f in filters)
        {
            if (f.IsComplex && f.Predicates is { Count: > 0 })
            {
                foreach (var child in FlattenWhere(f.Predicates))
                    yield return child;
            }
            else
            {
                yield return f;
            }
        }
    }

    private static bool MatchWhere<T>(T item, DataManagerWhere filter)
    {
        var value = GetProp(item, filter.Field!);
        var compare = filter.Value?.ToString() ?? string.Empty;
        var left = value?.ToString() ?? string.Empty;
        var op = (filter.Operator ?? "equal").ToLowerInvariant();
        return op switch
        {
            "contains" => left.Contains(compare, StringComparison.OrdinalIgnoreCase),
            "startswith" => left.StartsWith(compare, StringComparison.OrdinalIgnoreCase),
            "endswith" => left.EndsWith(compare, StringComparison.OrdinalIgnoreCase),
            "notequal" => !left.Equals(compare, StringComparison.OrdinalIgnoreCase),
            "greaterthan" => CompareNumeric(value, compare) > 0,
            "greaterthanorequal" => CompareNumeric(value, compare) >= 0,
            "lessthan" => CompareNumeric(value, compare) < 0,
            "lessthanorequal" => CompareNumeric(value, compare) <= 0,
            _ => left.Equals(compare, StringComparison.OrdinalIgnoreCase)
        };
    }

    private static int CompareNumeric(object? value, string compare)
    {
        if (value is IComparable && double.TryParse(value.ToString(), out var left) && double.TryParse(compare, out var right))
            return left.CompareTo(right);
        return string.Compare(value?.ToString(), compare, StringComparison.OrdinalIgnoreCase);
    }

    private static object? GetProp<T>(T item, string name)
    {
        var prop = typeof(T).GetProperty(name, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        return prop?.GetValue(item);
    }

    private static bool EqualsProp<T>(T item, string name, string expected)
    {
        var val = GetProp(item, name)?.ToString();
        return val != null && val.Equals(expected, StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsProp<T>(T item, string name, string expected)
    {
        var val = GetProp(item, name)?.ToString();
        return val != null && val.Contains(expected, StringComparison.OrdinalIgnoreCase);
    }
}

public sealed class DataManagerRequest
{
    public bool RequiresCounts { get; set; } = true;
    public int Skip { get; set; }
    public int Take { get; set; } = 50;
    public List<DataManagerSort>? Sorted { get; set; }
    public List<DataManagerWhere>? Where { get; set; }
    public List<DataManagerSearch>? Search { get; set; }

    // Custom AGM filters (passed via Query.addParams or adaptor beforeSend)
    public string? Warehouse { get; set; }
    public string? Status { get; set; }
    public string? Risk { get; set; }
    public string? Region { get; set; }
    public string? Category { get; set; }
    public string? Supplier { get; set; }
}

public sealed class DataManagerSort
{
    public string? Name { get; set; }
    public string? Direction { get; set; }
}

public sealed class DataManagerWhere
{
    public string? Field { get; set; }
    public string? Operator { get; set; }
    public object? Value { get; set; }
    public bool IsComplex { get; set; }
    public string? Condition { get; set; }
    public List<DataManagerWhere>? Predicates { get; set; }
}

public sealed class DataManagerSearch
{
    public List<string>? Fields { get; set; }
    public string? Key { get; set; }
    public string? Operator { get; set; }
}
