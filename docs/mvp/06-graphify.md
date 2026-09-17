# Graphify — gates G0 y G1

Herramienta para **mapear el código** (grafo de módulos). No es una pantalla del producto. Ayuda a decidir qué reusar y qué es ruido.

## Para el dueño (sin programar)

| Gate | Cuándo | Pregunta que debes poder responder |
|------|--------|-------------------------------------|
| **G0** | Ahora, antes de F1 | ¿Qué piezas viejas nos sirven y cuáles ignoramos? |
| **G1** | Después de F5 | ¿El repo ya se siente del producto nuevo o sigue lleno de portales muertos? |

No “pruebas” Graphify como un botón de WhatsApp. Pruebas pidiéndole al agente un **resumen en bullets** y mirando que la app no te empuje a pantallas viejas (sobre todo en G1).

Prompt útil:

```text
Según docs/mvp/06-graphify.md y GRAPH_REPORT.md,
lista VALIOSO vs RUIDO en lenguaje simple.
```

## Estado actual (G0 — hecho en repo)

- Paquete: `graphifyy` (CLI `graphify`) vía `uv tool`.
- Regla Cursor: `.cursor/rules/graphify.mdc`.
- Salida: `graphify-out/graph.json`, `GRAPH_REPORT.md`, `graph.html`.
- Baseline código: ~339 nodos / ~727 edges (AST). Docs/imágenes sin semántica Gemini aún (opcional).

### Primera lectura valor vs ruido (baseline)

**Valioso (reusar):**
- `PricingService`, `GeofenceService`, `distance`
- `parseGoogleMapsInput` / maps helpers
- `WhatsAppService` (adaptar templates)
- UI base (`components/ui`), validators Zod (adaptar estados)
- Tests de pricing/geofence/maps

**Ruido / no priorizar en F1–F5:**
- Portales `/admin`, `/merchant` (login), `/rider`, `/settlements` B2B como camino principal
- Flujo de asignación admin → rider genérico
- Liquidaciones multi-actor diarias legacy

Detalle: [05-migration-from-current.md](./05-migration-from-current.md). Checklist gates: [03-phases.md](./03-phases.md) (G0, G1).

## Para quien construye

### Instalar / actualizar

```bash
uv tool install --upgrade graphifyy
graphify install --platform cursor
```

### Rebuild rápido (código)

1. Detect + AST extract → `.graphify_ast.json`
2. Semantic vacío OK si no hay Gemini / no hace falta docs
3. Merge → `.graphify_extract.json`
4. `build_from_json` + cluster → `graph.json` + `GRAPH_REPORT.md` + `graph.html`

Consultas después:

```bash
graphify query "What depends on PricingService?"
graphify explain "GeofenceService"
```

### G1 checklist técnica

- [ ] Rebuild post-F5
- [ ] Diff god nodes vs G0
- [ ] PR limpieza: deprecar UI legacy, no borrar pricing
- [ ] Re-correr checklist F5
- [ ] Actualizar migration doc con veredicto

## Tip

Sin `GEMINI_API_KEY`, el grafo de **código** igual sirve. La clave solo mejora extracción semántica de markdown/imágenes.
