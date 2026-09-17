# DaaS Flash - Plataforma B2B Delivery-as-a-Service on-demand

Plataforma web B2B de Delivery-as-a-Service (DaaS) on-demand para coordinar despachos locales de última milla entre comercios gastronómicos y una flota propia de repartidores con asignación inteligente y tarifación instantánea por distancia Haversine.

---

## 🚀 Tecnologías Principales

- **Frontend & Framework:** Next.js 16 (App Router), React 19, TypeScript.
- **Estilos & UI:** Tailwind CSS, Lucide React, Glassmorphism y diseño responsive adaptado a desktop y móviles.
- **Backend & APIs:** Next.js Route Handlers con Server-Sent Events (SSE) para sincronización en tiempo real sin recarga.
- **Base de Datos & ORM:** Prisma ORM v6 con SQLite (configurable a PostgreSQL vía `DATABASE_URL`).
- **Validaciones:** Zod para contratos API y esquemas de formulario.
- **Motor Geoespacial & Pricing:** `PricingService` desacoplado con cálculo de distancia ortodrómica Haversine.

---

## 📦 Estructura del Proyecto

```
daas-platform/
├── prisma/
│   ├── schema.prisma             # Modelo de datos (User, Merchant, Rider, Order, DailySettlement)
│   ├── seed.ts                   # Semilla con Admin, 2 Comercios y 3 Riders con estados variados
│   └── dev.db                    # Base de datos SQLite inicializada
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Shell principal con Navbar y tema oscuro moderno
│   │   ├── page.tsx              # Hub central y simulador interactivo de tarifas
│   │   ├── merchant/page.tsx     # Portal Comercio: Cotizador rápido y monitor de despachos
│   │   ├── admin/page.tsx        # Backoffice: Monitor global y asignación de flota
│   │   ├── rider/page.tsx        # PWA Repartidor: Vista móvil para retiro y entrega
│   │   ├── settlements/page.tsx  # Liquidaciones: Resumen financiero y cortes del día
│   │   └── api/
│   │       ├── orders/           # POST (crear orden + pricing) / GET (listar con filtros)
│   │       ├── orders/[id]/status# PATCH (máquina de estados y timestamps)
│   │       ├── riders/           # GET / PATCH (listar y actualizar estado de repartidores)
│   │       ├── merchants/        # GET (listar comercios)
│   │       ├── settlements/daily # GET (corte de caja del día)
│   │       └── events/           # GET (SSE en tiempo real)
│   ├── components/
│   │   ├── shared/               # Navbar con indicador SSE en vivo, StatusBadge
│   │   ├── merchant/             # OrderForm (cotizador reactivo), ActiveOrders
│   │   ├── admin/                # DispatchMonitor, FleetCard
│   │   └── rider/                # RiderJobCard (acciones táctiles para repartidor)
│   ├── lib/
│   │   ├── db.ts                 # Instancia global Prisma Client
│   │   ├── events.ts             # EventHub para eventos Server-Sent Events
│   │   └── validators.ts         # Contratos y máquina de estados con Zod
│   └── services/
│       ├── pricing.ts            # Motor de cotización por Haversine
│       └── settlement.ts         # Agregaciones de corte de caja diario
├── tests/
│   ├── pricing.test.ts           # Pruebas unitarias de fórmula Haversine y tarifas
│   ├── order-flow.test.ts        # Pruebas unitarias de máquina de estados
│   ├── api-flow.test.ts          # Pruebas de integración de base de datos
│   └── runner.ts                 # Suite runner ejecutable
└── PLAN.md                       # Especificación de arquitectura y roadmap
```

---

## ⚙️ Reglas de Tarifación (`PricingService`)

- **Tarifa Base:** $1.50 (cubre los primeros 2.0 km de recorrido).
- **Tarifa por Km Adicional:** $0.50 por cada km adicional transcurrido.
- **Fórmula:**
  $$\text{Costo Total} = \$1.50 + \max(0, \text{Distancia} - 2.0) \times \$0.50$$
- **Tiempo Estimado:** Velocidad media de despacho urbano (25 km/h) + 5 minutos fijos de retiro y empaque.
- **Distribución de Ganancias:** El repartidor percibe el 80% del valor total de cada entrega realizada.

---

## 🛠️ Comandos de Ejecución

```bash
# Instalar dependencias
npm install

# Sincronizar base de datos y generar cliente Prisma
npm run db:push

# Poblar con datos de prueba (Admin, Comercios, Riders)
npm run db:seed

# Ejecutar la suite de tests unitarios
npm test

# Ejecutar el test de integración de flujo
npx tsx tests/api-flow.test.ts

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción y correr
npm run build
npm start
```

---

## 🌐 Enlaces de los Portales

- **Hub Central:** [http://localhost:3000](http://localhost:3000)
- **Portal Comercio:** [http://localhost:3000/merchant](http://localhost:3000/merchant)
- **Backoffice Admin:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **PWA Repartidor:** [http://localhost:3000/rider](http://localhost:3000/rider)
- **Liquidaciones Diarias:** [http://localhost:3000/settlements](http://localhost:3000/settlements)
