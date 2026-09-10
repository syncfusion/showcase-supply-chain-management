namespace Agm.SupplyChain.Api.Data;

public static class SeedCatalog
{
    public static readonly string[] ProductPrefixes =
    [
        "Industrial Controller", "Servo Drive", "High-Torque Actuator", "Precision Sensor",
        "Control Module", "Hydraulic Valve", "Power Inverter", "Motion Encoder",
        "Thermal Probe", "Relay Assembly", "PLC Rack", "Motor Starter",
        "Gearbox Unit", "Pressure Transducer", "Flow Meter", "Vision Camera",
        "Robot Gripper", "Conveyor Drive", "Safety Relay", "I/O Expander"
    ];

    public static readonly string[] ProductSuffixes =
    [
        "X400", "SD-280", "HTA-90", "PS-240", "CM-880", "HV-120", "PI-550",
        "ME-310", "TP-70", "RA-45", "PR-910", "MS-200", "GU-360", "PT-150",
        "FM-80", "VC-420", "RG-60", "CD-330", "SR-15", "IO-100"
    ];

    public static readonly string[] Categories =
    [
        "Controllers", "Motion", "Sensors", "Power", "Hydraulics",
        "Safety", "Robotics", "Vision", "Conveyance", "Electronics"
    ];

    public static readonly string[] SupplierNames =
    [
        "Vertex Industrial Systems", "Atlas Precision Components", "Meridian Electronics",
        "Nova Motion Technologies", "Summit Materials Group", "Cascade Automation",
        "Horizon Fluid Power", "Pinnacle Drive Systems", "Aether Sensor Works",
        "Ironclad Machining", "Lumina Optics", "Northbridge Metals",
        "Pacific Circuit Labs", "Rhein Precision GmbH", "Saigon Motion Co",
        "Monterrey Assemblies", "Bengal Components Ltd", "Ontario Alloy Works",
        "Dubai Logistics Parts", "Sydney Industrial Supply", "Baltic Relay Group",
        "Andean Copper Parts", "Kyoto Microdrives", "Prairie Hydraulics",
        "Gulf Coast Fasteners", "Alpine Gearworks", "Delta Thermal Systems",
        "Frontier Robotics", "Sterling Enclosure Co", "Crestline Bearings"
    ];

    public static readonly string[] CustomerNames =
    [
        "Sterling Automation", "Northstar Engineering", "Pioneer Industrial",
        "Crestline Systems", "Orion Manufacturing", "BluePeak Robotics",
        "Harborline Equipment", "Summit Forge Works", "Evergreen Controls",
        "Redwood Assembly", "Cobalt Process Co", "Silverline Machines",
        "Titan Fabrication", "Aurora Packaging", "Granite Motion Inc"
    ];

    public static readonly (string Name, string Code, string Region, string Country, string Type, double Lat, double Lng)[] Warehouses =
    [
        ("Chicago Distribution Center", "CHI-DC", "North America", "United States", "Distribution", 41.8781, -87.6298),
        ("Dallas Regional Warehouse", "DAL-RW", "North America", "United States", "Warehouse", 32.7767, -96.7970),
        ("Toronto Distribution Hub", "TOR-DH", "North America", "Canada", "Distribution", 43.6532, -79.3832),
        ("Monterrey Plant Warehouse", "MTY-PW", "North America", "Mexico", "Plant", 25.6866, -100.3161),
        ("Frankfurt Distribution Center", "FRA-DC", "EMEA", "Germany", "Distribution", 50.1109, 8.6821),
        ("Munich Manufacturing Plant", "MUC-MP", "EMEA", "Germany", "Plant", 48.1351, 11.5820),
        ("Birmingham Regional Hub", "BHX-RH", "EMEA", "United Kingdom", "Warehouse", 52.4862, -1.8904),
        ("Dubai Logistics Center", "DXB-LC", "EMEA", "United Arab Emirates", "Distribution", 25.2048, 55.2708),
        ("Pune Manufacturing Plant", "PNQ-MP", "APAC", "India", "Plant", 18.5204, 73.8567),
        ("Singapore Distribution Center", "SIN-DC", "APAC", "Singapore", "Distribution", 1.3521, 103.8198),
        ("Ho Chi Minh Plant Warehouse", "SGN-PW", "APAC", "Vietnam", "Plant", 10.8231, 106.6297),
        ("Sydney Regional Warehouse", "SYD-RW", "APAC", "Australia", "Warehouse", -33.8688, 151.2093),
        ("Atlanta Cross-Dock", "ATL-XD", "North America", "United States", "Warehouse", 33.7490, -84.3880),
        ("Seattle Spare Parts Depot", "SEA-SP", "North America", "United States", "Warehouse", 47.6062, -122.3321),
        ("Chicago Manufacturing Plant", "CHI-MP", "North America", "United States", "Plant", 41.85, -87.65),
        ("Hamburg Port Warehouse", "HAM-PW", "EMEA", "Germany", "Warehouse", 53.5511, 9.9937),
        ("Manchester Fulfillment Center", "MAN-FC", "EMEA", "United Kingdom", "Distribution", 53.4808, -2.2426),
        ("Chennai Component Depot", "MAA-CD", "APAC", "India", "Warehouse", 13.0827, 80.2707),
        ("Melbourne Service Hub", "MEL-SH", "APAC", "Australia", "Warehouse", -37.8136, 144.9631),
        ("Queretaro Assembly Plant", "QRO-AP", "North America", "Mexico", "Plant", 20.5888, -100.3899)
    ];

    public static readonly (string Region, string Country, double Lat, double Lng)[] SupplierGeos =
    [
        ("North America", "United States", 41.5, -87.5),
        ("North America", "Canada", 43.7, -79.4),
        ("North America", "Mexico", 25.7, -100.3),
        ("EMEA", "Germany", 50.1, 8.7),
        ("EMEA", "United Kingdom", 52.5, -1.9),
        ("EMEA", "United Arab Emirates", 25.2, 55.3),
        ("APAC", "India", 18.5, 73.9),
        ("APAC", "Vietnam", 10.8, 106.6),
        ("APAC", "Singapore", 1.35, 103.8),
        ("APAC", "Australia", -33.9, 151.2),
        ("APAC", "Japan", 35.0, 135.8),
        ("EMEA", "Poland", 52.2, 21.0)
    ];

    public static readonly string[] Regions = ["North America", "EMEA", "APAC"];
    public static readonly string[] BusinessUnits = ["Industrial Equipment", "Electronics", "Automation", "Aftermarket"];
    public static readonly string[] RiskLevels = ["Low", "Moderate", "High", "Critical"];
    public static readonly string[] PoStatuses = ["Draft", "Approval", "Issued", "Supplier Confirmed", "In Transit", "Received"];
    public static readonly string[] OrderStatuses = ["Received", "Allocation", "Picking", "Packing", "Shipped", "Delivered"];
    public static readonly string[] Priorities = ["Low", "Normal", "High", "Critical"];
    public static readonly string[] ExceptionTypes =
    [
        "Delayed shipment", "Inventory below safety stock", "Supplier delivery failure",
        "Quality hold", "Production delay", "Late purchase order"
    ];
}
