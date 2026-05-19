import { Effect, Context, Layer } from "effect";
import { db } from "@/db";
import { documents, documentDrafts, documentVersions, documentComments, documentStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CurrentUser, requireRole } from "./auth-context";
import { NotificationEngine } from "./notifications";

// Defines the core operations for documents
export class DocumentEngine extends Context.Tag("DocumentEngine")<
  DocumentEngine,
  {
    saveDraft: (documentId: string, content: string) => Effect.Effect<any, Error, CurrentUser>;
    commitVersion: (documentId: string, message: string) => Effect.Effect<any, Error, CurrentUser>;
    submitForReview: (documentId: string) => Effect.Effect<any, Error, CurrentUser>;
    reviewDocument: (documentId: string, approve: boolean, comment?: string) => Effect.Effect<any, Error, CurrentUser | NotificationEngine>;
  }
>() {}

export const DocumentEngineLive = Layer.succeed(
  DocumentEngine,
  DocumentEngine.of({
    saveDraft: (documentId, content) => Effect.gen(function* (_) {
      const user = yield* _(CurrentUser);
      
      // Upsert draft logic using drizzle
      yield* _(Effect.promise(() => db.insert(documentDrafts).values({
        id: crypto.randomUUID(),
        documentId,
        content,
        authorId: user.id,
      }).onConflictDoUpdate({
        target: [documentDrafts.documentId, documentDrafts.authorId],
        set: { content, lastSavedAt: new Date() }
      })));
      
      return { success: true };
    }).pipe(
      Effect.withSpan("document.save_draft", {
        attributes: { "document.id": documentId }
      })
    ),
    
    commitVersion: (documentId, message) => Effect.gen(function* (_) {
      const user = yield* _(CurrentUser);
      
      // Get current draft
      const drafts = yield* _(Effect.promise(() => db.select().from(documentDrafts).where(eq(documentDrafts.documentId, documentId))));
      if (drafts.length === 0) return yield* _(Effect.fail(new Error("No draft found to commit.")));
      
      const content = drafts[0].content;
      
      // Create version
      yield* _(Effect.promise(() => db.insert(documentVersions).values({
        id: crypto.randomUUID(),
        documentId,
        content,
        commitMessage: message,
        authorId: user.id
      })));
      
      return { success: true };
    }).pipe(
      Effect.withSpan("document.commit_version", {
        attributes: { "document.id": documentId, "commit.message": message }
      })
    ),
    
    submitForReview: (documentId) => Effect.gen(function* (_) {
      yield* _(requireRole(["writer", "editor", "formatter"]));
      
      yield* _(Effect.promise(() => db.update(documents).set({ status: 'in_review' }).where(eq(documents.id, documentId))));
      return { success: true };
    }).pipe(
      Effect.withSpan("document.submit_for_review", {
        attributes: { "document.id": documentId }
      })
    ),
    
    reviewDocument: (documentId, approve, comment) => Effect.gen(function* (_) {
      const user = yield* _(requireRole(["overseer", "editor", "editor-in-chief", "approver"]));
      const notifications = yield* _(NotificationEngine);
      
      // Get latest version
      const versions = yield* _(Effect.promise(() => db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId)).orderBy(documentVersions.createdAt)));
      const latestVersion = versions[versions.length - 1];

      if (comment) {
        yield* _(Effect.promise(() => db.insert(documentComments).values({
          id: crypto.randomUUID(),
          versionId: latestVersion.id,
          authorId: user.id,
          content: comment
        })));
      }

      if (approve) {
        yield* _(Effect.promise(() => db.update(documents).set({ status: 'approved' }).where(eq(documents.id, documentId))));
        // Notify of approval
        yield* _(notifications.publish({
          type: "APPROVAL",
          userId: latestVersion?.authorId || "test-writer-id",
          message: `Your document "${documentId}" has been approved!`,
          timestamp: new Date()
        }));
      } else {
        yield* _(Effect.promise(() => db.update(documents).set({ status: 'rejected' }).where(eq(documents.id, documentId))));
        // Notify of rejection
        yield* _(notifications.publish({
          type: "REJECTION",
          userId: latestVersion?.authorId || "test-writer-id",
          message: `Your document "${documentId}" was rejected. Please revise comments.`,
          timestamp: new Date()
        }));
      }

      return { success: true };
    }).pipe(
      Effect.withSpan("document.review", {
        attributes: { "document.id": documentId, "review.verdict": approve ? "approve" : "reject" }
      })
    )
  })
);
