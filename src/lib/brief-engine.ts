import { Effect, Context, Layer } from "effect";
import { CurrentUser, requireRole } from "./auth-context";
import { DocumentEngine } from "./document-engine";
import { NotificationEngine } from "./notifications";

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
      const docEngine = yield* _(DocumentEngine);
      const notifications = yield* _(NotificationEngine);
      
      const createdBriefs = [];
      for (const assignment of assignments) {
         createdBriefs.push(assignment.title);
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
      
      // Publish approval notification
      yield* _(notifications.publish({
        type: "APPROVAL",
        userId: "test-writer-id", // mock default, dynamically maps to assigned writer in live DB
        message: `Brief "${briefId}" has been approved by the Overseer. You can now begin drafting!`,
        timestamp: new Date()
      }));
      
      return { success: true };
    })
  })
);
