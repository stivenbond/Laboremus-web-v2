import { Effect, Context, Layer, Queue, PubSub } from "effect";

export interface NotificationEvent {
  type: "ASSIGNMENT" | "APPROVAL" | "REJECTION" | "SYSTEM";
  userId: string;
  message: string;
  timestamp: Date;
}

export class NotificationEngine extends Context.Tag("NotificationEngine")<
  NotificationEngine,
  {
    publish: (event: NotificationEvent) => Effect.Effect<void>;
    subscribe: () => Effect.Effect<Queue.Dequeue<NotificationEvent>>;
  }
>() {}

export const NotificationEngineLive = Layer.scoped(
  NotificationEngine,
  Effect.gen(function* (_) {
    // Create an unbounded PubSub to distribute notifications to any active listeners
    const hub = yield* _(PubSub.unbounded<NotificationEvent>());

    return NotificationEngine.of({
      publish: (event) => PubSub.publish(hub, event),
      subscribe: () => Effect.scoped(PubSub.subscribe(hub))
    });
  })
);
