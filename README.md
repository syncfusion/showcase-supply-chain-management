# AGM Supply Chain Management

AGM Supply Chain Management is an enterprise showcase application built with a shared ASP.NET Core Web API and a Syncfusion-powered React client.

The application demonstrates how a supply chain organization can bring real-time inventory monitoring, procurement planning, supplier management, warehouses, capacity planning, analytics, and notifications into one responsive command center. It showcases how Syncfusion UI components and Syncfusion Code Studio accelerate enterprise application development.

> This is a showcase application with deterministic sample data. It is not intended to be used as a production supply chain system without adding production authentication, authorization, auditing, secrets management, and operational controls.

## What the showcase includes

- Supply chain command center dashboard with KPIs, charts, and key metrics
- Real-time inventory monitoring and management with status tracking, including per-SKU detail views
- Procurement (purchase orders) with detailed PO views and supplier linkage
- Suppliers directory with supplier detail pages
- Sales orders with detail pages and order-line workflows
- Warehouses and warehouse location hierarchy
- Capacity planning views
- Analytics with planning worksheets and forecasts
- Supplier and system notifications with issue tracking
- Responsive layouts, dark mode, loading states, error handling, and accessible navigation
- Deterministic seed data with multi-persistence support (in-memory, SQLite, PostgreSQL)

## Technology

| Layer | Technology |
| --- | --- |
| API | ASP.NET Core Web API on .NET 10 |
| Data | Entity Framework Core with PostgreSQL / SQLite / In-Memory support (Npgsql) |
| React client | React 19, TypeScript, Vite, Syncfusion React UI 34.x |
| Static hosting | Lightweight Node/Express-style `server.cjs` for the React build (serves on port `8080` under `/supply-chain/react`) |

The UI implementation uses Syncfusion components such as DataGrid, Charts, Gantt, Kanban, Timeline, Tabs, Sidebars, Dialogs, Inputs, DropDowns, Buttons, ProgressBar, Notifications (Toast/Spinner), PivotView, Scheduler, Spreadsheet, TreeGrid, PDF Viewer, Maps and Cards.

## Why Syncfusion Code Studio and UI components?

This repository is a practical proof of how [Syncfusion Code Studio](https://www.syncfusion.com/code-studio/) and the [Syncfusion component ecosystem](https://www.syncfusion.com/) can accelerate component-rich enterprise development.

- Code Studio can help teams plan features, generate and refine code, debug issues, and create tests with awareness of the existing codebase.
- Production-oriented UI components reduce the amount of custom code required for advanced grids, charts, workflows, dialogs, theming, and real-time data displays.
- Built-in capabilities such as filtering, grouping, paging, export, responsive rendering, accessibility, and theming help teams focus on business workflows rather than foundational UI infrastructure.
- A single API surface serves multiple client types, making it easy to adapt the same backend experience across different frontend frameworks.

## Repository structure

```text
supply-chain-hosting/
├── webapi/                                # ASP.NET Core Web API (.NET 10)
│   ├── Agm.SupplyChain.Api.csproj         # Detects Postgres / SQLite / In-Memory at startup
│   ├── Controllers/                       # Dashboard, Catalog, Inventory, Planning, Notifications, DataManager, Health
│   ├── Data/                              # DbContext, factories, migrations, seed data + configurations
│   │   └── Migrations/                    # EF Core migrations
│   ├── Models/                            # DTOs and entity models
│   ├── Middleware/                        # Custom middleware (latency simulation, etc.)
│   ├── Query/                             # Query extensions and filtering helpers
│   ├── Properties/launchSettings.json     # Default dev URL: http://localhost:5080
│   ├── appsettings.json                   # Configuration (Persistence, NetworkSimulation, CORS, ConnectionStrings)
│   └── wwwroot/                           # Static SPA fallback + config.js (browser-side Syncfusion license)
└── react/                                 # React 19 + Vite client
    ├── server.cjs                         # Node static server: serves `dist/` on :8080 at /supply-chain/react
    ├── public/config.js                   # Dev-only browser config (Syncfusion license override)
    ├── src/
    │   ├── app/                           # Application shell, providers, routing
    │   │   ├── layout/                    # AppShell, navigation chrome
    │   │   ├── providers/                 # Theme + data providers
    │   │   └── routing/                   # AppRouter.tsx (lazy module routes)
    │   ├── basePath.ts                    # Single source of truth for the '/supply-chain/react' mount path
    │   ├── modules/                       # Feature modules
    │   │   ├── analytics/                 # Analytics + Planning Worksheet page
    │   │   ├── capacity/                  # Capacity Planning page
    │   │   ├── dashboard/                 # Dashboard / Overview
    │   │   ├── inventory/                 # Inventory list + InventoryDetailPage
    │   │   ├── orders/                    # Sales orders + OrderDetailPage
    │   │   ├── procurement/               # Purchase orders + PurchaseOrderDetailPage
    │   │   ├── suppliers/                 # Suppliers list + SupplierDetailPage
    │   │   └── warehouses/                # Warehouses & locations
    │   ├── shared/                        # Shared utilities and components
    │   │   ├── components/                # Reusable UI primitives
    │   │   ├── models/                    # TypeScript model definitions
    │   │   ├── services/                  # API clients + data services
    │   │   ├── showcase/                  # Showcase-specific helpers
    │   │   ├── syncfusion/                # Syncfusion thin wrappers / config
    │   │   ├── theme/                     # Theming tokens (light / dark)
    │   │   └── utils/                     # Generic helpers (formatting, dates, etc.)
    │   ├── assets/                        # Images, styles, static resources
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json                      # + tsconfig.app.json / tsconfig.node.json
    └── package.json
```

## Run locally

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download) (the API targets `net10.0`)
- A current Node.js LTS release and npm
- (Optional) PostgreSQL 14+ reachable for persistent storage
- A valid Syncfusion license or trial where required

