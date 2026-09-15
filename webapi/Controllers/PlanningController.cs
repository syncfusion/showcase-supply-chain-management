using Agm.SupplyChain.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace Agm.SupplyChain.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public sealed class PlanningController : ControllerBase
{
    /// <summary>
    /// Quarterly demand and inventory planning rows for Syncfusion Spreadsheet.
    /// </summary>
    [HttpGet("planning")]
    public IActionResult GetPlanningWorksheet()
    {
        var categories = SeedCatalog.Categories;
        var regions = SeedCatalog.Regions;
        var rows = new List<object>();
        var rng = new Random(20260827);

        var rowIndex = 0;
        foreach (var region in regions)
        {
            foreach (var category in categories.Take(6))
            {
                rowIndex++;
                var q1Demand = 800 + rng.Next(0, 1200);
                var q2Demand = (int)(q1Demand * (0.95 + rng.NextDouble() * 0.25));
                var q3Demand = (int)(q2Demand * (0.9 + rng.NextDouble() * 0.3));
                var q4Demand = (int)(q3Demand * (0.95 + rng.NextDouble() * 0.2));
                var opening = 400 + rng.Next(0, 600);
                var safety = 150 + rng.Next(0, 200);
                var unitCost = Math.Round(40 + rng.NextDouble() * 400, 2);

                rows.Add(new
                {
                    id = rowIndex,
                    region,
                    category,
                    openingInventory = opening,
                    safetyStock = safety,
                    unitCost,
                    q1Demand,
                    q2Demand,
                    q3Demand,
                    q4Demand,
                    // Client spreadsheet will also compute these via formulas for demo;
                    // server provides baseline values for initial load.
                    annualDemand = q1Demand + q2Demand + q3Demand + q4Demand,
                    targetInventory = safety + (int)((q1Demand + q2Demand + q3Demand + q4Demand) / 4.0),
                    replenishment = Math.Max(0, safety + (int)((q1Demand + q2Demand + q3Demand + q4Demand) / 4.0) - opening),
                    inventoryValue = Math.Round(opening * unitCost, 2)
                });
            }
        }

        return Ok(new
        {
            title = "AGM Quarterly Demand & Inventory Planning",
            fiscalYear = 2026,
            assumptions = new
            {
                growthRate = 0.08,
                serviceLevel = 0.95,
                planningHorizon = "Q1–Q4 2026"
            },
            rows
        });
    }
}
