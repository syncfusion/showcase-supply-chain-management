using System.Diagnostics;
using System.IO;
using System.Text.Json;
using Agm.SupplyChain.Api.Data;
using Agm.SupplyChain.Api.Models;
using Agm.SupplyChain.Api.Models.Entities;
using Agm.SupplyChain.Api.Query;
using Microsoft.AspNetCore.Mvc;

namespace Agm.SupplyChain.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class CatalogControllers(SupplyChainStore store) : ControllerBase
{
    [HttpGet("suppliers")]
    public IActionResult GetSuppliers([FromQuery] ListQuery query)
    {
        IEnumerable<Supplier> filtered = store.Suppliers;
        if (!string.IsNullOrWhiteSpace(query.Region))
            filtered = filtered.Where(s => s.Region.Equals(query.Region, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Risk))
            filtered = filtered.Where(s => s.Risk.Equals(query.Risk, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Category))
            filtered = filtered.Where(s => s.Category.Equals(query.Category, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Status))
            filtered = filtered.Where(s => s.Status.Equals(query.Status, StringComparison.OrdinalIgnoreCase));
        filtered = filtered.ApplySearch(query.Search, s => s.Name, s => s.Country, s => s.Category);
        filtered = filtered.ApplySort(query.Sort ?? "AnnualSpend", query.SortDirection ?? "desc");
        var list = filtered.ToList();
        var (items, count) = list.Page(query.Skip, query.Take <= 0 ? 50 : query.Take);
        return Ok(new PagedResult<Supplier>
        {
            Items = items,
            Count = count,
            Skip = query.Skip,
            Take = query.Take,
            Aggregates = new Dictionary<string, object>
            {
                ["totalSpend"] = list.Sum(s => s.AnnualSpend),
                ["avgOtif"] = list.Count == 0 ? 0 : Math.Round(list.Average(s => s.Otif), 3)
            }
        });
    }

