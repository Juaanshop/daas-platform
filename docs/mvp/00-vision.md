# Visión del producto — MVP Delivery-Centric

El dueño del producto es el **motorizado (delivery)**. Él afilia comercios, les da un link, recibe pedidos, confirma, retira, entrega y ve cuánto ganó.

## Problema que resolvemos

Hoy el delivery pierde tiempo coordinando por chat suelto: direcciones incompletas, tarifas a ojo, y sin historial claro de carreras. El comercio necesita pedir un envío **rápido**, sin crear cuenta.

## Solución en una frase

Cada comercio afiliado tiene un **link**. Con ese link carga el pedido (qué es, tamaño, quién recibe, de dónde a dónde), ve la **tarifa**, avisa al delivery por WhatsApp, y el delivery **confirma y gestiona** todo desde su panel.

## Quién hace qué

| Rol | ¿Entra con usuario? | Qué hace |
|-----|---------------------|----------|
| **Delivery** | Sí (panel propio) | Alta de comercios, links, confirma pedidos, cambia estados, ve ganancias |
| **Comercio** | No | Abre su link, llena el pedido, envía (WhatsApp al delivery) |
| **Destinatario** | No | Solo recibe WhatsApp cuando el delivery ya va en camino |

## Zona de cobertura (MVP)

Valencia, Naguanagua y San Diego (Carabobo, Venezuela). Pedidos fuera de zona no se aceptan.

## Lo que SÍ entra en este MVP

- Un delivery con varios comercios afiliados.
- Link por comercio (sin login del comercio).
- Formulario de solicitud + cotización.
- Destino por mapa **o** pegando un link de ubicación (WhatsApp / Maps).
- Guardar pedido en el sistema aunque no se abra WhatsApp.
- WhatsApp prearmado (`wa.me`) al delivery y luego al destinatario.
- Ciclo: solicitado → confirmado (va a buscar) → en camino → entregado → dinero del mes.
- Más adelante: foto opcional y métricas del mes.

## Lo que NO entra aún (anti-objetivos)

- Login de comercios.
- Relación muchos deliveries ↔ muchos comercios (M:N).
- WhatsApp Business API / mensajes automáticos sin abrir el chat.
- App nativa de celular (usamos web / PWA en el navegador).
- Torre de control tipo marketplace multi-flota (el MVP anterior de admin global se deja de lado).
- Pagos en línea / pasarela.

## Éxito del MVP

Un delivery real puede, en un día de prueba:

1. Entrar a su panel.
2. Crear 2 comercios y mandarles el link.
3. Recibir un pedido desde el link (aparece en el panel aunque no abran WhatsApp).
4. Confirmar, marcar en camino (WhatsApp al que recibe), marcar entregado.
5. Ver que esa carrera suma a su ganado del mes (cuando exista F7; en F5 al menos se acredita el monto).

## Siguiente lectura

- Dueño: [GUIA-DUENO.md](./GUIA-DUENO.md)
- Construcción: [01-domain-model.md](./01-domain-model.md)