### 1. Start the Web API

By default, the API uses **Postgres** persistence (see [appsettings.json](webapi/appsettings.json)). Switch to in-memory or SQLite by setting `Demo:Persistence`:

```json
{
  "Demo": {
    "NetworkSimulation": "Normal",
    "EnableSwagger": false,
    "Persistence": "Postgres",   // "Memory", "Postgres", or "Sqlite"
    "SqlitePath": ""             // Set when Persistence = "Sqlite" (defaults under bin/Debug/...)
  },
  "ConnectionStrings": {
    "SupplyChainDataBase": "Host=localhost;Port=5432;Database=supply_chain;Username=postgres;Password=password"
  }
}
```

Then start the API:

```bash
cd webapi
dotnet restore
dotnet run --project Agm.SupplyChain.Api.csproj
```

The API exposes:

- HTTP — `http://localhost:5080` (default from `Properties/launchSettings.json`; Swagger UI at `/swagger`, OpenAPI at `/openapi/v1.json` when `Demo:EnableSwagger` is `true`)

CORS is preconfigured for the React dev servers (`localhost:5173`–`5176`, `4200`, `5197`). Update `Cors:Policies:AllowReactApp:Origins` in [appsettings.json](webapi/appsettings.json) to add more.

### 2. Start the React client

```bash
cd react
npm install
npm run dev
```

- Vite dev server runs at `http://localhost:5173` (or the next available port) and reads `VITE_API_BASE_URL` from `.env.development` (defaults to `http://localhost:5080`).
- The app is built to be served from the **`/supply-chain/react`** base path so the same `dist/` works behind a vanity path ([react/basePath.ts](react/src/basePath.ts)) and directly from origin.

### 3. (Optional) Serve the built React app from the Node static server

```bash
cd react
npm run build
npm start            # node server.cjs, listens on 0.0.0.0:8080 under /supply-chain/react
```

This is what production hosts (App Service, container images, etc.) use. The browser-side Syncfusion license can be injected either at build time via `VITE_SYNCFUSION_LICENSE` in `.env.local` or at runtime by editing `wwwroot/config.js` / `react/public/config.js`.

## Pages

All routes are nested under the `/supply-chain/react` base path in production (e.g. `/supply-chain/react/inventory`). During `npm run dev`, Vite omits the base path.

| Route | Page | Description |
| --- | --- | --- |
| `/dashboard` | **Overview** | Supply chain command center with KPI cards, real-time metrics, charts, and key performance indicators. |
| `/inventory` | **Inventory** | Real-time inventory monitoring, status tracking, stock levels, and adjustment history. |
| `/inventory/:inventoryId` | **Inventory detail** | Per-SKU inventory drill-down with recent adjustments and locations. |
| `/procurement` | **Procurement** | Purchase order pipeline with statuses, suppliers, and totals. |
| `/procurement/:poId` | **Purchase order detail** | PO lines, receiving status, supplier, and timeline. |
| `/suppliers` | **Suppliers** | Supplier directory with performance and contact info. |
| `/suppliers/:supplierId` | **Supplier detail** | Per-supplier drill-down, recent POs, and open issues. |
| `/orders` | **Sales orders** | Order pipeline with statuses and fulfilment view. |
| `/orders/:orderId` | **Order detail** | Order lines, shipment progress, and customer info. |
| `/warehouses` | **Warehouses** | Warehouse list and location hierarchy. |
| `/capacity` | **Capacity Planning** | Capacity vs demand across sites and time windows. |
| `/analytics` | **Analytics** | Charts and reports across the supply chain. |
| `/analytics/planning-worksheet` | **Planning worksheet** | Interactive planning workspace tied to Analytics. |

## API surface

Base URL: `http://localhost:5080/api`

| Area | Prefix | Endpoints |
| --- | --- | --- |
| Dashboard | `/api/dashboard` | `GET /`, `GET /metrics`, `GET /charts` |
| Catalog | `/api/catalog` | `GET /categories`, `GET /products`, `POST /products`, `PATCH /products/{id}`, `DELETE /products/{id}` |
| Inventory | `/api/inventory` | `GET /items`, `GET /items/{id}`, `POST /adjustments`, `GET /adjustments`, `GET /history` |
| Planning | `/api/planning` | `GET /forecasts`, `GET /schedules`, `POST /schedules`, `PATCH /schedules/{id}` |
| Notifications | `/api/notifications` | `GET /alerts`, `GET /issues`, `POST /issues`, `PATCH /issues/{id}` |
| Health | `/health` | `GET /` — liveness probe |

Additional server-side controllers live alongside the API surface for admin / data-manager flows (`/api/data-manager/...`) and may not be documented in the table above.

## Build

```bash
# API
cd webapi
dotnet build

# React
cd ../react
npm run build
```

## Resetting demo data

To reset the in-memory data to seed state, restart the API service. For database-backed storage, truncate or drop the tables and restart to reinitialize from seed data. The seeder lives in [`webapi/Data/SupplyChainSeeder.cs`](webapi/Data/SupplyChainSeeder.cs) and the deterministic base data in [`webapi/Data/SeedCatalog.cs`](webapi/Data/SeedCatalog.cs).

## Licensing

Syncfusion packages are governed by Syncfusion's licensing terms. Review the [Syncfusion licensing documentation](https://www.syncfusion.com/sales/licensing) before redistributing or deploying the applications. Publishing this source repository does not grant a license to Syncfusion products.

## Intended audience

This showcase is useful for engineering leaders, architects, product teams, and developers evaluating how a modern supply chain management workspace can be implemented with a shared API and enterprise web frameworks like React, with Syncfusion components delivering production-ready UI and data-binding capabilities.
