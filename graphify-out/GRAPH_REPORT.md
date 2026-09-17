# Graph Report - daas-platform  (2026-09-17)

## Corpus Check
- 83 files · ~50,424 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .mdc 1, .example 1, (none) 1)

## Summary
- 339 nodes · 727 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12

## God Nodes (most connected - your core abstractions)
1. `react` - 28 edges
2. `lucide-react` - 24 edges
3. `framer-motion` - 21 edges
4. `getGoogleMapsSearchUrl()` - 19 edges
5. `Badge()` - 16 edges
6. `cn()` - 16 edges
7. `compilerOptions` - 16 edges
8. `GeofenceService` - 14 edges
9. `PricingService` - 11 edges
10. `runAllTests()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `runMapsTests()` --calls--> `parseGoogleMapsInput()`  [EXTRACTED]
  tests/maps.test.ts → src/lib/maps.ts
- `runPricingTests()` --calls--> `calculateHaversineDistance()`  [EXTRACTED]
  tests/pricing.test.ts → src/services/pricing.ts
- `testApiFlow()` --calls--> `isValidTransition()`  [EXTRACTED]
  tests/api-flow.test.ts → src/lib/validators.ts
- `runOrderFlowTests()` --calls--> `isValidTransition()`  [EXTRACTED]
  tests/order-flow.test.ts → src/lib/validators.ts
- `POST()` --calls--> `parseGoogleMapsInput()`  [EXTRACTED]
  src/app/api/maps/resolve/route.ts → src/lib/maps.ts

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (36): ref_events, ref_fs, ref_next_server, ref_path, zod, dynamic, PATCH(), POST() (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (32): react, @vis.gl/react-google-maps, SettlementsPage(), DispatchMonitor(), DispatchMonitorProps, Order, Rider, WhatsAppModalState (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (27): framer-motion, lucide-react, CreateMerchantModal(), CreateMerchantModalProps, CreateRiderModal(), CreateRiderModalProps, DeleteConfirmModal(), DeleteConfirmModalProps (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (39): dependencies, clsx, framer-motion, lucide-react, next, @prisma/client, react, react-dom (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (22): POST(), HomePage(), AdminOrderModal(), AdminOrderModalProps, GOOGLE_MAPS_PRESETS, Merchant, Rider, GoogleMapsDistanceService (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (19): POST(), ActiveOrders(), ActiveOrdersProps, Order, CustomerDetailModal(), CustomerDetailModalProps, OrderDetail, Order (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.20
Nodes (10): ref_node_assert, GET(), CustomerRecord, ItemizedDispatchRecord, RiderSettlementRecord, SettlementOptions, SettlementService, SettlementSummary (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.20
Nodes (7): nextConfig, next, ref_next_link, ref_next_navigation, src_app_globals, metadata, Navbar()

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss, tsx, @types/node (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.36
Nodes (6): getInitials(), getWhatsAppUrl(), OrderItem, RiderProfile, RiderRecordCard(), RiderRecordCardProps

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (4): eslintConfig, ref_eslint_config, ref_eslint_config_next_core_web_vitals, ref_eslint_config_next_typescript

## Knowledge Gaps
- **119 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+114 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 157 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 1` to `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Community 2` to `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `framer-motion` connect `Community 2` to `Community 1`, `Community 3`, `Community 5`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _119 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05575065847234416 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09990749306197964 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10570824524312897 - nodes in this community are weakly interconnected._