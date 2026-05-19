import { Effect, Layer } from "effect";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { NotificationEngine, NotificationEvent } from "./notifications";
import { eq } from "drizzle-orm";

// Persists notification events to the database for SSE hydration
export const NotificationDbWriterLive = Layer.effect(
  NotificationEngine,
  Effect.gen(function* (_) {
    // Build the base in-memory engine from the original live layer
    const baseEngine = yield* _(NotificationEngine);

    return NotificationEngine.of({
      publish: (event: NotificationEvent) =>
        Effect.gen(function* (_) {
          // Publish to in-memory PubSub
          yield* _(baseEngine.publish(event));
          // Also persist to DB
          yield* _(
            Effect.promise(() =>
              db.insert(notifications).values({
                id: crypto.randomUUID(),
                userId: event.userId,
                type: event.type as any,
                message: event.message,
                createdAt: event.timestamp,
                read: false,
              })
            )
          );
        }),
      subscribe: () => baseEngine.subscribe(),
    });
  })
);

// Fetch unread notifications for a user
export async function getUnreadNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(notifications.createdAt);
}

// Mark a notification as read
export async function markNotificationRead(notificationId: string) {
  return db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));
}
