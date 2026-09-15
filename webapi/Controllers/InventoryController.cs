using Agm.SupplyChain.Api.Data;
using Agm.SupplyChain.Api.Models;
using Agm.SupplyChain.Api.Models.Entities;
using Agm.SupplyChain.Api.Query;
using Microsoft.AspNetCore.Mvc;

namespace Agm.SupplyChain.Api.Controllers;

[ApiController]
[Route("api/inventory")]
public sealed class InventoryController(SupplyChainStore store, InventoryAdjustmentStore adjustments) : ControllerBase
{
    [HttpGet]
    public IActionResult GetInventory([FromQuery] ListQuery query)
    {
        var hasFilter = !string.IsNullOrWhiteSpace(query.Warehouse)
            || !string.IsNullOrWhiteSpace(query.Status)
            || !string.IsNullOrWhiteSpace(query.Category)
            || !string.IsNullOrWhiteSpace(query.Supplier)
            || !string.IsNullOrWhiteSpace(query.Search);

        IEnumerable<InventoryRecord> filtered = store.Inventory;
        if (!string.IsNullOrWhiteSpace(query.Warehouse))
            filtered = filtered.Where(i =>
                i.WarehouseId.Equals(query.Warehouse, StringComparison.OrdinalIgnoreCase) ||
                i.WarehouseName.Contains(query.Warehouse, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Status))
            filtered = filtered.Where(i => i.Status.Equals(query.Status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Category))
            filtered = filtered.Where(i => i.Category.Equals(query.Category, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Supplier))
            filtered = filtered.Where(i =>
                i.PreferredSupplierId.Equals(query.Supplier, StringComparison.OrdinalIgnoreCase) ||
                i.PreferredSupplierName.Contains(query.Supplier, StringComparison.OrdinalIgnoreCase));

        filtered = filtered.ApplySearch(query.Search, i => i.Sku, i => i.ProductName, i => i.WarehouseName, i => i.Bin);
        filtered = filtered.ApplySort(query.Sort ?? "InventoryValue", query.SortDirection ?? "desc");

        var take = query.Take <= 0 ? 100 : query.Take;
        IReadOnlyDictionary<string, object> aggregates;
        int count;
        List<InventoryRecord> items;

        if (!hasFilter)
        {
            aggregates = store.InventoryAggregates;
            count = store.Inventory.Count;
            items = filtered.Skip(query.Skip).Take(take).ToList();
        }
        else
        {
            var list = filtered.ToList();
            count = list.Count;
            items = list.Skip(query.Skip).Take(take).ToList();
            aggregates = new Dictionary<string, object>
            {
                ["totalValue"] = list.Sum(i => i.InventoryValue),
                ["available"] = list.Sum(i => i.Available),
                ["reserved"] = list.Sum(i => i.Reserved),
                ["belowSafety"] = list.Count(i => i.Status == "Below Safety"),
                ["outOfStock"] = list.Count(i => i.Status == "Out of Stock"),
                ["excess"] = list.Count(i => i.Status == "Excess")
            };
        }

        return Ok(new PagedResult<InventoryRecord>
        {
            Items = items,
            Count = count,
            Skip = query.Skip,
            Take = take,
            Aggregates = aggregates.ToDictionary(kv => kv.Key, kv => kv.Value)
        });
    }

    [HttpGet("summary")]
    public IActionResult GetSummary([FromQuery] ListQuery query) => GetInventory(query);

    [HttpGet("charts")]
    public IActionResult GetCharts() => Ok(store.InventoryCharts);

