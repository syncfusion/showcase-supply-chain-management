using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Agm.SupplyChain.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class DomainEntitiesV1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Quantity",
                table: "inventory_adjustments",
                newName: "quantity");

            migrationBuilder.RenameColumn(
                name: "Bin",
                table: "inventory_adjustments",
                newName: "bin");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "inventory_adjustments",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedUtc",
                table: "inventory_adjustments",
                newName: "updated_utc");

            migrationBuilder.RenameColumn(
                name: "SafetyStock",
                table: "inventory_adjustments",
                newName: "safety_stock");

            migrationBuilder.RenameColumn(
                name: "ReorderPoint",
                table: "inventory_adjustments",
                newName: "reorder_point");

            migrationBuilder.RenameColumn(
                name: "PreferredSupplierId",
                table: "inventory_adjustments",
                newName: "preferred_supplier_id");

            migrationBuilder.CreateTable(
                name: "customers",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    region = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    country = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "dock_appointments",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    warehouse_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    dock_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    dock_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    subject = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    event_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    start_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dock_appointments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "exceptions",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    severity = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    entity = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    entity_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    region = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    warehouse = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    detected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exceptions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "inventory_records",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    product_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    sku = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    product_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    category = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    warehouse_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    warehouse_name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    bin = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    available = table.Column<int>(type: "integer", nullable: false),
                    reserved = table.Column<int>(type: "integer", nullable: false),
                    safety_stock = table.Column<int>(type: "integer", nullable: false),
                    reorder_point = table.Column<int>(type: "integer", nullable: false),
                    unit_cost = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    inventory_value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    preferred_supplier_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    preferred_supplier_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    lead_time_days = table.Column<int>(type: "integer", nullable: false),
                    last_replenishment = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_records", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "inventory_trend",
                columns: table => new
                {
                    period = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    inventory_value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    order_demand = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_trend", x => x.period);
                });

            migrationBuilder.CreateTable(
                name: "pivot_rows",
                columns: table => new
                {
                    year = table.Column<int>(type: "integer", nullable: false),
                    month = table.Column<int>(type: "integer", nullable: false),
                    region = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    warehouse = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    product = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    quarter = table.Column<int>(type: "integer", nullable: false),
                    country = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    plant = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    supplier = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    product_category = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    customer = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    order_status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    revenue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    order_quantity = table.Column<int>(type: "integer", nullable: false),
                    inventory_value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    lead_time = table.Column<int>(type: "integer", nullable: false),
                    freight_cost = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    purchase_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    delay_days = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pivot_rows", x => new { x.year, x.month, x.region, x.warehouse, x.product });
                });

            migrationBuilder.CreateTable(
                name: "production_tasks",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    parent_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    plant = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    production_line = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    progress = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    predecessor = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    resource = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    is_milestone = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_tasks", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    sku = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    category = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    preferred_supplier_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    unit_cost = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    lead_time_days = table.Column<int>(type: "integer", nullable: false),
                    safety_stock = table.Column<int>(type: "integer", nullable: false),
                    reorder_point = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "purchase_orders",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    number = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    supplier_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    supplier_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    plant = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    created_date = table.Column<DateOnly>(type: "date", nullable: false),
                    required_date = table.Column<DateOnly>(type: "date", nullable: false),
                    value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    buyer = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    items = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    delivery_status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    risk = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchase_orders", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sales_orders",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    number = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    customer_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    customer_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    region = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    order_date = table.Column<DateOnly>(type: "date", nullable: false),
                    requested_date = table.Column<DateOnly>(type: "date", nullable: false),
                    value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    warehouse_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    warehouse_name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    fulfillment_pct = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    shipment_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    priority = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    risk = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sales_orders", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "shipments",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    order_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    origin_warehouse_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    destination = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    mode = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    origin_lat = table.Column<double>(type: "double precision", nullable: false),
                    origin_lng = table.Column<double>(type: "double precision", nullable: false),
                    current_lat = table.Column<double>(type: "double precision", nullable: false),
                    current_lng = table.Column<double>(type: "double precision", nullable: false),
                    dest_lat = table.Column<double>(type: "double precision", nullable: false),
                    dest_lng = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shipments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    region = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    country = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    category = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    annual_spend = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    lead_time_days = table.Column<int>(type: "integer", nullable: false),
                    otif = table.Column<decimal>(type: "numeric(5,3)", nullable: false),
                    quality_score = table.Column<decimal>(type: "numeric(5,3)", nullable: false),
                    risk = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    open_pos = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    latitude = table.Column<double>(type: "double precision", nullable: false),
                    longitude = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suppliers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_locations",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    parent_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    level = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    warehouse_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    capacity = table.Column<int>(type: "integer", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    utilization = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_locations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "warehouses",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    code = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    region = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    country = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    latitude = table.Column<double>(type: "double precision", nullable: false),
                    longitude = table.Column<double>(type: "double precision", nullable: false),
                    utilization = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    inventory_value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    open_orders = table.Column<int>(type: "integer", nullable: false),
                    inbound_shipments = table.Column<int>(type: "integer", nullable: false),
                    outbound_shipments = table.Column<int>(type: "integer", nullable: false),
                    capacity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouses", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_customers_region",
                table: "customers",
                column: "region");

            migrationBuilder.CreateIndex(
                name: "IX_dock_appointments_status",
                table: "dock_appointments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_dock_appointments_warehouse_id_start_time",
                table: "dock_appointments",
                columns: new[] { "warehouse_id", "start_time" });

            migrationBuilder.CreateIndex(
                name: "IX_exceptions_region",
                table: "exceptions",
                column: "region");

            migrationBuilder.CreateIndex(
                name: "IX_exceptions_severity",
                table: "exceptions",
                column: "severity");

            migrationBuilder.CreateIndex(
                name: "IX_exceptions_status",
                table: "exceptions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_records_product_id_warehouse_id",
                table: "inventory_records",
                columns: new[] { "product_id", "warehouse_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inventory_records_sku",
                table: "inventory_records",
                column: "sku");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_records_status",
                table: "inventory_records",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_records_warehouse_id",
                table: "inventory_records",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_pivot_rows_region",
                table: "pivot_rows",
                column: "region");

            migrationBuilder.CreateIndex(
                name: "IX_pivot_rows_year_month",
                table: "pivot_rows",
                columns: new[] { "year", "month" });

            migrationBuilder.CreateIndex(
                name: "IX_production_tasks_parent_id",
                table: "production_tasks",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_tasks_plant",
                table: "production_tasks",
                column: "plant");

            migrationBuilder.CreateIndex(
                name: "IX_products_category",
                table: "products",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_products_preferred_supplier_id",
                table: "products",
                column: "preferred_supplier_id");

            migrationBuilder.CreateIndex(
                name: "IX_products_sku",
                table: "products",
                column: "sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_number",
                table: "purchase_orders",
                column: "number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_risk",
                table: "purchase_orders",
                column: "risk");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_status",
                table: "purchase_orders",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_supplier_id",
                table: "purchase_orders",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_customer_id",
                table: "sales_orders",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_number",
                table: "sales_orders",
                column: "number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_region",
                table: "sales_orders",
                column: "region");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_risk",
                table: "sales_orders",
                column: "risk");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_status",
                table: "sales_orders",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_shipments_order_id",
                table: "shipments",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "IX_shipments_status",
                table: "shipments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_category",
                table: "suppliers",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_region",
                table: "suppliers",
                column: "region");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_risk",
                table: "suppliers",
                column: "risk");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_locations_parent_id",
                table: "warehouse_locations",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_locations_warehouse_id_level",
                table: "warehouse_locations",
                columns: new[] { "warehouse_id", "level" });

            migrationBuilder.CreateIndex(
                name: "IX_warehouses_code",
                table: "warehouses",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_warehouses_region",
                table: "warehouses",
                column: "region");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "customers");

            migrationBuilder.DropTable(
                name: "dock_appointments");

            migrationBuilder.DropTable(
                name: "exceptions");

            migrationBuilder.DropTable(
                name: "inventory_records");

            migrationBuilder.DropTable(
                name: "inventory_trend");

            migrationBuilder.DropTable(
                name: "pivot_rows");

            migrationBuilder.DropTable(
                name: "production_tasks");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "purchase_orders");

            migrationBuilder.DropTable(
                name: "sales_orders");

            migrationBuilder.DropTable(
                name: "shipments");

            migrationBuilder.DropTable(
                name: "suppliers");

            migrationBuilder.DropTable(
                name: "warehouse_locations");

            migrationBuilder.DropTable(
                name: "warehouses");

            migrationBuilder.RenameColumn(
                name: "quantity",
                table: "inventory_adjustments",
                newName: "Quantity");

            migrationBuilder.RenameColumn(
                name: "bin",
                table: "inventory_adjustments",
                newName: "Bin");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "inventory_adjustments",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_utc",
                table: "inventory_adjustments",
                newName: "UpdatedUtc");

            migrationBuilder.RenameColumn(
                name: "safety_stock",
                table: "inventory_adjustments",
                newName: "SafetyStock");

            migrationBuilder.RenameColumn(
                name: "reorder_point",
                table: "inventory_adjustments",
                newName: "ReorderPoint");

            migrationBuilder.RenameColumn(
                name: "preferred_supplier_id",
                table: "inventory_adjustments",
                newName: "PreferredSupplierId");
        }
    }
}
