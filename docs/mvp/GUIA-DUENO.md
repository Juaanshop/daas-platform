# Guía del dueño (sin programar)

Esta guía es para quien **dirige el producto** e interactúa con el agente de Cursor. No necesitas saber código. Necesitas saber: qué se debía lograr, cómo probarlo, y si pasamos de fase o iteramos.

## Quick path

1. Lee la **visión** en [00-vision.md](./00-vision.md).
2. Abre la fase actual en [03-phases.md](./03-phases.md).
3. Pídele al agente solo esa fase (prompt abajo).
4. Cuando diga “listo”, ejecuta la **checklist de prueba** de esa fase.
5. Según el resultado: **pasar** / **iterar** / **bloquear**.

---

## Glosario (palabras que vas a usar)

| Palabra | Significado simple |
|---------|-------------------|
| **Delivery / motorizado** | La persona que reparte; dueño de la cuenta y del panel. |
| **Comercio afiliado** | Local que trabaja con ese delivery (ej. una panadería). |
| **Link del comercio** | URL única; el comercio la abre para pedir un envío. No necesita usuario. |
| **Pedido / solicitud** | Un envío concreto: qué llevan, a quién, de dónde a dónde, tarifa. |
| **Cotización / tarifa** | Precio calculado por distancia y reglas de zona. |
| **Pegar ubicación** | Copiar el link de ubicación de WhatsApp o Maps y pegarlo en el formulario. |
| **Confirmado / va a buscar** | El delivery aceptó el pedido y se dirige al comercio. |
| **En camino** | Ya retiró el paquete; va al destinatario (se abre WhatsApp al que recibe). |
| **Entregado** | Llegó; la carrera cuenta como dinero ganado. |
| **Ganado del mes** | Suma de lo que le corresponde al delivery en pedidos entregados del mes. |
| **Fase** | Un pedazo del producto. No mezcles dos fases a la vez. |

---

## Recorrido feliz del producto (cuando todo esté listo)

1. Delivery inicia sesión en su panel.
2. Crea un comercio y **copia el link**.
3. Se lo manda al encargado del local (WhatsApp, etc.).
4. El comercio abre el link, llena datos, pone origen y destino (mapa o pegar link), ve la tarifa.
5. Toca enviar → el sistema **guarda** el pedido y ofrece abrir WhatsApp al delivery con el resumen.
6. Aunque no abran WhatsApp, el delivery **ya ve** el pedido en el panel.
7. Delivery **confirma** → estado “va a buscar”.
8. En el comercio, delivery marca **en camino** → se abre WhatsApp al **destinatario** con mensaje tipo “soy Juan, voy en camino…”.
9. Al entregar, marca **entregado** → suma a su ganado.
10. (F7) Revisa métricas del mes.

Historia detallada: [02-flows.md](./02-flows.md).

---

## Cómo decidir: pasar / iterar / bloquear

| Decisión | Cuándo |
|----------|--------|
| **Pasar a la siguiente fase** | Toda la checklist de **Señal de OK** de la fase actual está en verde. |
| **Seguir iterando** | Algo de la checklist falla, pero el problema es claro (texto, botón, tarifa, link). Pídele al agente que corrija **esa** fase. |
| **Bloquear** | Falta algo de seguridad o de regla de negocio grave (ej. se pueden ver pedidos de otro delivery; se aceptan pedidos fuera de zona; se pierde dinero al entregar). No avances de fase. |

**Nunca** pidas “implementa F3 y F5 juntos”. Una fase a la vez.

---

## Qué pedirle al agente

### Empezar una fase

```text
Implementa la Fase F1 según docs/mvp/03-phases.md.
Solo esa fase. Al terminar, resume qué construiste y cómo debo probarlo con la checklist del dueño.
```

### Iterar porque falló la prueba

```text
Fase F3. Al probar falló: [escribe exactamente lo que hiciste y qué viste].
Corrige según docs/mvp/03-phases.md hasta que pase la Señal de OK. No avances a otra fase.
```

### Confirmar si ya pueden pasar

```text
Según docs/mvp/03-phases.md Fase F4, dime si con lo que hay ahora debería pasar la checklist del dueño.
Lista lo que aún falta en lenguaje simple.
```

### Recordar el producto

```text
Lee docs/mvp/README.md y docs/mvp/00-vision.md.
Estamos en Fase Fx. No cambies decisiones cerradas del README.
```

---

## Checklist rápida por fase (vista dueño)

Usa la versión completa en [03-phases.md](./03-phases.md). Esta tabla es el mapa mental:

| Fase | Objetivo en una frase | Prueba mínima |
|------|----------------------|---------------|
| F0 | Entendimos qué vamos a armar | Leíste visión + esta guía + fases |
| G0 | Mapa del código viejo: valor vs ruido | Agente resume GRAPH_REPORT; acordamos qué reusar |
| F1 | Delivery entra a su panel | Login con usuario/clave; ves el panel |
| F2 | Comercios + link | Creas comercio; copias link; el link abre algo del comercio |
| F3 | Cotizar desde el link | Llenas destino (mapa o pegar ubicación); ves tarifa |
| F4 | Guardar + WhatsApp al delivery | Envías; aparece en panel; botón abre chat al delivery |
| F5 | Ciclo completo | Confirmas → en camino (WA destinatario) → entregado (suma plata) |
| G1 | Limpiar árbol sin romper el ciclo | App ya no empuja portales viejos; F5 sigue OK |
| F6 | Foto opcional | Subes foto; se ve en el pedido |
| F7 | Métricas del mes | Ves ganado, km, carreras, carreras por día |

---

## WhatsApp: qué esperar (sin magia)

En este MVP **no** se envían mensajes solos desde un servidor. Al tocar un botón, el celular/computadora **abre WhatsApp** con el texto ya escrito. La persona debe tocar enviar.

Por eso es normal:

- El pedido ya está guardado **antes** de abrir WhatsApp.
- Si cierran WhatsApp sin enviar, el delivery **igual** debe ver el pedido en el panel.

Textos exactos: [04-data-whatsapp-copy.md](./04-data-whatsapp-copy.md).

---

## Siguiente paso

Abre [03-phases.md](./03-phases.md): confirma **F0**, pide al agente el resumen **G0** (Graphify valor vs ruido), luego **F1**.
