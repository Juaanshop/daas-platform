import { NextRequest } from "next/server";
import { eventHub, DaasEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Mensaje de bienvenida
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`)
      );

      // Handler para reenviar eventos a este cliente
      const onEvent = (event: DaasEvent) => {
        try {
          const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Cliente desconectado
          cleanup();
        }
      };

      eventHub.on("daas_event", onEvent);

      // Heartbeat cada 20 segundos
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, 20000);

      const cleanup = () => {
        clearInterval(heartbeatInterval);
        eventHub.off("daas_event", onEvent);
      };

      req.signal.addEventListener("abort", () => {
        cleanup();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
