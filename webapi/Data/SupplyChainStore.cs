using Agm.SupplyChain.Api.Models.Entities;

namespace Agm.SupplyChain.Api.Data;

/// <summary>
/// Deterministic in-memory supply-chain dataset for the AGM showcase.
/// Scale is intentionally large enough for virtualization demos.
/// </summary>
public sealed class SupplyChainStore
{
    private readonly Random _rng;
    private readonly List<InventoryRecord> _inventory;
    private readonly Dictionary<string, int> _inventoryIndex = new(StringComparer.OrdinalIgnoreCase);

    public IReadOnlyList<Product> Products { get; }
    public IReadOnlyList<Supplier> Suppliers { get; }
    public IReadOnlyList<Warehouse> Warehouses { get; }
    public IReadOnlyList<Customer> Customers { get; }
    public IReadOnlyList<InventoryRecord> Inventory => _inventory;
    public IReadOnlyList<PurchaseOrder> PurchaseOrders { get; }
    public IReadOnlyList<SalesOrder> SalesOrders { get; }
    public IReadOnlyList<Shipment> Shipments { get; }
    public IReadOnlyList<ExceptionItem> Exceptions { get; }
    public IReadOnlyList<ProductionTask> ProductionTasks { get; }
    public IReadOnlyList<DockAppointment> DockAppointments { get; }
    public IReadOnlyList<WarehouseLocationNode> WarehouseLocations { get; }
    public IReadOnlyList<TrendPoint> InventoryTrend { get; }
    public IReadOnlyList<PivotRow> PivotRows { get; }

    /// <summary>Precomputed inventory chart series (invalidated on adjustments).</summary>
    public object InventoryCharts { get; private set; } = null!;

    /// <summary>Precomputed unfiltered inventory KPI aggregates.</summary>
    public IReadOnlyDictionary<string, object> InventoryAggregates { get; private set; } =
        new Dictionary<string, object>();

    public SupplyChainStore()
    {
        _rng = new Random(20260827);
        Warehouses = BuildWarehouses();
        Suppliers = BuildSuppliers();
        Customers = BuildCustomers();
        Products = BuildProducts();
        _inventory = BuildInventory().ToList();
        for (var i = 0; i < _inventory.Count; i++)
            _inventoryIndex[_inventory[i].Id] = i;
        PurchaseOrders = BuildPurchaseOrders();
        SalesOrders = BuildSalesOrders();
        Shipments = BuildShipments();
        Exceptions = BuildExceptions();
        ProductionTasks = BuildProductionTasks();
        DockAppointments = BuildDockAppointments();
        WarehouseLocations = BuildWarehouseLocations();
        InventoryTrend = BuildInventoryTrend();
        PivotRows = BuildPivotRows();
        RebuildInventoryCaches();
    }

    public void RebuildInventoryCaches()
    {
        InventoryAggregates = new Dictionary<string, object>
        {
            ["totalValue"] = _inventory.Sum(i => i.InventoryValue),
            ["available"] = _inventory.Sum(i => i.Available),
            ["reserved"] = _inventory.Sum(i => i.Reserved),
            ["belowSafety"] = _inventory.Count(i => i.Status == "Below Safety"),
            ["outOfStock"] = _inventory.Count(i => i.Status == "Out of Stock"),
            ["excess"] = _inventory.Count(i => i.Status == "Excess")
        };
        InventoryCharts = new
        {
            byWarehouse = _inventory
                .GroupBy(i => i.WarehouseName)
                .Select(g => new { warehouse = g.Key, value = g.Sum(x => x.InventoryValue) })
                .OrderByDescending(x => x.value)
                .Take(10)
                .ToList(),
            byCategory = _inventory
                .GroupBy(i => i.Category)
                .Select(g => new { category = g.Key, value = g.Sum(x => x.InventoryValue) })
                .OrderByDescending(x => x.value)
                .ToList(),
            byStatus = _inventory
                .GroupBy(i => i.Status)
                .Select(g => new { status = g.Key, count = g.Count() })
                .ToList()
        };
    }