    [HttpGet("aggregates")]
    public IActionResult GetAggregates([FromQuery] ListQuery query)
    {
        var hasFilter = !string.IsNullOrWhiteSpace(query.Warehouse)
            || !string.IsNullOrWhiteSpace(query.Status)
            || !string.IsNullOrWhiteSpace(query.Category)
            || !string.IsNullOrWhiteSpace(query.Supplier)
            || !string.IsNullOrWhiteSpace(query.Search);

        if (!hasFilter)
            return Ok(new { aggregates = store.InventoryAggregates });

        IEnumerable<InventoryRecord> filtered = store.Inventory;
        if (!string.IsNullOrWhiteSpace(query.Warehouse))
            filtered = filtered.Where(i =>
                i.WarehouseId.Equals(query.Warehouse, StringComparison.OrdinalIgnoreCase) ||
                i.WarehouseName.Contains(query.Warehouse, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Status))
            filtered = filtered.Where(i => i.Status.Equals(query.Status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Category))
            filtered = filtered.Where(i => i.Category.Equals(query.Category, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Supplier))
            filtered = filtered.Where(i =>
                i.PreferredSupplierId.Equals(query.Supplier, StringComparison.OrdinalIgnoreCase) ||
                i.PreferredSupplierName.Contains(query.Supplier, StringComparison.OrdinalIgnoreCase));
        filtered = filtered.ApplySearch(query.Search, i => i.Sku, i => i.ProductName, i => i.WarehouseName, i => i.Bin);

        decimal totalValue = 0;
        long available = 0;
        long reserved = 0;
        var belowSafety = 0;
        var outOfStock = 0;
        var excess = 0;
        foreach (var i in filtered)
        {
            totalValue += i.InventoryValue;
            available += i.Available;
            reserved += i.Reserved;
            if (i.Status == "Below Safety") belowSafety++;
            else if (i.Status == "Out of Stock") outOfStock++;
            else if (i.Status == "Excess") excess++;
        }

        return Ok(new
        {
            aggregates = new Dictionary<string, object>
            {
                ["totalValue"] = totalValue,
                ["available"] = available,
                ["reserved"] = reserved,
                ["belowSafety"] = belowSafety,
                ["outOfStock"] = outOfStock,
                ["excess"] = excess
            }
        });
    }

    [HttpGet("adjustments")]
    public IActionResult GetAdjustmentWorkspace([FromQuery] int take = 200)
    {
        var items = store.Inventory
            .Where(i => i.Status is "Below Safety" or "Excess" or "Out of Stock")
            .Take(Math.Clamp(take, 50, 500))
            .Select(i => i with { })
            .ToList();
        return Ok(new PagedResult<InventoryRecord>
        {
            Items = items,
            Count = items.Count,
            Skip = 0,
            Take = items.Count
        });
    }

    [HttpGet("{id}")]
    public IActionResult GetById(string id)
    {
        var item = store.Inventory.FirstOrDefault(i => i.Id.Equals(id, StringComparison.OrdinalIgnoreCase)
                                                       || i.Sku.Equals(id, StringComparison.OrdinalIgnoreCase)
                                                       || i.ProductId.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (item is null) return NotFound();

        var locations = store.Inventory.Where(i => i.ProductId == item.ProductId).ToList();
        return Ok(new
        {
            item,
            locations,
            transactions = Enumerable.Range(1, 12).Select(n => new
            {
                id = $"TX-{item.Sku}-{n}",
                date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-n * 3)),
                type = n % 3 == 0 ? "Transfer" : n % 2 == 0 ? "Issue" : "Receipt",
                quantity = (n % 2 == 0 ? -1 : 1) * (10 + n * 3),
                warehouse = item.WarehouseName
            })
        });
    }

    public sealed record AdjustmentRequest(string Id, int? Quantity, string? Bin, int? SafetyStock, int? ReorderPoint, string? PreferredSupplierId);

    [HttpPost("adjustments")]
    public IActionResult ApplyAdjustments([FromBody] List<AdjustmentRequest> requests)
    {
        requests ??= [];
        var overlays = new List<InventoryAdjustmentStore.AdjustmentOverlay>(requests.Count);
        var recalculated = new List<object>(requests.Count);

        foreach (var a in requests)
        {
            var updated = store.ApplyAdjustment(a.Id, a.Quantity, a.Bin, a.SafetyStock, a.ReorderPoint, a.PreferredSupplierId);
            if (updated is null) continue;

            overlays.Add(new InventoryAdjustmentStore.AdjustmentOverlay(
                a.Id, a.Quantity, a.Bin, a.SafetyStock, a.ReorderPoint, a.PreferredSupplierId));
            recalculated.Add(new { a.Id, inventoryValue = updated.InventoryValue, status = updated.Status });
        }

        adjustments.Upsert(overlays);
        store.RebuildInventoryCaches();
        var persistence = adjustments.Mode == "Sqlite" ? "sqlite" : "memory";
        return Ok(new
        {
            saved = overlays.Count,
            persistence,
            message = adjustments.Mode == "Sqlite"
                ? "Inventory adjustments saved to SQLite."
                : "Inventory adjustments saved in memory for this process.",
            recalculated
        });
    }
}
