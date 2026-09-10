using Agm.SupplyChain.Api.Data;
using Agm.SupplyChain.Api.Models;
using Agm.SupplyChain.Api.Models.Entities;
using Agm.SupplyChain.Api.Query;
using Microsoft.AspNetCore.Mvc;

namespace Agm.SupplyChain.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController(SupplyChainStore store) : ControllerBase
{
    [HttpGet("kpis")]
    public IActionResult GetKpis([FromQuery] ListQuery query)
    {
        var warehouseIds = ResolveWarehouseIds(query);
        var inventory = store.Inventory.AsEnumerable();
        if (warehouseIds is not null)
            inventory = inventory.Where(i => warehouseIds.Contains(i.WarehouseId));
        if (!string.IsNullOrWhiteSpace(query.Category))
            inventory = inventory.Where(i => i.Category.Equals(query.Category, StringComparison.OrdinalIgnoreCase));
        if (query.StartDate is not null)
            inventory = inventory.Where(i => i.LastReplenishment >= query.StartDate.Value);
        if (query.EndDate is not null)
            inventory = inventory.Where(i => i.LastReplenishment <= query.EndDate.Value);

        var orders = store.SalesOrders.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(query.Region))
            orders = orders.Where(o => o.Region.Equals(query.Region, StringComparison.OrdinalIgnoreCase));
        if (warehouseIds is not null)
            orders = orders.Where(o => warehouseIds.Contains(o.WarehouseId));
        if (query.StartDate is not null)
            orders = orders.Where(o => o.OrderDate >= query.StartDate.Value);
        if (query.EndDate is not null)
            orders = orders.Where(o => o.OrderDate <= query.EndDate.Value);