    /// <summary>Apply persisted / batch-edit overlays onto the in-memory inventory working set.</summary>
    public void ApplyOverlays(IEnumerable<InventoryAdjustmentStore.AdjustmentOverlay> overlays)
    {
        foreach (var overlay in overlays)
            ApplyAdjustment(
                overlay.Id,
                overlay.Quantity,
                overlay.Bin,
                overlay.SafetyStock,
                overlay.ReorderPoint,
                overlay.PreferredSupplierId);
    }

    public InventoryRecord? ApplyAdjustment(
        string id,
        int? quantity,
        string? bin,
        int? safetyStock,
        int? reorderPoint,
        string? preferredSupplierId)
    {
        if (!_inventoryIndex.TryGetValue(id, out var index))
            return null;

        var current = _inventory[index];
        var qty = quantity ?? current.Quantity;
        if (qty < 0) qty = 0;
        var reserved = Math.Min(current.Reserved, qty);
        var available = qty - reserved;
        var safety = safetyStock ?? current.SafetyStock;
        var reorder = reorderPoint ?? current.ReorderPoint;
        var supplierId = string.IsNullOrWhiteSpace(preferredSupplierId)
            ? current.PreferredSupplierId
            : preferredSupplierId;
        var supplier = Suppliers.FirstOrDefault(s => s.Id.Equals(supplierId, StringComparison.OrdinalIgnoreCase));
        var supplierName = supplier?.Name ?? current.PreferredSupplierName;
        var status = available == 0 ? "Out of Stock"
            : available < safety ? "Below Safety"
            : available > safety * 4 ? "Excess"
            : "Healthy";

        var updated = current with
        {
            Quantity = qty,
            Available = available,
            Reserved = reserved,
            Bin = string.IsNullOrWhiteSpace(bin) ? current.Bin : bin,
            SafetyStock = safety,
            ReorderPoint = reorder,
            InventoryValue = Math.Round(qty * current.UnitCost, 2),
            Status = status,
            PreferredSupplierId = supplierId,
            PreferredSupplierName = supplierName
        };
        _inventory[index] = updated;
        return updated;
    }

    private IReadOnlyList<Warehouse> BuildWarehouses()
    {
        return SeedCatalog.Warehouses.Select((w, i) =>
        {
            var utilization = 0.55m + (decimal)(_rng.NextDouble() * 0.4);
            var inventoryValue = 4_000_000m + (decimal)_rng.Next(0, 20_000_000);
            return new Warehouse(
                Id: $"WH-{i + 1:D3}",
                Name: w.Name,
                Code: w.Code,
                Region: w.Region,
                Country: w.Country,
                Type: w.Type,
                Latitude: w.Lat,
                Longitude: w.Lng,
                Utilization: Math.Round(utilization, 2),
                InventoryValue: Math.Round(inventoryValue, 0),
                OpenOrders: _rng.Next(80, 900),
                InboundShipments: _rng.Next(5, 60),
                OutboundShipments: _rng.Next(10, 80),
                Capacity: _rng.Next(8000, 25000));
        }).ToList();
    }

