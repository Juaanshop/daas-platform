# PLAN.md: Arquitectura y Roadmap de Ejecución - Plataforma DaaS B2B

## 1. Visión General y Objetivos
Construcción de un MVP robusto y de alto impacto visual para una plataforma **Delivery-as-a-Service (DaaS) on-demand** orientada a clientes B2B (restaurantes y comercios gastronómicos locales) y una flota propia de repartidores.

---

## 2. Arquitectura de Carpetas y Componentes

```
daas-platform/
├── prisma/
│   ├── schema.prisma             # Modelos: User, Merchant, Rider, Order, DailySettlement
│   └── seed.ts                   # Semilla con datos reales de prueba
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root Layout con Providers y Shell de Navegación
│   │   ├── page.tsx              # Portal de bienvenida y selector interactivo de rol
│   │   ├── merchant/page.tsx     # Portal Comercio: Creación de pedido + Cotizador en vivo + Tabla activa
│   │   ├── admin/page.tsx        # Portal Backoffice: Monitor en vivo + Asignación de riders + KPIs
│   │   ├── rider/page.tsx        # Portal PWA Repartidor: Vista móvil para aceptar, retirar y entregar
│   │   ├── settlements/page.tsx  # Portal de Liquidaciones Diarias: Corte de caja y balances
│   │   └── api/
│   │       ├── orders/
│   │       │   ├── route.ts              # POST (crear orden + pricing) / GET (listar con filtros)
│   │       │   └── [id]/status/route.ts  # PATCH (cambio de estado y timestamps)
│   │       ├── riders/route.ts           # GET / PATCH (flota y ubicaciones)
│   │       ├── settlements/daily/route.ts# GET (resumen financiero del día)
│   │       └── events/route.ts           # SSE (Server-Sent Events para reactividad en vivo)
│   ├── components/
│   │   ├── ui/                   # Componentes base (Card, Badge, Button, Input, Modal, Toast)
│   │   ├── shared/Navbar.tsx     # Barra superior con cambio de roles y estado de conexión
│   │   ├── merchant/             # Componentes del portal de comercios
│   │   ├── admin/                # Componentes de despacho y métricas
│   │   └── rider/                # Componentes móviles de ejecución de entrega
│   ├── lib/
│   │   ├── db.ts                 # Instancia global Prisma Client
│   │   ├── events.ts             # Hub de eventos reactivo para SSE
│   │   └── validators.ts         # Contratos Zod para requests
│   └── services/
│       ├── pricing.ts            # Motor de cotización Haversine ($1.50 base + $0.50/km adicional)
│       └── settlement.ts         # Generador de liquidaciones por fecha
├── tests/
│   ├── pricing.test.ts           # Pruebas unitarias de pricing
│   └── order-flow.test.ts        # Pruebas unitarias de máquina de estados
├── package.json
└── tailwind.config.ts
```

---

## 3. Estado de Ejecución

- [x] **Fase 1: Setup & Data Layer**
  - Proyecto Next.js configurado con TypeScript, Tailwind CSS y Prisma ORM.
  - Esquema completo generado (`prisma/schema.prisma`).
  - Seed ejecutado con 1 Admin, 2 Comercios y 3 Riders con estados variados.
- [x] **Fase 2: Backend & API Core + Pricing Engine**
  - `PricingService` desacoplado implementado con fórmula de Haversine ($1.50 base + $0.50/km adicional).
  - Endpoints de órdenes implementados (`POST /api/orders`, `GET /api/orders`, `PATCH /api/orders/[id]/status`).
  - Endpoint de liquidaciones diarias (`GET /api/settlements/daily`).
  - Canal Server-Sent Events (`/api/events`) para actualización en tiempo real.
- [x] **Fase 3: Frontend Portales Especializados**
  - Portal de Comercio (`/merchant`): Creación ágil con cotizador en tiempo real y monitor de despachos.
  - Portal Backoffice Admin (`/admin`): Torre de control con matriz de asignación y métricas de flota.
  - Portal Móvil Repartidor (`/rider`): PWA con pasos guiados de retiro y entrega más contador de ganancias.
  - Liquidaciones Diarias (`/settlements`): Cuadre consolidado diario.
- [x] **Fase 4: Testing y Verificación**
  - Suite unitaria: 18 pruebas superadas satisfactoriamente (`npm test`).
  - Test de integración de base de datos exitoso (`tests/api-flow.test.ts`).
  - Compilación de producción (`npm run build`): 12 rutas generadas sin errores.
  - Servidor en ejecución en `http://localhost:3000`.