    [HttpGet("suppliers/{id}")]
    public IActionResult GetSupplier(string id)
    {
        var supplier = store.Suppliers.FirstOrDefault(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (supplier is null) return NotFound();
        var pos = store.PurchaseOrders.Where(p => p.SupplierId == supplier.Id).Take(40).ToList();
        var score = Math.Round(
            (decimal)supplier.Otif * 35 +
            supplier.QualityScore * 30 +
            (1 - Math.Min(supplier.LeadTimeDays, 60) / 60m) * 20 +
            0.85m * 15, 1);
        return Ok(new
        {
            supplier,
            score,
            scoreBreakdown = new
            {
                delivery = supplier.Otif,
                quality = supplier.QualityScore,
                cost = Math.Round(1 - Math.Min(supplier.LeadTimeDays, 60) / 60m, 3),
                responsiveness = 0.85m
            },
            purchaseOrders = pos,
            trend = Enumerable.Range(1, 12).Select(m => new
            {
                month = m,
                otif = Math.Round(supplier.Otif - 0.05m + (m * 0.004m), 3),
                quality = Math.Round(supplier.QualityScore - 0.03m + (m * 0.003m), 3)
            })
        });
    }

    [HttpGet("purchase-orders")]
    public IActionResult GetPurchaseOrders([FromQuery] ListQuery query)
    {
        IEnumerable<PurchaseOrder> filtered = store.PurchaseOrders;
        if (!string.IsNullOrWhiteSpace(query.Status))
            filtered = filtered.Where(p => p.Status.Equals(query.Status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Risk))
            filtered = filtered.Where(p => p.Risk.Equals(query.Risk, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Supplier))
            filtered = filtered.Where(p =>
                p.SupplierId.Equals(query.Supplier, StringComparison.OrdinalIgnoreCase) ||
                p.SupplierName.Contains(query.Supplier, StringComparison.OrdinalIgnoreCase));
        filtered = filtered.ApplySearch(query.Search, p => p.Number, p => p.SupplierName, p => p.Buyer, p => p.Plant);
        filtered = filtered.ApplySort(query.Sort ?? "CreatedDate", query.SortDirection ?? "desc");
        var list = filtered.ToList();
        var (items, count) = list.Page(query.Skip, query.Take <= 0 ? 50 : query.Take);
        return Ok(new PagedResult<PurchaseOrder>
        {
            Items = items,
            Count = count,
            Skip = query.Skip,
            Take = query.Take,
            Aggregates = new Dictionary<string, object>
            {
                ["openValue"] = list.Where(p => p.Status != "Received").Sum(p => p.Value),
                ["awaitingApproval"] = list.Count(p => p.Status == "Approval"),
                ["late"] = list.Count(p => p.DeliveryStatus is "Delayed" or "At Risk")
            }
        });
    }

    [HttpGet("purchase-orders/{id}")]
    public IActionResult GetPurchaseOrder(string id)
    {
        var po = store.PurchaseOrders.FirstOrDefault(p =>
            p.Id.Equals(id, StringComparison.OrdinalIgnoreCase) ||
            p.Number.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (po is null) return NotFound();
        var lines = Enumerable.Range(1, po.Items).Select(n =>
        {
            var product = store.Products[(Math.Abs(po.Id.GetHashCode()) + n) % store.Products.Count];
            return new
            {
                line = n,
                sku = product.Sku,
                product = product.Name,
                qty = 5 + n * 2,
                unitCost = product.UnitCost,
                value = Math.Round((5 + n * 2) * product.UnitCost, 2)
            };
        });
        return Ok(new { purchaseOrder = po, lines, workflow = SeedCatalog.PoStatuses });
    }

    [HttpPost("purchase-orders/{id}/approve")]
    public IActionResult Approve(string id, [FromBody] ApprovalBody? body)
        => Ok(new { id, action = "approve", comment = body?.Comment, message = "Purchase order approved." });

    [HttpPost("purchase-orders/{id}/reject")]
    public IActionResult Reject(string id, [FromBody] ApprovalBody? body)
        => Ok(new { id, action = "reject", comment = body?.Comment, message = "Purchase order rejected." });

    [HttpGet("purchase-orders/{id}.pdf")]
    public IActionResult GetPurchaseOrderPdf(string id)
    {
        var po = store.PurchaseOrders.FirstOrDefault(p =>
            p.Id.Equals(id, StringComparison.OrdinalIgnoreCase) ||
            p.Number.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (po is null) return NotFound();

        var lines = Enumerable.Range(1, po.Items).Select(n =>
        {
            var product = store.Products[(Math.Abs(po.Id.GetHashCode()) + n) % store.Products.Count];
            return new
            {
                line = n,
                sku = product.Sku,
                product = product.Name,
                spec = $"{product.Category}, lead time {product.LeadTimeDays} days",
                qty = 5 + n * 2,
                unitCost = product.UnitCost,
                value = Math.Round((5 + n * 2) * product.UnitCost, 2)
            };
        });

        var payload = new
        {
            po.Number,
            po.SupplierName,
            po.Plant,
            po.CreatedDate,
            po.Buyer,
            po.RequiredDate,
            po.Status,
            po.DeliveryStatus,
            po.Currency,
            po.Value,
            lines
        };

        var scriptPath = string.Empty;
        var solutionRoot = new DirectoryInfo(AppContext.BaseDirectory);
        while (solutionRoot is not null)
        {
            var candidate = Path.Combine(solutionRoot.FullName, "frontend", "react", "scripts", "generate-po-pdf.cjs");
            if (System.IO.File.Exists(candidate))
            {
                scriptPath = candidate;
                break;
            }
            solutionRoot = solutionRoot.Parent;
        }

        if (string.IsNullOrEmpty(scriptPath))
            scriptPath = Path.Combine(AppContext.BaseDirectory, "generate-po-pdf.cjs");

        if (!System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Windows))
            scriptPath = scriptPath.Replace('\\', '/');

        var tempDir = Path.Combine(Path.GetTempPath(), "agm-supplychain-pdfs");
        Directory.CreateDirectory(tempDir);
        var inputPath = Path.Combine(tempDir, $"{po.Number}-input.json");
        var outputPath = Path.Combine(tempDir, $"{po.Number}.pdf");
        System.IO.File.WriteAllText(inputPath, JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));

        if (!System.IO.File.Exists(scriptPath))
            return Problem($"PDF generator script not found: {scriptPath}", statusCode: 500);

        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "node",
                Arguments = $"\"{scriptPath}\" \"{outputPath}\" \"{inputPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        process.Start();
        var stdout = process.StandardOutput.ReadToEnd();
        var stderr = process.StandardError.ReadToEnd();
        process.WaitForExit();

        if (process.ExitCode != 0)
        {
            return Problem($"PDF generation failed: {stderr}", statusCode: 500);
        }

        var pdfStream = new FileStream(outputPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.DeleteOnClose);
        return new FileStreamResult(pdfStream, "application/pdf") { EnableRangeProcessing = true };
    }

    [HttpGet("orders")]
    public IActionResult GetOrders([FromQuery] ListQuery query)
    {
        IEnumerable<SalesOrder> filtered = store.SalesOrders;
        if (!string.IsNullOrWhiteSpace(query.Region))
            filtered = filtered.Where(o => o.Region.Equals(query.Region, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Status))
            filtered = filtered.Where(o => o.Status.Equals(query.Status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Risk))
            filtered = filtered.Where(o => o.Risk.Equals(query.Risk, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(query.Warehouse))
            filtered = filtered.Where(o =>
                o.WarehouseId.Equals(query.Warehouse, StringComparison.OrdinalIgnoreCase) ||
                o.WarehouseName.Contains(query.Warehouse, StringComparison.OrdinalIgnoreCase));
        filtered = filtered.ApplySearch(query.Search, o => o.Number, o => o.CustomerName, o => o.WarehouseName);
        filtered = filtered.ApplySort(query.Sort ?? "OrderDate", query.SortDirection ?? "desc");
        var list = filtered.ToList();
        var (items, count) = list.Page(query.Skip, query.Take <= 0 ? 50 : query.Take);
        return Ok(new PagedResult<SalesOrder>
        {
            Items = items,
            Count = count,
            Skip = query.Skip,
            Take = query.Take,
            Aggregates = new Dictionary<string, object>
            {
                ["totalValue"] = list.Sum(o => o.Value),
                ["atRisk"] = list.Count(o => o.Risk == "High")
            }
        });
    }

    [HttpGet("orders/{id}")]
    public IActionResult GetOrder(string id)
    {
        var order = store.SalesOrders.FirstOrDefault(o =>
            o.Id.Equals(id, StringComparison.OrdinalIgnoreCase) ||
            o.Number.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (order is null) return NotFound();
        var shipment = store.Shipments.FirstOrDefault(s => s.OrderId == order.Id);
        return Ok(new
        {
            order,
            shipment,
            workflow = SeedCatalog.OrderStatuses,
            items = Enumerable.Range(1, 5).Select(n =>
            {
                var product = store.Products[(Math.Abs(order.Id.GetHashCode()) + n) % store.Products.Count];
                return new { line = n, sku = product.Sku, name = product.Name, qty = n * 3, unitCost = product.UnitCost };
            }),
            timeline = new[]
            {
                new { date = order.OrderDate.ToString("MMM dd"), eventName = "Order received" },
                new { date = order.OrderDate.AddDays(1).ToString("MMM dd"), eventName = "Allocated" },
                new { date = order.OrderDate.AddDays(2).ToString("MMM dd"), eventName = "Picked" },
                new { date = order.OrderDate.AddDays(3).ToString("MMM dd"), eventName = "Packed" },
                new { date = order.RequestedDate.AddDays(-2).ToString("MMM dd"), eventName = "Shipped" }
            }
        });
    }

    [HttpGet("warehouses")]
    public IActionResult GetWarehouses([FromQuery] ListQuery query)
    {
        IEnumerable<Warehouse> filtered = store.Warehouses;
        if (!string.IsNullOrWhiteSpace(query.Region))
            filtered = filtered.Where(w => w.Region.Equals(query.Region, StringComparison.OrdinalIgnoreCase));
        filtered = filtered.ApplySearch(query.Search, w => w.Name, w => w.Code, w => w.Country);
        var list = filtered.ToList();
        return Ok(new PagedResult<Warehouse> { Items = list, Count = list.Count, Skip = 0, Take = list.Count });
    }

    [HttpGet("warehouses/{id}")]
    public IActionResult GetWarehouse(string id)
    {
        var warehouse = store.Warehouses.FirstOrDefault(w =>
            w.Id.Equals(id, StringComparison.OrdinalIgnoreCase) ||
            w.Code.Equals(id, StringComparison.OrdinalIgnoreCase) ||
            w.Name.Contains(id, StringComparison.OrdinalIgnoreCase));
        if (warehouse is null) return NotFound();
        return Ok(new
        {
            warehouse,
            dockAppointments = store.DockAppointments.Where(d => d.WarehouseId == warehouse.Id).ToList(),
            locations = store.WarehouseLocations.Where(l => l.WarehouseId == warehouse.Id).ToList(),
            inventoryByCategory = store.Inventory.Where(i => i.WarehouseId == warehouse.Id)
                .GroupBy(i => i.Category)
                .Select(g => new { category = g.Key, value = g.Sum(x => x.InventoryValue) })
                .OrderByDescending(x => x.value)
                .Take(8)
        });
    }

    [HttpGet("shipments")]
    public IActionResult GetShipments([FromQuery] int take = 50)
        => Ok(new PagedResult<Shipment>
        {
            Items = store.Shipments.Take(take).ToList(),
            Count = store.Shipments.Count,
            Skip = 0,
            Take = take
        });

    [HttpGet("shipments/{id}")]
    public IActionResult GetShipment(string id)
    {
        var shipment = store.Shipments.FirstOrDefault(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        return shipment is null ? NotFound() : Ok(shipment);
    }

    [HttpGet("production-orders")]
    public IActionResult GetProduction()
        => Ok(store.ProductionTasks);

    [HttpGet("production-orders/{id}")]
    public IActionResult GetProductionTask(string id)
    {
        var task = store.ProductionTasks.FirstOrDefault(t => t.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        return task is null ? NotFound() : Ok(task);
    }

    [HttpGet("analytics/pivot")]
    public IActionResult GetPivot() => Ok(store.PivotRows);

    [HttpGet("analytics/spend-by-supplier")]
    public IActionResult SpendBySupplier()
        => Ok(store.Suppliers.OrderByDescending(s => s.AnnualSpend).Take(15)
            .Select(s => new { s.Name, s.AnnualSpend, s.Region }));

    [HttpGet("analytics/inventory-by-region")]
    public IActionResult InventoryByRegion()
    {
        var map = store.Warehouses.ToDictionary(w => w.Name, w => w.Region);
        return Ok(store.Inventory
            .GroupBy(i => map.TryGetValue(i.WarehouseName, out var r) ? r : "Other")
            .Select(g => new { region = g.Key, value = g.Sum(x => x.InventoryValue) }));
    }

    [HttpGet("search")]
    public IActionResult GlobalSearch([FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<object>());
        var term = q.Trim();
        var results = new List<object>();
        results.AddRange(store.Products.Where(p => p.Sku.Contains(term, StringComparison.OrdinalIgnoreCase) || p.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
            .Take(5).Select(p => new { id = p.Id, label = p.Sku, subtitle = p.Name, type = "Product", route = $"/inventory?search={p.Sku}" }));
        results.AddRange(store.PurchaseOrders.Where(p => p.Number.Contains(term, StringComparison.OrdinalIgnoreCase) || p.SupplierName.Contains(term, StringComparison.OrdinalIgnoreCase))
            .Take(5).Select(p => new { id = p.Id, label = p.Number, subtitle = p.SupplierName, type = "Purchase Order", route = $"/procurement?search={p.Number}" }));
        results.AddRange(store.SalesOrders.Where(o => o.Number.Contains(term, StringComparison.OrdinalIgnoreCase) || o.CustomerName.Contains(term, StringComparison.OrdinalIgnoreCase))
            .Take(5).Select(o => new { id = o.Id, label = o.Number, subtitle = o.CustomerName, type = "Order", route = $"/orders?search={o.Number}" }));
        results.AddRange(store.Suppliers.Where(s => s.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
            .Take(5).Select(s => new { id = s.Id, label = s.Name, subtitle = s.Region, type = "Supplier", route = $"/suppliers?search={s.Name}" }));
        results.AddRange(store.Warehouses.Where(w => w.Name.Contains(term, StringComparison.OrdinalIgnoreCase) || w.Code.Contains(term, StringComparison.OrdinalIgnoreCase))
            .Take(5).Select(w => new { id = w.Id, label = w.Name, subtitle = w.Region, type = "Warehouse", route = $"/warehouses/{w.Id}" }));
        return Ok(results.Take(15));
    }

    [HttpGet("meta/filters")]
    public IActionResult GetFilterOptions()
        => Ok(new
        {
            regions = SeedCatalog.Regions,
            businessUnits = SeedCatalog.BusinessUnits,
            categories = SeedCatalog.Categories,
            warehouses = store.Warehouses.Select(w => new { w.Id, w.Name, w.Region }),
            riskLevels = SeedCatalog.RiskLevels
        });

    public sealed record ApprovalBody(string? Comment);
}