    private IReadOnlyList<Supplier> BuildSuppliers()
    {
        var list = new List<Supplier>(175);
        for (var i = 0; i < 175; i++)
        {
            var baseName = SeedCatalog.SupplierNames[i % SeedCatalog.SupplierNames.Length];
            var name = i < SeedCatalog.SupplierNames.Length
                ? baseName
                : $"{baseName} {(char)('A' + (i / SeedCatalog.SupplierNames.Length))}";
            var geo = SeedCatalog.SupplierGeos[i % SeedCatalog.SupplierGeos.Length];
            var riskRoll = _rng.NextDouble();
            var risk = riskRoll switch
            {
                < 0.55 => "Low",
                < 0.80 => "Moderate",
                < 0.93 => "High",
                _ => "Critical"
            };
            var otif = risk switch
            {
                "Low" => 0.94 + _rng.NextDouble() * 0.05,
                "Moderate" => 0.88 + _rng.NextDouble() * 0.06,
                "High" => 0.78 + _rng.NextDouble() * 0.08,
                _ => 0.60 + _rng.NextDouble() * 0.12
            };
            list.Add(new Supplier(
                Id: $"SUP-{i + 1:D4}",
                Name: name,
                Region: geo.Region,
                Country: geo.Country,
                Category: SeedCatalog.Categories[i % SeedCatalog.Categories.Length],
                AnnualSpend: Math.Round(250_000m + (decimal)_rng.Next(0, 8_000_000), 0),
                LeadTimeDays: _rng.Next(7, 55),
                Otif: Math.Round((decimal)otif, 3),
                QualityScore: Math.Round(0.82m + (decimal)(_rng.NextDouble() * 0.17), 3),
                Risk: risk,
                OpenPos: _rng.Next(0, 45),
                Status: risk is "Critical" or "High" && _rng.NextDouble() > 0.5 ? "Watch" : "Active",
                Latitude: geo.Lat + (_rng.NextDouble() - 0.5) * 2,
                Longitude: geo.Lng + (_rng.NextDouble() - 0.5) * 2));
        }
        return list;
    }

    private IReadOnlyList<Customer> BuildCustomers()
    {
        return Enumerable.Range(0, 120).Select(i =>
        {
            var name = SeedCatalog.CustomerNames[i % SeedCatalog.CustomerNames.Length];
            if (i >= SeedCatalog.CustomerNames.Length)
                name = $"{name} {i / SeedCatalog.CustomerNames.Length + 1}";
            var geo = SeedCatalog.SupplierGeos[i % SeedCatalog.SupplierGeos.Length];
            return new Customer($"CUS-{i + 1:D4}", name, geo.Region, geo.Country);
        }).ToList();
    }

    private IReadOnlyList<Product> BuildProducts()
    {
        var list = new List<Product>(25_000);
        for (var i = 0; i < 25_000; i++)
        {
            var prefix = SeedCatalog.ProductPrefixes[i % SeedCatalog.ProductPrefixes.Length];
            var suffix = SeedCatalog.ProductSuffixes[(i / SeedCatalog.ProductPrefixes.Length) % SeedCatalog.ProductSuffixes.Length];
            // Always include the index in the name so every product is unique.
            // The previous logic only added a suffix once i >= 400, which left
            // the first 400 products sharing the same "<prefix> <suffix>"
            // name. That collides with the composite key on PivotRow
            // (Year, Month, Region, Warehouse, Product) when BuildPivotRows
            // samples Products[i % 500] for i >= 400.
            var name = $"{prefix} {suffix} #{i + 1:D6}";
            var supplier = Suppliers[i % Suppliers.Count];
            var unitCost = Math.Round(18m + (decimal)(_rng.NextDouble() * 2400), 2);
            var safety = _rng.Next(20, 400);
            list.Add(new Product(
                Id: $"PRD-{i + 1:D6}",
                Sku: $"AGM-{100000 + i}",
                Name: name,
                Category: SeedCatalog.Categories[i % SeedCatalog.Categories.Length],
                PreferredSupplierId: supplier.Id,
                UnitCost: unitCost,
                LeadTimeDays: supplier.LeadTimeDays,
                SafetyStock: safety,
                ReorderPoint: safety + _rng.Next(10, 120)));
        }
        return list;
    }

