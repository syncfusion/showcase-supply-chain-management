using Agm.SupplyChain.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace Agm.SupplyChain.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public sealed class NotificationsController(SupplyChainStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetNotifications()
    {
        var awaitingApproval = store.PurchaseOrders.Count(p => p.Status == "Approval");
        var belowSafety = store.Inventory.Count(i => i.Status == "Below Safety");
        var highRiskSuppliers = store.Suppliers.Count(s => s.Risk is "High" or "Critical");
        var delayedShipments = store.PurchaseOrders.Count(p => p.DeliveryStatus == "Delayed");
        var atRiskOrders = store.SalesOrders.Count(o => o.Risk == "High");

        var items = new[]
        {
            new
            {
                id = "n1",
                title = $"{awaitingApproval} purchase orders require approval",
                category = "Procurement",
                severity = "High",
                route = "/procurement?status=Approval",
                time = "12 min ago"
            },
            new
            {
                id = "n2",
                title = $"{Math.Min(belowSafety, 999)} materials below safety stock",
                category = "Inventory",
                severity = "Critical",
                route = "/inventory?status=Below%20Safety",
                time = "28 min ago"
            },
            new
            {
                id = "n3",
                title = $"{highRiskSuppliers} suppliers moved to high risk",
                category = "Suppliers",
                severity = "High",
                route = "/suppliers?risk=High",
                time = "1 hr ago"
            },
            new
            {
                id = "n4",
                title = $"{delayedShipments} shipments delayed",
                category = "Logistics",
                severity = "Medium",
                route = "/procurement",
                time = "2 hr ago"
            },
            new
            {
                id = "n5",
                title = $"{atRiskOrders} customer orders at risk",
                category = "Orders",
                severity = "High",
                route = "/orders?risk=High",
                time = "3 hr ago"
            }
        };

        return Ok(new { count = items.Length, items });
    }
}
