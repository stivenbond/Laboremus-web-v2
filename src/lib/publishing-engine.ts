import { Effect, Schedule, Layer } from "effect";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";

export class PublishingEngine extends Effect.Service<PublishingEngine>()("PublishingEngine", {
  effect: Effect.gen(function* (_) {
    const publishDue = Effect.gen(function* (_) {
      const now = new Date();
      // Find all docs scheduled for a time in the past that haven't published yet
      const due = yield* _(Effect.promise(() =>
        db.select().from(documents).where(
          and(
            eq(documents.status, "scheduled"),
            lte(documents.scheduledPublishAt, now)
          )
        )
      ));

      for (const doc of due) {
        yield* _(Effect.promise(() =>
          db.update(documents).set({
            status: "published",
            publishedAt: now,
            updatedAt: now,
          }).where(eq(documents.id, doc.id))
        ));
        yield* _(Effect.log(`[PublishingEngine] Auto-published: ${doc.title} (${doc.id})`));
      }

      return due.length;
    }).pipe(
      Effect.withSpan("publishing.auto_publish")
    );

    // Expose a runOnce and a daemon that polls every 60 seconds
    return {
      runOnce: publishDue,
      startDaemon: Effect.repeat(
        publishDue,
        Schedule.fixed("60 seconds")
      ),
    };
  }),
}) {}