    private IReadOnlyList<InventoryRecord> BuildInventory()
    {
        // ~3 warehouses per product on average => ~75k records
        var list = new List<InventoryRecord>(75_000);
        var id = 1;
        for (var p = 0; p < Products.Count; p++)
        {
            var product = Products[p];
            var warehouseCount = 2 + (p % 3); // 2..4
            for (var w = 0; w < warehouseCount; w++)
            {
                var warehouse = Warehouses[(p + w * 7) % Warehouses.Count];
                var qty = _rng.Next(0, 1200);
                var reserved = Math.Min(qty, _rng.Next(0, qty / 3 + 1));
                var available = qty - reserved;
                var status = available == 0 ? "Out of Stock"
                    : available < product.SafetyStock ? "Below Safety"
                    : available > product.SafetyStock * 4 ? "Excess"
                    : "Healthy";
                var supplier = Suppliers.First(s => s.Id == product.PreferredSupplierId);
                var replenishedOn = DateTime.UtcNow.Date.AddDays(-(_rng.Next(1, 90)));
                list.Add(new InventoryRecord(
                    Id: $"INV-{id:D6}",
                    ProductId: product.Id,
                    Sku: product.Sku,
                    ProductName: product.Name,
                    Category: product.Category,
                    WarehouseId: warehouse.Id,
                    WarehouseName: warehouse.Name,
                    Bin: $"{(char)('A' + (id % 6))}-{id % 40:D2}-{id % 200:D3}",
                    Quantity: qty,
                    Available: available,
                    Reserved: reserved,
                    SafetyStock: product.SafetyStock,
                    ReorderPoint: product.ReorderPoint,
                    UnitCost: product.UnitCost,
                    InventoryValue: Math.Round(qty * product.UnitCost, 2),
                    Status: status,
                    PreferredSupplierId: supplier.Id,
                    PreferredSupplierName: supplier.Name,
                    LeadTimeDays: product.LeadTimeDays,
                    LastReplenishment: DateOnly.FromDateTime(replenishedOn)));
                id++;
            }
        }
        return list;
    }

