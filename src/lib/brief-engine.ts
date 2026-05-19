import { Effect, Context, Layer } from "effect";
import { CurrentUser, requireRole } from "./auth-context";
import { DocumentEngine } from "./document-engine";
import { NotificationEngine } from "./notifications";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

// Schema for a brief assignment
export interface BriefAssignment {
  title: string;
  instructions: string;
  writerId: string;
  editorId: string;
}

export class BriefEngine extends Context.Tag("BriefEngine")<
  BriefEngine,
  {
    createBriefs: (assignments: BriefAssignment[]) => Effect.Effect<any, Error, CurrentUser | DocumentEngine | NotificationEngine>;
    approveBrief: (briefId: string) => Effect.Effect<any, Error, CurrentUser | DocumentEngine | NotificationEngine>;
  }
>() {}

export const BriefEngineLive = Layer.succeed(
  BriefEngine,
  BriefEngine.of({
    createBriefs: (assignments) => Effect.gen(function* (_) {
      // Must be EIC
      yield* _(requireRole(["editor-in-chief"]));
      const notifications = yield* _(NotificationEngine);
      
      const createdBriefs = [];
      for (const assignment of assignments) {
         const docId = crypto.randomUUID();
         
         // Persist brief to DB as a document in 'draft' status
         yield* _(Effect.promise(() =>
           db.insert(documents).values({
             id: docId,
             title: assignment.title,
             status: "draft",
             assignedWriterId: assignment.writerId,
             assignedEditorId: assignment.editorId,
           })
         ));

         createdBriefs.push({ id: docId, title: assignment.title });
         
         // Publish assignment notification to the writer
         yield* _(notifications.publish({
           type: "ASSIGNMENT",
           userId: assignment.writerId,
           message: `You have been assigned the brief: "${assignment.title}". Pending Overseer approval.`,
           timestamp: new Date()
         }));
      }
      
      return { success: true, createdBriefs };
    }),

    approveBrief: (briefId) => Effect.gen(function* (_) {
      yield* _(requireRole(["overseer"]));
      const notifications = yield* _(NotificationEngine);
      
      // Get the brief document from the DB
      const docs = yield* _(Effect.promise(() =>
        db.select().from(documents).where(eq(documents.id, briefId))
      ));
      const doc = docs[0];
      if (!doc) {
        return yield* _(Effect.fail(new Error(`Brief with ID ${briefId} not found`)));
      }

      // Transition document status so the writer can start writing
      yield* _(Effect.promise(() =>
        db.update(documents).set({
          status: "draft",
          updatedAt: new Date(),
        }).where(eq(documents.id, briefId))
      ));

      // Publish approval notification
      yield* _(notifications.publish({
        type: "APPROVAL",
        userId: doc.assignedWriterId || "test-writer-id",
        message: `Brief "${doc.title}" has been approved by the Overseer. You can now begin drafting!`,
        timestamp: new Date()
      }));
      
      return { success: true };
    })
  })
);
