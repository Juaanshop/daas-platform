# MVP Delivery-Centric — Documentación

Esta carpeta define el **nuevo MVP**: un motorizado (delivery) afilia varios comercios, cada comercio pide servicio con un link, y el ciclo se cierra con WhatsApp + panel del delivery.

Hay **dos capas**. Usa la que te corresponde.

---

## Empieza aquí si no programas (dueño del producto)

1. Lee [GUIA-DUENO.md](./GUIA-DUENO.md) — cómo verificar, cuándo pasar de fase, qué pedirle al agente.
2. Lee [00-vision.md](./00-vision.md) — qué problema resolvemos y qué **no** hacemos aún.
3. Trabaja fase por fase con [03-phases.md](./03-phases.md) — cada fase tiene objetivo de negocio + checklist de prueba.
4. Si necesitas el recorrido completo del pedido: [02-flows.md](./02-flows.md).
5. Textos de WhatsApp y pegar ubicación: [04-data-whatsapp-copy.md](./04-data-whatsapp-copy.md).
6. Gates de código (opcional leer): [06-graphify.md](./06-graphify.md) — G0 ahora, G1 después del ciclo de pedido.

**Regla de oro:** no pases a la siguiente fase hasta marcar **Señal de OK** de la actual.

---

## Empieza aquí si construyes (agente / desarrollo)

1. [00-vision.md](./00-vision.md) — alcance y anti-objetivos.
2. [01-domain-model.md](./01-domain-model.md) — entidades, estados, campos.
3. [02-flows.md](./02-flows.md) — flujos + secuencia WhatsApp.
4. [03-phases.md](./03-phases.md) — implementación por fases (bloque “Para quien construye”).
5. [04-data-whatsapp-copy.md](./04-data-whatsapp-copy.md) — templates `wa.me` + parse de ubicación.
6. [05-migration-from-current.md](./05-migration-from-current.md) — qué reusar / deprecar del MVP anterior.
7. [06-graphify.md](./06-graphify.md) — gates G0/G1 (mapa del código, valor vs ruido).

Stack base del repo: Next.js 16, Prisma, Zod, pricing, geofence, maps, WhatsApp vía `wa.me`.

---

## Mapa de fases (resumen)

| Fase | En una frase |
|------|----------------|
| **F0** | Spec lista y entendida (esta documentación). |
| **G0** | Graphify baseline: qué del repo viejo es valioso vs ruido. |
| **F1** | El delivery entra a su panel con usuario y clave. |
| **F2** | Carga comercios y copia un link para cada uno. |
| **F3** | Desde el link, el comercio cotiza (mapa o pegar ubicación). |
| **F4** | Al enviar, queda guardado; el botón abre WhatsApp al delivery. |
| **F5** | Confirmar → retirar (WA al que recibe) → entregar → suma ganancia. |
| **G1** | Segunda pasada Graphify: limpiar árbol (valor vs ruido) sin romper F5. |
| **F6** | Foto opcional del paquete. |
| **F7** | Métricas del mes: ganado, km, carreras, por día. |

Detalle y pruebas: [03-phases.md](./03-phases.md).

---

## Cómo pedirle trabajo al agente

Copia y pega (cambia la fase):

```text
Implementa la Fase F2 según docs/mvp/03-phases.md.
Solo esa fase. Cuando termines, dime cómo probarlo con la checklist del dueño.
```

Si algo falla en la prueba:

```text
Estamos en Fase F4. Falló esto: [describe lo que viste].
Itera según docs/mvp/03-phases.md (Señal de seguir iterando) hasta que pase la checklist.
```

---

## Decisiones cerradas (no reabrir en chat)

- 1 delivery → muchos comercios (M:N después).
- Comercios **sin login**; solo link con token.
- Delivery **con login** y panel.
- WhatsApp = abrir chat prearmado (`wa.me`), no API Business.
- Al retirar / en camino: WhatsApp al **destinatario**, en nombre del delivery.
- Pedidos guardados en base aunque el comercio no abra WhatsApp.