    private IReadOnlyList<PurchaseOrder> BuildPurchaseOrders()
    {
        var list = new List<PurchaseOrder>(12_000);
        var buyers = new[] { "A. Chen", "M. Patel", "J. Ortega", "S. Keller", "R. Nguyen", "L. Brooks" };
        for (var i = 0; i < 12_000; i++)
        {
            var supplier = Suppliers[i % Suppliers.Count];
            var plant = Warehouses.Where(w => w.Type == "Plant").ElementAt(i % 5);
            var created = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-(_rng.Next(1, 180))));
            var required = created.AddDays(supplier.LeadTimeDays + _rng.Next(-3, 10));
            var status = SeedCatalog.PoStatuses[i % SeedCatalog.PoStatuses.Length];
            var delivery = status switch
            {
                "Received" => "On Time",
                "In Transit" => _rng.NextDouble() > 0.7 ? "Delayed" : "In Transit",
                "Approval" or "Draft" => "Pending",
                _ => _rng.NextDouble() > 0.85 ? "At Risk" : "On Track"
            };
            list.Add(new PurchaseOrder(
                Id: $"PO-{i + 1:D6}",
                Number: $"PO-2026-{10000 + i}",
                SupplierId: supplier.Id,
                SupplierName: supplier.Name,
                Plant: plant.Name,
                CreatedDate: created,
                RequiredDate: required,
                Value: Math.Round(2_500m + (decimal)_rng.Next(0, 500_000), 0),
                Currency: supplier.Region == "EMEA" ? "EUR" : supplier.Region == "APAC" ? "USD" : "USD",
                Buyer: buyers[i % buyers.Length],
                Items: _rng.Next(1, 18),
                Status: status,
                DeliveryStatus: delivery,
                Risk: supplier.Risk));
        }
        return list;
    }

    private IReadOnlyList<SalesOrder> BuildSalesOrders()
    {
        var list = new List<SalesOrder>(20_000);
        for (var i = 0; i < 20_000; i++)
        {
            var customer = Customers[i % Customers.Count];
            var warehouse = Warehouses[i % Warehouses.Count];
            var orderDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-(_rng.Next(0, 120))));
            var requested = orderDate.AddDays(_rng.Next(3, 30));
            var status = SeedCatalog.OrderStatuses[i % SeedCatalog.OrderStatuses.Length];
            var fill = status == "Delivered" ? 1m : Math.Round((decimal)(0.55 + _rng.NextDouble() * 0.45), 2);
            var risk = fill < 0.75m || status is "Received" or "Allocation" && _rng.NextDouble() > 0.7
                ? "High"
                : _rng.NextDouble() > 0.85 ? "Moderate" : "Low";
            list.Add(new SalesOrder(
                Id: $"SO-{i + 1:D6}",
                Number: $"SO-2026-{20000 + i}",
                CustomerId: customer.Id,
                CustomerName: customer.Name,
                Region: customer.Region,
                OrderDate: orderDate,
                RequestedDate: requested,
                Value: Math.Round(1_200m + (decimal)_rng.Next(0, 250_000), 0),
                WarehouseId: warehouse.Id,
                WarehouseName: warehouse.Name,
                FulfillmentPct: fill,
                ShipmentId: $"SHP-{i + 1:D6}",
                Priority: SeedCatalog.Priorities[i % SeedCatalog.Priorities.Length],
                Status: status,
                Risk: risk));
        }
        return list;
    }

    private IReadOnlyList<Shipment> BuildShipments()
    {
        return SalesOrders.Take(15_000).Select((o, i) =>
        {
            var origin = Warehouses.First(w => w.Id == o.WarehouseId);
            var destGeo = SeedCatalog.SupplierGeos[(i + 3) % SeedCatalog.SupplierGeos.Length];
            var progress = (i % 10) / 10.0;
            return new Shipment(
                Id: o.ShipmentId,
                OrderId: o.Id,
                OriginWarehouseId: origin.Id,
                Destination: $"{destGeo.Country} Customer DC",
                Status: o.Status is "Shipped" or "Delivered" ? o.Status : "In Transit",
                Mode: i % 3 == 0 ? "Air" : i % 3 == 1 ? "Ocean" : "Road",
                OriginLat: origin.Latitude,
                OriginLng: origin.Longitude,
                CurrentLat: origin.Latitude + (destGeo.Lat - origin.Latitude) * progress,
                CurrentLng: origin.Longitude + (destGeo.Lng - origin.Longitude) * progress,
                DestLat: destGeo.Lat,
                DestLng: destGeo.Lng);
        }).ToList();
    }

    private IReadOnlyList<ExceptionItem> BuildExceptions()
    {
        var list = new List<ExceptionItem>(400);
        for (var i = 0; i < 400; i++)
        {
            var type = SeedCatalog.ExceptionTypes[i % SeedCatalog.ExceptionTypes.Length];
            var severity = type.Contains("Quality") || type.Contains("failure") ? "Critical"
                : type.Contains("below") || type.Contains("Late") ? "High"
                : i % 3 == 0 ? "Medium" : "Low";
            var warehouse = Warehouses[i % Warehouses.Count];
            list.Add(new ExceptionItem(
                Id: $"EXC-{i + 1:D4}",
                Type: type,
                Severity: severity,
                Entity: type.Contains("purchase") ? PurchaseOrders[i % PurchaseOrders.Count].Number
                    : type.Contains("Inventory") ? Inventory[i % Inventory.Count].Sku
                    : SalesOrders[i % SalesOrders.Count].Number,
                EntityId: $"ENT-{i}",
                Description: $"{type} detected at {warehouse.Name}",
                Region: warehouse.Region,
                Warehouse: warehouse.Name,
                DetectedAt: DateTime.UtcNow.AddHours(-(_rng.Next(1, 240))),
                Status: i % 5 == 0 ? "Resolved" : "Open"));
        }
        return list;
    }

    private IReadOnlyList<ProductionTask> BuildProductionTasks()
    {
        var plants = Warehouses.Where(w => w.Type == "Plant").ToList();
        var list = new List<ProductionTask>();
        var id = 1;
        foreach (var plant in plants)
        {
            var plantId = $"PT-{id++:D5}";
            list.Add(new ProductionTask(plantId, "", plant.Name, plant.Name, "", DateTime.UtcNow.Date, DateTime.UtcNow.Date.AddDays(45), 0.4m, null, "", false));
            for (var line = 1; line <= 3; line++)
            {
                var lineName = $"Assembly Line {(char)('A' + line - 1)}";
                var lineId = $"PT-{id++:D5}";
                list.Add(new ProductionTask(lineId, plantId, lineName, plant.Name, lineName, DateTime.UtcNow.Date.AddDays(line), DateTime.UtcNow.Date.AddDays(40), 0.5m, null, lineName, false));
                for (var order = 1; order <= 4; order++)
                {
                    var orderId = $"PT-{id++:D5}";
                    var orderName = $"PO-{7800 + order} {SeedCatalog.ProductPrefixes[order % SeedCatalog.ProductPrefixes.Length]}";
                    var start = DateTime.UtcNow.Date.AddDays(order * 2 + line);
                    list.Add(new ProductionTask(orderId, lineId, orderName, plant.Name, lineName, start, start.AddDays(12), 0.35m, null, lineName, false));
                    string? pred = null;
                    var steps = new[] { "Material Preparation", "PCB Assembly", "Testing", "Packaging" };
                    for (var s = 0; s < steps.Length; s++)
                    {
                        var taskId = $"PT-{id++:D5}";
                        var taskStart = start.AddDays(s * 2);
                        list.Add(new ProductionTask(taskId, orderId, steps[s], plant.Name, lineName, taskStart, taskStart.AddDays(2), (decimal)(0.2 + s * 0.15), pred, lineName, false));
                        pred = taskId;
                    }
                    list.Add(new ProductionTask($"PT-{id++:D5}", orderId, "Ship Ready", plant.Name, lineName, start.AddDays(9), start.AddDays(9), 0m, pred, lineName, true));
                }
            }
        }
        return list;
    }

    private IReadOnlyList<DockAppointment> BuildDockAppointments()
    {
        // Seed a 120-day window centred on "today" (~60 days back, ~60 days forward)
        // so the Warehouse scheduler looks busy in Day / Week / Month / Agenda /
        // Timeline views — matching the Syncfusion "Default Functionalities" demo.
        var list = new List<DockAppointment>();
        var types = new[] { "Inbound Shipment", "Outbound Shipment", "Maintenance", "Reserved" };
        var statuses = new[] { "Scheduled", "In Progress", "Delayed", "Completed", "Cancelled" };
        var carriers = new[]
        {
            "Maersk Line", "FedEx Freight", "DHL Global", "UPS Supply Chain",
            "Kuehne+Nagel", "XPO Logistics", "Old Dominion", "Yusen Logistics",
            "DB Schenker", "Expeditors",
        };
        var doorDescriptions = new[]
        {
            "Loading dock activity",
            "Cross-dock transfer",
            "Pallet breakdown",
            "Trailer swap",
            "Cold-chain handover",
            "Quality inspection",
            "Customs paperwork",
            "Driver break window",
            "Forklift refuel",
            "Yard move coordination",
        };

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var windowStart = today.AddDays(-60);
        var windowEnd = today.AddDays(60);
        var warehouseIndex = 0;

        foreach (var warehouse in Warehouses)
        {
            warehouseIndex++;
            // Distribution warehouses spawn 6 docks (CH-DC, TOR-DH, etc.) and
            // Hub/Plant types spawn more. To keep the Schedule legible we ship
            // a single appointment per dock per day — each one starts on its
            // own (dock, day) hour-slot so multiple docks don't overlap on the
            // same column, matching the Syncfusion default-demo layout.
            var dockCount = warehouse.Type == "Plant" ? 6 : 6;
            var dailyDockCount = Math.Min(dockCount, 4); // 4 visible per day so each gets a wide card
            var startIndex = warehouseIndex * 17;
            for (var day = windowStart; day < windowEnd; day = day.AddDays(1))
            {
                // Deterministic pattern: which docks fire today. We rotate the
                // visible docks so 4 per day, seed-stable across restarts.
                for (var visibleIdx = 0; visibleIdx < dailyDockCount; visibleIdx++)
                {
                    var dock = ((day.DayNumber * 13 + startIndex + visibleIdx * 31) % dockCount) + 1;
                    var dockId = $"{warehouse.Code}-DOCK-{dock:D2}";
                    var dockName = $"Dock {dock}";

                    // Each (visible dock of the day) is anchored to its own
                    // start hour so cards never share a row.
                    var hour = 6 + ((day.DayNumber + startIndex + visibleIdx * 5) % 14);
                    var minute = ((day.DayNumber + dock * 7 + visibleIdx) % 4) * 15;
                    var begin = day.ToDateTime(TimeOnly.MinValue).AddHours(hour).AddMinutes(minute);

                    var typeIdx = (day.DayNumber + startIndex + dock + visibleIdx) % types.Length;
                    var type = types[typeIdx];
                    var statusIdx = (day.DayNumber + startIndex + dock * 3 + visibleIdx * 5) % statuses.Length;
                    var status = statuses[statusIdx];

                    var durationMinutes = type == "Maintenance" ? 90 + (dock % 3) * 30
                                        : 30 + ((day.DayNumber + visibleIdx) % 4) * 30;
                    var end = begin.AddMinutes(durationMinutes);

                    var carrier = carriers[(day.DayNumber + startIndex + dock + visibleIdx) % carriers.Length];
                    var desc = doorDescriptions[(day.DayNumber + dock + visibleIdx) % doorDescriptions.Length];

                    list.Add(new DockAppointment(
                        Id: $"DA-{warehouse.Code}-{dock:D2}-{day:yyyyMMdd}-{visibleIdx:D2}",
                        WarehouseId: warehouse.Id,
                        DockId: dockId,
                        DockName: dockName,
                        Subject: $"{type} #{dock:D2}{visibleIdx + 1}",
                        EventType: type,
                        StartTime: begin,
                        EndTime: end,
                        Status: status,
                        Location: $"{warehouse.Name}",
                        Description: $"{desc} for {carrier}"));
                }
            }
        }
        return list;
    }

    private IReadOnlyList<WarehouseLocationNode> BuildWarehouseLocations()
    {
        var list = new List<WarehouseLocationNode>();
        var id = 1;
        foreach (var warehouse in Warehouses)
        {
            var rootId = $"LOC-{warehouse.Code}-ROOT";
            var rootQty = 8_000 + (id % 5_000);
            list.Add(new WarehouseLocationNode(
                rootId, "", warehouse.Name, "Warehouse", warehouse.Id, 20_000, rootQty,
                Math.Round((decimal)rootQty / 20_000, 2),
                rootQty > 18_000 ? "Full" : "Healthy"));

            for (var z = 0; z < 3; z++)
            {
                var zoneId = $"LOC-{warehouse.Code}-Z{z}";
                var zoneQty = 2_000 + z * 400 + (id % 300);
                list.Add(new WarehouseLocationNode(
                    zoneId, rootId, $"Zone {(char)('A' + z)}", "Zone", warehouse.Id, 5_000, zoneQty,
                    Math.Round((decimal)zoneQty / 5_000, 2), "Healthy"));
                for (var a = 1; a <= 2; a++)
                {
                    var aisleId = $"LOC-{warehouse.Code}-Z{z}-A{a:D2}";
                    var aisleQty = 600 + a * 40 + (id % 100);
                    list.Add(new WarehouseLocationNode(
                        aisleId, zoneId, $"Aisle {a:D2}", "Aisle", warehouse.Id, 1_200, aisleQty,
                        Math.Round((decimal)aisleQty / 1_200, 2), "Healthy"));
                    for (var b = 1; b <= 3; b++)
                    {
                        var qty = 40 + (id % 180);
                        var cap = 250;
                        var util = (decimal)qty / cap;
                        list.Add(new WarehouseLocationNode(
                            $"LOC-{warehouse.Code}-Z{z}-A{a:D2}-B{b:D3}",
                            aisleId,
                            $"A{a:D2}-{b:D3}",
                            "Bin",
                            warehouse.Id,
                            cap,
                            qty,
                            Math.Round(util, 2),
                            util > 0.9m ? "Full" : util < 0.2m ? "Low" : "Healthy"));
                        id++;
                    }
                }
            }
        }
        return list;
    }

    private IReadOnlyList<TrendPoint> BuildInventoryTrend()
    {
        var list = new List<TrendPoint>();
        var start = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddMonths(-11));
        for (var i = 0; i < 12; i++)
        {
            var month = start.AddMonths(i);
            list.Add(new TrendPoint(
                month.ToString("yyyy-MM"),
                Math.Round(110_000_000m + i * 1_400_000m + (decimal)_rng.Next(-2_000_000, 2_000_000), 0),
                Math.Round(18_000_000m + i * 420_000m + (decimal)_rng.Next(-800_000, 800_000), 0)));
        }
        return list;
    }

    private IReadOnlyList<PivotRow> BuildPivotRows()
    {
        // Iterate the unique (Month, Region, Warehouse) combinations in
        // a deterministic order so the composite key
        //   (Year=2026, Month, Region, Warehouse, Product)
        // never repeats. With 20 warehouses × 3 regions × 12 months = 720
        // unique triples, we draw 2,400 rows by walking the (warehouse,
        // region, month) lattice and rotating through 500 products. The
        // (warehouse, region) pair already has 60 unique slots; combined
        // with the 500-product rotation, every row is distinct.
        var list = new List<PivotRow>();
        const int target = 2400;
        for (var i = 0; i < target; i++)
        {
            // Use a single linear index into the (warehouse, region, month)
            // lattice to keep (month, region, warehouse) unique per row.
            var whIdx = i % Warehouses.Count;
            var warehouse = Warehouses[whIdx];
            // Rotate region independently of warehouse so a warehouse with a
            // fixed region still gets the other two regions across rows.
            var regionIdx = (i / Warehouses.Count) % SeedCatalog.Regions.Length;
            var region = SeedCatalog.Regions[regionIdx];
            var monthIdx = (i / (Warehouses.Count * SeedCatalog.Regions.Length)) % 12;
            var month = 1 + monthIdx;

            var supplier = Suppliers[i % Suppliers.Count];
            var category = SeedCatalog.Categories[i % SeedCatalog.Categories.Length];
            list.Add(new PivotRow(
                Year: 2026,
                Quarter: (month - 1) / 3 + 1,
                Month: month,
                Region: region,
                Country: warehouse.Country,
                Plant: warehouse.Type == "Plant" ? warehouse.Name : Warehouses.First(w => w.Type == "Plant" && w.Region == warehouse.Region).Name,
                Warehouse: warehouse.Name,
                Supplier: supplier.Name,
                Product: Products[i % 500].Name,
                ProductCategory: category,
                Customer: Customers[i % Customers.Count].Name,
                OrderStatus: SeedCatalog.OrderStatuses[i % SeedCatalog.OrderStatuses.Length],
                Revenue: Math.Round(5_000m + (decimal)_rng.Next(0, 200_000), 0),
                OrderQuantity: _rng.Next(1, 400),
                InventoryValue: Math.Round(10_000m + (decimal)_rng.Next(0, 500_000), 0),
                LeadTime: _rng.Next(5, 60),
                FreightCost: Math.Round(200m + (decimal)_rng.Next(0, 8000), 0),
                PurchaseAmount: Math.Round(3_000m + (decimal)_rng.Next(0, 150_000), 0),
                DelayDays: _rng.Next(0, 18)));
        }
        return list;
    }
}

public record TrendPoint(string Period, decimal InventoryValue, decimal OrderDemand);
public record PivotRow(
    int Year, int Quarter, int Month, string Region, string Country, string Plant, string Warehouse,
    string Supplier, string Product, string ProductCategory, string Customer, string OrderStatus,
    decimal Revenue, int OrderQuantity, decimal InventoryValue, int LeadTime, decimal FreightCost,
    decimal PurchaseAmount, int DelayDays);
