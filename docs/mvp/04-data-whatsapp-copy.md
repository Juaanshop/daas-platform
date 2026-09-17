# WhatsApp y ubicación — textos y reglas

Capa simple arriba; plantillas listas para construir abajo.

## Cómo funciona WhatsApp en este MVP (dueño)

1. El sistema **no** manda el mensaje solo.
2. Un botón **abre WhatsApp** con el texto ya escrito (`wa.me`).
3. La persona toca **Enviar** en WhatsApp.
4. Por eso el pedido se **guarda antes** de abrir el chat.

## Dos momentos de WhatsApp

| Momento | ¿A quién? | ¿Quién toca Enviar? | ¿Cuándo? |
|---------|-----------|---------------------|----------|
| Nueva solicitud | Teléfono del **delivery** | Comercio (o quien llenó el form) | Al enviar el formulario (F4) |
| En camino | Teléfono del **destinatario** | **Delivery** | Al marcar “Ya retiré / En camino” (F5) |

Confirmación del delivery en el panel: **sin** WhatsApp al comercio en F5.

---

## Pegar ubicación (dueño)

Cuando el cliente del comercio manda por WhatsApp un pin/ubicación:

1. En WhatsApp: tocar la ubicación → compartir / copiar enlace (o copiar el mensaje que trae el link de Maps).
2. En el form del link del comercio: pegar en el campo “Pegar link de ubicación”.
3. La app debe mostrar el punto en el mapa o las coordenadas y cotizar.

Si no reconoce el link: borrar y usar búsqueda en mapa, o pedir otro link.

Formatos que deben intentarse (construcción): los ya cubiertos en `src/lib/maps.ts` (`@lat,lng`, `q=`, `!3d!4d`, coords crudas) más links típicos de `maps.app.goo.gl` / redirecciones cuando el backend pueda resolverlos.

---

## Plantilla 1 — Nueva solicitud al delivery (F4)

**Canal:** `https://wa.me/{telefonoDeliverySoloDigitos}?text={mensajeCodificado}`

**Texto sugerido:**

```text
Nueva solicitud de envío — {orderNumber}

Comercio: {businessName}
Paquete: {packageDescription} ({packageSizeLabel})
Quien recibe: {recipientName} — {recipientPhone}

Retiro: {pickupAddress}
Entrega: {dropoffAddress}

Distancia: {distanceKm} km
Tarifa: ${totalCost}
Tu ganancia estimada: ${riderEarnings}

Abre tu panel para confirmar:
{appOrderUrl}
```

Notas:
- `{appOrderUrl}` = link al detalle en el panel del delivery (ruta autenticada; si no está logueado, tras login redirigir al pedido).
- Incluir mapa de entrega si aporta: URL de Google Maps search/nav.

---

## Plantilla 2 — En camino al destinatario (F5)

**Canal:** `https://wa.me/{telefonoDestinatarioSoloDigitos}?text={mensajeCodificado}`

**Texto sugerido (voz del delivery):**

```text
Hola, soy {deliveryName}. Ya retiré tu pedido en {businessName} y voy en camino a entregártelo.

Llego en aproximadamente {estimatedMinutes} min. Si necesitas indicar algo de la entrega, responde este mensaje.

Destino: {dropoffAddress}
```

Variante corta (si el mensaje se corta en algunos clientes):

```text
Hola, soy {deliveryName} de {businessName}. Ya voy en camino con tu pedido (~{estimatedMinutes} min).
Destino: {dropoffAddress}
```

No usar tono de “plataforma anónima”. Debe sentirse persona + local.

---

## Plantillas que NO van en F5

- WhatsApp automático al comercio al confirmar.
- WhatsApp al destinatario al crear el pedido.
- Mensajes de “pedido entregado” (opcional post-MVP).

---

## Reglas técnicas

- Limpiar teléfono a dígitos (`WhatsAppService.cleanPhoneNumber` existente).
- Codificar `text` con `encodeURIComponent`.
- Abrir en nueva pestaña / deep link móvil; no bloquear la transición de estado si el usuario cancela el popup (el estado ya cambió en servidor).
- Orden de operaciones F4: **1)** persistir pedido **2)** devolver `whatsappUrl` al cliente **3)** cliente abre URL.
- Orden F5 a `IN_TRANSIT`: **1)** validar transición y guardar **2)** devolver `whatsappUrl` destinatario **3)** cliente abre.

## Reuso en el repo

- `src/services/whatsapp.ts` — hoy orientado a “despacho asignado”; adaptar o añadir métodos:
  - `generateNewRequestToDelivery(...)`
  - `generateInTransitToRecipient(...)`
- `src/lib/maps.ts` — parse + URLs de mapa/navegación.

---

## Checklist de prueba de copy (dueño)

- [ ] Mensaje al delivery menciona comercio, tarifa y número de pedido.
- [ ] Mensaje al destinatario usa el **nombre del delivery** y no suena a robot de marca desconocida.
- [ ] Números abren el chat correcto (prueba con dos teléfonos distintos de prueba).
