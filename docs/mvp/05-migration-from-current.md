# Migración desde el MVP actual

Capa técnica: qué reusar del `daas-platform` actual y qué dejar de lado al pivotar a delivery-centric.

## Cambio de producto (resumen)

| Antes | Ahora (MVP delivery-centric) |
|-------|------------------------------|
| Hub multi-rol (admin / merchant / rider) | Actor principal: **delivery autenticado** |
| Admin asigna flota | Delivery gestiona **sus** comercios |
| Merchant logueado / portal propio | Comercio **solo** por link token |
| Órdenes PENDING→ASSIGNED→… | DRAFT_SUBMITTED→CONFIRMED_PICKUP→IN_TRANSIT→DELIVERED |
| Liquidaciones B2B diarias multi-actor | Ganancia del delivery + métricas mes (F7) |

## Reusar (alto valor)

| Pieza | Ruta | Uso nuevo |
|-------|------|-----------|
| Pricing + Haversine / ruta | `src/services/pricing.ts` | Cotización en form público |
| Geofence Carabobo | `src/services/geofence.ts` | Validar comercio, origen, destino |
| Distancia / providers | `src/services/distance.ts` | Quote |
| Parse Maps / URLs | `src/lib/maps.ts` | Pegar ubicación WhatsApp/Maps |
| Resolve maps API | `src/app/api/maps/resolve/route.ts` | Backend parse/enrich |
| Quote API | `src/app/api/quote/route.ts` | Adaptar a token de comercio si aplica |
| WhatsApp wa.me | `src/services/whatsapp.ts` | Nuevos templates (ver 04) |
| Event hub SSE | `src/lib/events.ts` | Opcional: refrescar panel delivery |
| UI base | `src/components/ui/*` | Botones, inputs, cards |
| Prisma + SQLite | `prisma/schema.prisma` | Evolucionar modelos (migración de campos) |
| Tests pricing/geofence/maps | `tests/*` | Mantener; añadir casos token/estados nuevos |

## Deprecar o dejar de priorizar (UI legacy)

No borrar a ciegas el día 1; dejar de construir features encima:

| Superficie | Ruta | Motivo |
|------------|------|--------|
| Hub simulador multi-rol | `src/app/page.tsx` | Reemplazar por login/landing delivery |
| Portal merchant logueado | `src/app/merchant/*` | Sustituido por `/m/[token]` |
| Backoffice admin flota | `src/app/admin/*` | Fuera de alcance MVP |
| PWA rider genérica multi-comercio global | `src/app/rider/*` | Sustituida por panel delivery dueño |
| Settlements B2B diarios UI | `src/app/settlements/*` | Sustituir por métricas F7 / earnings |

APIs legacy (`/api/orders` sin ownership por delivery token, CRUD admin merchants/riders globales) se adaptan o se versionan detrás del nuevo auth.

## Mapa Prisma actual → objetivo

| Modelo actual | Acción |
|---------------|--------|
| `User` (ADMIN/MERCHANT/RIDER) | Especializar o añadir `DeliveryUser` / role `DELIVERY` con password |
| `Merchant` | Añadir `deliveryUserId` (dueño), `publicToken`, soft `isActive` |
| `Rider` | En MVP delivery-centric el “rider” **es** el delivery user; fusionar conceptos o 1:1 User↔perfil delivery |
| `Order` | Nuevos campos paquete/tamaño/foto; estados nuevos; `deliveryUserId` denormalizado |
| `DailySettlement` | Pausar uso; earnings por order + agregados mes |

Seed nuevo: 1 delivery, 2 merchants con tokens, 0–1 order demo.

## Estrategia de implementación recomendada

1. **No** reescribir todo el repo.
2. Añadir rutas nuevas (`/login`, `/app/*`, `/m/[token]`) en paralelo.
3. Cambiar schema de forma incremental (`db push` en dev).
4. Apuntar el home a login delivery cuando F1 esté OK.
5. Marcar portales viejos como “legacy” en README raíz cuando F5 esté demoable.

## Riesgos

- Mezclar estados viejos (`PENDING`, `ASSIGNED`) con nuevos → migrar tests `order-flow` a la máquina nueva.
- Geofence + Places keys: `.env.example` ya documenta Google keys; el form público las necesita.
- Seguridad del token: no listar todos los tokens; rate-limit create order en público (mínimo razonable).

## Graphify (valor vs ruido)

- **G0 (ahora):** baseline en `graphify-out/` — ver [06-graphify.md](./06-graphify.md).
- **G1 (post-F5):** rebuild + limpieza del árbol antes de F6/F7.

No borrar `PricingService` / `GeofenceService` / maps / whatsapp en limpiezas agresivas.

## Checklist construcción

- [ ] Leer [01-domain-model.md](./01-domain-model.md) antes de tocar schema.
- [ ] Reusar pricing/geofence/maps/whatsapp; no duplicar.
- [ ] Nuevas pantallas por fases [03-phases.md](./03-phases.md).
- [ ] G0 antes de F1; G1 después de F5 ([06-graphify.md](./06-graphify.md)).
- [ ] No invertir tiempo en pulir `/admin` salvo que bloquee demos.
