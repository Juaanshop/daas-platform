# Modelo de dominio

Primero el lenguaje simple; después el detalle para construcción.

## Glosario → conceptos del sistema

| En el negocio | En el sistema (aprox.) |
|---------------|-------------------------|
| Cuenta del delivery | `DeliveryUser` (login) |
| Comercio afiliado | `Merchant` ligado a un delivery |
| Link del comercio | `MerchantInviteToken` / slug público |
| Pedido / solicitud | `Order` (o `ServiceRequest`) |
| Foto del paquete | campo opcional / archivo en storage |
| Dinero de una carrera | fee del delivery sobre `totalCost` |
| Ganado del mes | agregación de pedidos `DELIVERED` del mes |

## Relación (MVP)

```
DeliveryUser 1 ──< Merchant (varios)
Merchant     1 ──< Order (varios)
DeliveryUser 1 ──< Order (varios, vía sus comercios)
```

Un comercio pertenece a **un** delivery. Más adelante se podrá abrir a muchos-a-muchos.

## Estados del pedido

| Estado técnico | Qué ve el dueño | Qué implica |
|----------------|-----------------|-------------|
| `DRAFT_SUBMITTED` | Solicitado / pendiente de confirmar | Comercio envió el form. Guardado. WhatsApp al delivery puede o no haberse abierto. |
| `CONFIRMED_PICKUP` | Confirmado — va a buscar | Delivery aceptó. Va al comercio. **Sin** WhatsApp al remitente en F5. |
| `IN_TRANSIT` | En camino | Retiró el paquete. Se abre WhatsApp al **destinatario**. |
| `DELIVERED` | Entregado | Carrera cerrada. Acredita ganado. |
| `CANCELLED` | Cancelado | No suma ganado. |

### Transiciones permitidas

```
DRAFT_SUBMITTED → CONFIRMED_PICKUP | CANCELLED
CONFIRMED_PICKUP → IN_TRANSIT | CANCELLED
IN_TRANSIT → DELIVERED | CANCELLED
DELIVERED → (fin)
CANCELLED → (fin)
```

## Campos del formulario del comercio (solicitud)

| Campo | Obligatorio | Notas |
|-------|-------------|--------|
| Qué es (descripción del paquete) | Sí | Texto corto |
| Tamaño | Sí | Enum sugerido: `SMALL` / `MEDIUM` / `LARGE` (etiquetas en UI: Pequeño / Mediano / Grande) |
| Nombre destinatario | Sí | |
| Teléfono destinatario | Sí | Para WhatsApp en camino |
| Foto | No | Fase F6 |
| Dirección origen | Sí | Por defecto: dirección del comercio; editable |
| Lat/Lng origen | Sí | Del comercio o ajustado |
| Dirección destino | Sí | |
| Lat/Lng destino | Sí | Desde mapa Places o parse de link pegado |
| Link Maps / WhatsApp pegado | No | Si viene, se parsea a lat/lng |
| Tarifa / distancia / minutos | Sí (calculados) | No inventados a mano en el submit |

Teléfono del comercio afiliado se usa como contacto de retiro; no hace falta login.

## Entidades propuestas (capa construcción)

### DeliveryUser
- `id`, `name`, `email` (único), `passwordHash`, `phone` (WhatsApp del delivery)
- Relación: `merchants[]`, sesión/auth estándar

### Merchant
- `id`, `deliveryUserId`, `businessName`, `address`, `latitude`, `longitude`, `phone`
- `isActive`, `publicToken` (o tabla de tokens), `createdAt`

### Merchant public access
- Token opaco en URL: `/m/{token}`
- Sin expiración agresiva en MVP (se puede rotar desde el panel)
- Solo permite crear solicitudes para **ese** comercio

### Order
- Identificadores: `id`, `orderNumber`, `merchantId`, `deliveryUserId`
- Paquete: `packageDescription`, `packageSize`, `packagePhotoUrl?`
- Destinatario: `recipientName`, `recipientPhone`
- Origen: `pickupAddress`, `pickupLat`, `pickupLng`
- Destino: `dropoffAddress`, `dropoffLat`, `dropoffLng`, `dropoffMapUrl?`
- Pricing: `baseFee`, `distanceKm`, `totalCost`, `estimatedMinutes`, `riderEarnings` (o calcular 80% al entregar)
- `status`, timestamps: `createdAt`, `confirmedAt?`, `pickedUpAt?`, `deliveredAt?`

### Earnings (puede ser campo derivado, no tabla)
- En F5: al pasar a `DELIVERED`, persistir `riderEarnings` y/o sumar balance del delivery
- En F7: consultas agregadas por mes

## Reglas de negocio clave

1. Un `Order` siempre pertenece al delivery dueño del `Merchant`.
2. El token del link no debe permitir ver ni crear pedidos de otro comercio.
3. Geofence: origen y destino dentro de Valencia / Naguanagua / San Diego.
4. Pricing: reutilizar motor actual (base local/intermunicipal + extra km); ver servicio existente.
5. `DRAFT_SUBMITTED` se crea **antes** o al mismo tiempo que se ofrece el `wa.me`; nunca depender de que WhatsApp se haya enviado.
6. WhatsApp al destinatario solo al pasar a `IN_TRANSIT`.

## Auth

- Delivery: sesión con email + password (o mecanismo equivalente del stack Next).
- Rutas de panel y APIs de gestión: autenticadas.
- Ruta pública `/m/{token}` + API de create order por token: sin sesión; autorizadas por token.

## Siguiente lectura

- Flujos: [02-flows.md](./02-flows.md)
- Fases: [03-phases.md](./03-phases.md)
