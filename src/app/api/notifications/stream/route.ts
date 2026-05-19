import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { runtime } from "@/lib/effect-runtime";
import { NotificationEngine } from "@/lib/notifications";
import { Effect, Queue } from "effect";

export const dynamic = "force-dynamic";

export async function GET() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Ping immediately so the browser keeps the connection open
      send({ type: "connected", userId });

      try {
        await runtime.runPromise(
          Effect.gen(function* (_) {
            const engine = yield* _(NotificationEngine);
            const queue = yield* _(engine.subscribe());

            // Drain queue in a loop — each take blocks until an event arrives
            while (true) {
              const event = yield* _(Queue.take(queue));
              if (event.userId === userId) {
                send(event);
              }
            }
          })
        );
      } catch {
        controller.close();
      }
    },
    cancel() {
      // Fiber cleanup handled by ManagedRuntime on GC
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