        var pos = store.PurchaseOrders.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(query.Risk))
            pos = pos.Where(p => p.Risk.Equals(query.Risk, StringComparison.OrdinalIgnoreCase));
        if (query.StartDate is not null)
            pos = pos.Where(p => p.CreatedDate >= query.StartDate.Value);
        if (query.EndDate is not null)
            pos = pos.Where(p => p.CreatedDate <= query.EndDate.Value);

        var supplierIdsInRange = pos.Select(p => p.SupplierId).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var suppliers = store.Suppliers.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(query.Region))
            suppliers = suppliers.Where(s => s.Region.Equals(query.Region, StringComparison.OrdinalIgnoreCase));
        if (query.StartDate is not null || query.EndDate is not null)
            suppliers = suppliers.Where(s => supplierIdsInRange.Contains(s.Id));

        var inventoryList = inventory.ToList();
        var orderList = orders.ToList();
        var supplierList = suppliers.ToList();
        var poList = pos.ToList();

        var inventoryValue = inventoryList.Sum(i => i.InventoryValue);
        var openPos = poList.Count(p => p.Status is not "Received");
        var otif = supplierList.Count == 0 ? 0 : supplierList.Average(s => s.Otif);
        var fillRate = orderList.Count == 0 ? 0 : orderList.Average(o => o.FulfillmentPct);
        var atRisk = orderList.Count(o => o.Risk == "High");

        return Ok(new
        {
            inventoryValue,
            openPurchaseOrders = openPos,
            supplierOtif = Math.Round(otif, 3),
            orderFillRate = Math.Round(fillRate, 3),
            inventoryTurnover = 6.3m,
            ordersAtRisk = atRisk,
            changes = new
            {
                inventoryValue = 0.042m,
                openPurchaseOrders = -0.018m,
                supplierOtif = 0.008m,
                orderFillRate = 0.012m,
                inventoryTurnover = 0.05m,
                ordersAtRisk = 0.11m
            },
            trends = new
            {
                inventoryValue = Enumerable.Range(0, 12).Select(i => 100 + i * 2 + (i % 3)).ToArray(),
                openPurchaseOrders = Enumerable.Range(0, 12).Select(i => 80 - i + (i % 4)).ToArray(),
                supplierOtif = Enumerable.Range(0, 12).Select(i => 90 + (i % 5)).ToArray(),
                orderFillRate = Enumerable.Range(0, 12).Select(i => 92 + (i % 4)).ToArray(),
                inventoryTurnover = Enumerable.Range(0, 12).Select(i => 55 + i).ToArray(),
                ordersAtRisk = Enumerable.Range(0, 12).Select(i => 40 + (i % 7)).ToArray()
            }
        });
    }

    [HttpGet("inventory-trend")]
    public IActionResult GetInventoryTrend([FromQuery] ListQuery query)
    {
        var trend = store.InventoryTrend.AsEnumerable();
        if (query.StartDate is not null || query.EndDate is not null)
        {
            trend = trend.Where(point =>
            {
                if (!DateOnly.TryParse($"{point.Period}-01", out var monthStart)) return false;
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);
                return (!query.StartDate.HasValue || monthEnd >= query.StartDate.Value) &&
                       (!query.EndDate.HasValue || monthStart <= query.EndDate.Value);
            });
        }

        return Ok(trend);
    }

    [HttpGet("supplier-risk")]
    public IActionResult GetSupplierRisk([FromQuery] ListQuery query)
    {
        IEnumerable<Supplier> suppliers = store.Suppliers;
        if (!string.IsNullOrWhiteSpace(query.Region))
            suppliers = suppliers.Where(s => s.Region.Equals(query.Region, StringComparison.OrdinalIgnoreCase));
        if (query.StartDate is not null || query.EndDate is not null)
        {
            var supplierIdsInRange = store.PurchaseOrders
                .Where(p => (!query.StartDate.HasValue || p.CreatedDate >= query.StartDate.Value) &&
                            (!query.EndDate.HasValue || p.CreatedDate <= query.EndDate.Value))
                .Select(p => p.SupplierId)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            suppliers = suppliers.Where(s => supplierIdsInRange.Contains(s.Id));
        }
        var groups = suppliers
            .GroupBy(s => s.Risk)
            .Select(g => new { risk = g.Key, count = g.Count() })
            .OrderBy(x => Array.IndexOf(new[] { "Low", "Moderate", "High", "Critical" }, x.risk))
            .ToDictionary(x => x.risk, x => x.count, StringComparer.OrdinalIgnoreCase);
        var orderedGroups = new[] { "Low", "Moderate", "High", "Critical" }
            .Select(risk => new { risk, count = groups.GetValueOrDefault(risk) })
            .ToList();
        return Ok(orderedGroups);
    }

    [HttpGet("exceptions")]
    public IActionResult GetExceptions([FromQuery] ListQuery query)
    {
        var filtered = store.Exceptions.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(query.Region))
            filtered = filtered.Where(e => e.Region.Equals(query.Region, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Warehouse))
            filtered = filtered.Where(e => e.Warehouse.Contains(query.Warehouse, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Risk))
            filtered = filtered.Where(e => e.Severity.Equals(query.Risk, StringComparison.OrdinalIgnoreCase));
        if (query.StartDate is not null)
            filtered = filtered.Where(e => DateOnly.FromDateTime(e.DetectedAt) >= query.StartDate.Value);
        if (query.EndDate is not null)
            filtered = filtered.Where(e => DateOnly.FromDateTime(e.DetectedAt) <= query.EndDate.Value);
        filtered = filtered.ApplySearch(query.Search, e => e.Type, e => e.Entity, e => e.Description, e => e.Warehouse);
        filtered = filtered.ApplySort(query.Sort ?? "DetectedAt", query.SortDirection ?? "desc");
        var (items, count) = filtered.Page(query.Skip, query.Take <= 0 ? 50 : query.Take);
        return Ok(new PagedResult<ExceptionItem> { Items = items, Count = count, Skip = query.Skip, Take = query.Take });
    }

    [HttpGet("network")]
    public IActionResult GetNetwork()
    {
        return Ok(new
        {
            warehouses = store.Warehouses,
            suppliers = store.Suppliers.Where(s => s.Risk is "High" or "Critical").Take(40),
            routes = store.Shipments.Take(25).Select(s => new
            {
                s.Id,
                s.OriginLat,
                s.OriginLng,
                s.DestLat,
                s.DestLng,
                s.Mode,
                s.Status
            })
        });
    }

    private HashSet<string>? ResolveWarehouseIds(ListQuery query)
    {
        if (string.IsNullOrWhiteSpace(query.Warehouse) && string.IsNullOrWhiteSpace(query.Region))
            return null;

        IEnumerable<Warehouse> warehouses = store.Warehouses;
        if (!string.IsNullOrWhiteSpace(query.Region))
            warehouses = warehouses.Where(w => w.Region.Equals(query.Region, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Warehouse))
            warehouses = warehouses.Where(w =>
                w.Id.Equals(query.Warehouse, StringComparison.OrdinalIgnoreCase) ||
                w.Name.Contains(query.Warehouse, StringComparison.OrdinalIgnoreCase));
        return warehouses.Select(w => w.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
